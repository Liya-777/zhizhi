import { useState, useEffect, useCallback } from 'react';
import { Clock, Trash2, Loader2, MessageSquare, ChevronDown } from 'lucide-react';
import { useApi } from '../hooks/useApi';
import { toast } from './Toast';
import type { SessionInfo } from '../types';
import { useAppSettings } from '../appSettings';

interface Props {
  onLoadSession?: (sessionId: string) => void;
  onDeleteCurrentSession?: () => void;
}

export default function HistoryPanel({ onLoadSession, onDeleteCurrentSession }: Props) {
  const { t, lang } = useAppSettings();
  const [sessions, setSessions] = useState<SessionInfo[]>([]);
  const [previews, setPreviews] = useState<Record<string, string>>({});
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [sessionMessages, setSessionMessages] = useState<{ role: string; content: string }[]>([]);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const api = useApi();

  const load = useCallback(async () => {
    const s = await api.listSessions();
    if (!s) return;
    setSessions(s);
    const p: Record<string, string> = {};
    await Promise.all(s.slice(0, 10).map(async (sess) => {
      try {
        const d = await api.loadSessionMessages(sess.session_id);
        if (d) {
          const userMsgs = (d.messages || []).filter((m: any) => m.role === 'user');
          p[sess.session_id] = userMsgs.length > 0 ? userMsgs[0].content : '';
        }
      } catch { }
    }));
    setPreviews(p);
  }, []);

  useEffect(() => { load(); }, []);

  const handleToggle = async (sessionId: string) => {
    if (expandedId === sessionId) { setExpandedId(null); setSessionMessages([]); return; }
    setExpandedId(sessionId);
    setLoadingMessages(true);
    const d = await api.loadSessionMessages(sessionId);
    if (d) {
      setSessionMessages(d.messages || []);
    }
    setLoadingMessages(false);
  };

  const handleDelete = async (e: React.MouseEvent, sid: string) => {
    e.stopPropagation();
    setDeleting(sid);
    await api.deleteSession(sid);
    setSessions(prev => prev.filter(s => s.session_id !== sid));
    toast('info', t('history.deleted'));
    if (expandedId === sid) { setExpandedId(null); setSessionMessages([]); }
    setDeleting(null);
    onDeleteCurrentSession?.();
  };

  const handleRecover = () => {
    if (!expandedId || sessionMessages.length === 0) return;
    onLoadSession?.(expandedId);
  };

  return (
    <div className="flex-1 flex flex-col min-h-0 animate-fade-in">
      <div className="flex items-center gap-2 mb-4 px-1">
        <Clock className="w-4 h-4" style={{ color: "var(--text-strong)" }} />
        <h2 className="text-sm font-semibold uppercase tracking-wider" style={{ color: "var(--text-secondary)", letterSpacing: '0.05em' }}>{t('nav.history')}</h2>
        <span className="text-[10px] px-1.5 py-0.5 rounded-full font-medium" style={{ backgroundColor: 'var(--surface-muted)', color: "var(--text-secondary)" }}>{sessions.length} {t("条")}</span>
      </div>

      <div className="flex-1 overflow-y-auto min-h-0 space-y-1">
        {sessions.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Clock className="w-10 h-10 mb-4" style={{ color: "var(--text-muted)" }} />
            <p className="text-sm" style={{ color: "var(--text-secondary)" }}>{t('history.empty')}</p>
            <p className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>{t('history.hint')}</p>
          </div>
        ) : (
          <div className="animate-fade-in" key={sessions.length}>
            {sessions.map((s, idx) => {
          const isExpanded = expandedId === s.session_id;
          return (
            <div key={s.session_id} className="animate-fade-in-up" style={{ animationDelay: `${idx * 50}ms`, animationFillMode: 'both' }}>
              <button onClick={() => handleToggle(s.session_id)}
                aria-expanded={isExpanded}
                aria-label={`${isExpanded ? t('history.collapse') : t('history.expand')}`}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-all duration-200"
                style={{ backgroundColor: isExpanded ? 'var(--surface-muted)' : 'var(--surface)', border: `0.5px solid ${isExpanded ? 'var(--border-strong)' : 'var(--border)'}` }}
                onMouseEnter={e => { if (!isExpanded) e.currentTarget.style.backgroundColor = 'var(--bg)'; }}
                onMouseLeave={e => { if (!isExpanded) e.currentTarget.style.backgroundColor = 'var(--surface)'; }}
              >
                <Clock className="w-4 h-4 flex-shrink-0" style={{ color: "var(--text-muted)" }} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate" style={{ color: "var(--text-primary)" }}>{previews[s.session_id] || `${s.message_count} ${t('history.messages')}`}</p>
                  <p className="text-[10px]" style={{ color: "var(--text-muted)" }}>{s.message_count} {t('history.rounds')} · {s.last_active?.slice(5)}</p>
                </div>
                <ChevronDown className="w-4 h-4 flex-shrink-0 transition-transform duration-200" style={{ transform: isExpanded ? 'rotate(180deg)' : 'none', color: "var(--text-muted)" }} />
                <button onClick={e => handleDelete(e, s.session_id)}
                  aria-label={t('删除会话 {id}', { id: s.session_id.slice(0, 8) })}
                  className="p-1 rounded flex-shrink-0 transition-colors"
                  style={{ color: "var(--text-muted)" }}
                  onMouseEnter={e => e.currentTarget.style.color = "var(--text-danger)"}
                  onMouseLeave={e => e.currentTarget.style.color = "var(--text-muted)"}
                >
                  {deleting === s.session_id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                </button>
              </button>

              {isExpanded && (
                <div className="ml-12 mr-2 mt-1 mb-2 space-y-2 animate-spring-pop">
                  {loadingMessages ? (
                    <div className="flex items-center justify-center py-6">
                      <Loader2 className="w-5 h-5 animate-spin" style={{ color: "var(--text-muted)" }} />
                    </div>
                  ) : (
                    <>
                      {sessionMessages.map((m, i) => (
                        <div key={i} className="flex gap-2">
                          <div className="flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center" style={{ backgroundColor: m.role === 'user' ? 'var(--surface-active)' : 'var(--surface-muted)', color: m.role === 'user' ? "var(--text-strong)" : "var(--text-muted)" }}>
                            <MessageSquare className="w-3 h-3" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-[10px] font-medium mb-0.5" style={{ color: m.role === 'user' ? "var(--text-strong)" : "var(--text-muted)" }}>
                              {m.role === 'user' ? t('history.user') : 'AI'}
                            </p>
                            <p className="text-xs leading-relaxed" style={{ color: "var(--text-body)", whiteSpace: 'pre-wrap' }}>
                              {m.content.length > 300 ? m.content.slice(0, 300) + '…' : m.content}
                            </p>
                          </div>
                        </div>
                      ))}
                      <button onClick={handleRecover}
                        aria-label={t('history.restore')}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors"
                        style={{ background: 'linear-gradient(160deg, oklch(0.48 0 0) 0%, oklch(0.35 0 0) 40%, oklch(0.22 0 0) 100%)', color: 'white', border: 'none', cursor: 'pointer' }}
                      >
                        <MessageSquare className="w-3 h-3" />{t('history.restore')}
                      </button>
                    </>
                  )}
                </div>
              )}
            </div>
          );
        })}
          </div>
        )}
      </div>
    </div>
  );
}
