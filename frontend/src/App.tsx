import { useState, useCallback, useEffect, useRef } from 'react';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import QAPanel from './components/QAPanel';
import DocumentPanel from './components/DocumentPanel';
import DocumentBrowsePanel from './components/DocumentBrowsePanel';
import BookmarkPanel from './components/BookmarkPanel';
import HistoryPanel from './components/HistoryPanel';
import AboutPanel from './components/AboutPanel';
import SystemPanel from './components/SystemPanel';
import SettingsPanel from './components/SettingsPanel';
import LoginPage from './components/LoginPage';
import StatusBar from './components/StatusBar';
import { ToastContainer, toast } from './components/Toast';
import ErrorBoundary from './components/ErrorBoundary';
import { AppSettingsProvider, useAppSettings } from './appSettings';
import { useApi } from './hooks/useApi';
import { useConfig } from './hooks/useConfig';
import { useChatStorage } from './hooks/useChatStorage';
import type { DocumentInfo, ChatMessage, AuthState } from './types';

type ViewType = 'qa' | 'kb' | 'browse' | 'bookmarks' | 'history' | 'about' | 'system' | 'settings';

export default function App() {
  return <AppSettingsProvider><AppContent /></AppSettingsProvider>;
}

function AppContent() {
  const api = useApi();
  const { t } = useAppSettings();

  const [auth, setAuth] = useState<AuthState | null>(() => {
    try { const s = sessionStorage.getItem('rag-auth'); return s ? JSON.parse(s) : null; } catch { return null; }
  });
  const [authChecking, setAuthChecking] = useState(true);
  const [transitioning, setTransitioning] = useState(false);

  const { config, configError, modeSwitching, toggleMode, loadConfig } = useConfig();

  const [activeView, setActiveView] = useState<ViewType>('qa');
  const [documents, setDocuments] = useState<DocumentInfo[]>([]);

  const currentUser = auth?.username || '';
  const chat = useChatStorage(currentUser);

  const [isStreaming, setIsStreaming] = useState(false);
  const [lastFailedQuestion, setLastFailedQuestion] = useState('');
  const abortRef = useRef<(() => void) | null>(null);
  const lastQuestionRef = useRef<string>('');

  useEffect(() => {
    if (!auth?.token) { setAuthChecking(false); return; }
    api.me(auth.token).then(r => {
      if (r?.valid) setAuth({ token: auth.token, username: r.username, role: r.role as 'admin' | 'user' });
      else { sessionStorage.removeItem('rag-auth'); setAuth(null); }
      setAuthChecking(false);
    }).catch(() => { sessionStorage.removeItem('rag-auth'); setAuth(null); setAuthChecking(false); });
  }, []);

  const loadDocuments = useCallback(async () => { const docs = await api.listDocuments(); if (docs) setDocuments(docs); }, []);
  useEffect(() => { loadDocuments(); }, []);
  useEffect(() => { if (auth?.token) loadConfig(); }, [documents.length]);

  const handleLogin = async (username: string, password: string): Promise<boolean> => {
    try {
      const result = await api.login(username, password);
      if (!result) return false;
      const a: AuthState = { token: result.token, username: result.username, role: result.role as 'admin' | 'user' };
      setTransitioning(true);
      await new Promise(r => setTimeout(r, 350));
      setAuth(a); sessionStorage.setItem('rag-auth', JSON.stringify(a));
      setTimeout(() => setTransitioning(false), 100);
      setTimeout(() => loadConfig(), 0);
      return true;
    } catch {
      throw new Error('network'); // caught by LoginPage to show network error message
    }
  };

  const handleLogout = async () => {
    if (auth?.token) await api.authLogoutFn(auth.token);
    if (auth?.username) chat.clear();
    sessionStorage.removeItem('rag-auth');
    setAuth(null); setTransitioning(false);
  };

  const handleUploadComplete = (results: any[]) => {
    setDocuments(prev => [...results.map((r: any) => ({
      id: r.id, filename: r.filename, file_type: r.file_type,
      file_size_bytes: r.file_size_bytes, chunk_count: r.chunk_count, uploaded_at: r.uploaded_at,
    })), ...prev]);
    toast('success', t('已上传 {count} 份文档', { count: results.length }));
    setActiveView('kb'); loadConfig();
  };

  const handleDelete = async (id: string) => {
    const ok = await api.deleteDocument(id);
    if (ok) { setDocuments(prev => prev.filter(d => d.id !== id)); toast('info', t('doc.deleted')); }
  };

  const handleAsk = (question: string) => {
    if (abortRef.current) abortRef.current();
    setIsStreaming(true); lastQuestionRef.current = question;
    const userMsg: ChatMessage = { role: 'user', content: question };
    const aiMsg: ChatMessage = { role: 'assistant', content: '', isStreaming: true, sources: [] };
    chat.setMessages(prev => [...prev, userMsg, aiMsg]);
    let capturedSources: ChatMessage['sources'] = [];
    const currentSessionId = chat.sessionRef.current;

    const abort = api.askQuestionStream(question, 5, {
      onToken: (text) => chat.setMessages(prev => { const u = [...prev]; const l = u[u.length - 1]; if (l?.role === 'assistant') u[u.length - 1] = { ...l, content: l.content + text }; return u; }),
      onSources: (sources) => { capturedSources = sources; chat.setMessages(prev => { const u = [...prev]; const l = u[u.length - 1]; if (l?.role === 'assistant') u[u.length - 1] = { ...l, sources }; return u; }); },
      onDone: (mode, processingTimeMs, newSessionId) => {
        setIsStreaming(false); setLastFailedQuestion('');
        if (newSessionId) chat.onStreamDone(newSessionId);
        const wasAborted = mode === 'aborted';
        chat.setMessages(prev => { const u = [...prev]; const l = u[u.length - 1];
          if (l?.role === 'assistant') u[u.length - 1] = { ...l, isStreaming: false, mode: wasAborted ? (l.mode || 'mock') : (mode as 'llm' | 'mock'), sources: capturedSources, processingTimeMs, content: wasAborted ? (l.content || '') + `\n\n*[${t('已中止')}]*` : l.content };
          return u; });
        abortRef.current = null;
      },
      onError: (message) => {
        setIsStreaming(false); const failedQ = lastQuestionRef.current; setLastFailedQuestion(failedQ);
        const displayMsg = (message.includes('timeout') || message.includes('超时')) ? t('qa.timeout')
                        : (message.includes('网络') || message.includes('Network')) ? t('qa.networkError')
                        : `❌ ${message}`;
        chat.setMessages(prev => { const u = [...prev]; const l = u[u.length - 1]; if (l?.role === 'assistant') u[u.length - 1] = { ...l, isStreaming: false, content: displayMsg, mode: 'mock' as const }; return u; });
        abortRef.current = null;
      },
    }, currentSessionId);
    abortRef.current = abort;
  };

  const handleNewChat = () => {
    if (abortRef.current) abortRef.current();
    chat.clear();
    setIsStreaming(false);
  };

  const handleLoadSession = async (sid: string) => {
    if (abortRef.current) abortRef.current(); setIsStreaming(false);
    const data = await api.loadSessionMessages(sid);
    if (!data) return;
    const msgs = data.messages.map((m: any) => ({ role: m.role as 'user' | 'assistant', content: m.content, isStreaming: false }));
    chat.loadSession(msgs, sid);
    setActiveView('qa');
  };

  const handleNavigate = (view: ViewType) => {
    if ((view === 'kb' || view === 'system') && auth?.role !== 'admin') return;
    setActiveView(view);
  };

  if (authChecking) return <div className="h-screen" style={{ backgroundColor: 'var(--bg)' }} />;
  if (!auth) return <LoginPage onLogin={handleLogin} transitioning={transitioning} />;

  return (
    <ErrorBoundary>
      <div className="h-screen flex overflow-hidden animate-fade-in-up" style={{ backgroundColor: 'var(--bg)' }}>
        <Sidebar activeView={activeView} onNavigate={handleNavigate} config={config}
          mockMode={config?.mock_llm ?? true} configError={configError}
          modeSwitching={modeSwitching} onToggleMode={toggleMode} role={auth.role}
        />
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
          <Header activeView={activeView} docCount={documents.length} msgCount={chat.messages.length}
            username={auth?.username} role={auth?.role}
            onNewChat={chat.messages.length > 0 ? handleNewChat : undefined}
            onLogout={handleLogout}
          />
          <main className="flex-1 px-6 py-5 flex flex-col min-h-0 overflow-hidden">
            {activeView === 'qa' && (<section className="flex-1 flex flex-col min-h-0 overflow-hidden"><div className="flex-1 flex flex-col min-h-0 max-w-3xl mx-auto w-full overflow-hidden"><QAPanel messages={chat.messages} isStreaming={isStreaming} hasDocuments={documents.length > 0} docCount={documents.length} onAsk={handleAsk} onCancelStream={() => { if (abortRef.current) abortRef.current(); }} mockMode={config?.mock_llm ?? true} lastFailedQuestion={lastFailedQuestion} /></div></section>)}
            {activeView === 'kb' && (<section className="flex-1 flex flex-col min-h-0 overflow-hidden"><div className="flex-1 min-h-0 max-w-3xl mx-auto w-full flex flex-col overflow-hidden"><DocumentPanel documents={documents} uploading={false} onUploadComplete={handleUploadComplete} onDelete={handleDelete} onReplace={(id, d) => { setDocuments(prev => prev.map(x => x.id === id ? d : x)); loadConfig(); }} onRefresh={loadDocuments} /></div></section>)}
            {activeView === 'browse' && (<section className="flex-1 flex flex-col min-h-0 overflow-hidden"><div className="flex-1 min-h-0 max-w-3xl mx-auto w-full flex flex-col overflow-hidden"><DocumentBrowsePanel documents={documents} onRefresh={loadDocuments} /></div></section>)}
            {activeView === 'bookmarks' && (<section className="flex-1 flex flex-col min-h-0 overflow-hidden"><div className="flex-1 min-h-0 max-w-3xl mx-auto w-full flex flex-col overflow-hidden"><BookmarkPanel /></div></section>)}
            {activeView === 'history' && (<section className="flex-1 flex flex-col min-h-0 overflow-hidden"><div className="flex-1 min-h-0 max-w-3xl mx-auto w-full flex flex-col overflow-hidden"><HistoryPanel onLoadSession={handleLoadSession} onDeleteCurrentSession={() => { chat.clear(); setIsStreaming(false); }} /></div></section>)}
            {activeView === 'about' && (<section className="flex-1 flex flex-col min-h-0 overflow-hidden"><div className="flex-1 min-h-0 max-w-2xl mx-auto w-full flex flex-col overflow-hidden"><AboutPanel /></div></section>)}
            {activeView === 'system' && (<section className="flex-1 flex flex-col min-h-0 overflow-hidden"><div className="flex-1 min-h-0 max-w-3xl mx-auto w-full flex flex-col overflow-hidden"><SystemPanel /></div></section>)}
            {activeView === 'settings' && (<section className="flex-1 flex flex-col min-h-0 overflow-hidden"><div className="flex-1 min-h-0 max-w-xl mx-auto w-full flex flex-col overflow-hidden"><SettingsPanel /></div></section>)}
          </main>
          <StatusBar />
        </div>
        <ToastContainer />
      </div>
    </ErrorBoundary>
  );
}
