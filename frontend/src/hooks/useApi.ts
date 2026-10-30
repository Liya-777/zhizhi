import { translateUi } from '../appSettings';
import { useState, useCallback } from 'react';
import type { DocumentInfo, AnswerResponse, HealthResponse, ConfigState, SourceCitation, SessionInfo, DocumentPreview, Bookmark, AuthState } from '../types';

const BASE = '/api';

/** Read auth token from sessionStorage (set by App on login). */
function getAuthToken(): string {
  try {
    const raw = sessionStorage.getItem('rag-auth');
    if (!raw) return '';
    const auth = JSON.parse(raw);
    return auth.token || '';
  } catch { return ''; }
}

/** Append token query param to URL. */
function withToken(url: string): string {
  const token = getAuthToken();
  if (!token) return url;
  const sep = url.includes('?') ? '&' : '?';
  return `${url}${sep}token=${encodeURIComponent(token)}`;
}

async function request<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${url}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  if (!res.ok) {
    // 401 on non-login endpoints → token expired. Clear auth and reload.
    if (res.status === 401 && !url.includes('/auth/')) {
      sessionStorage.removeItem('rag-auth');
      window.location.reload();
      throw new Error(translateUi('登录已过期，页面即将刷新…'));
    }
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(err.detail || `Request failed: ${res.status}`);
  }
  return res.json();
}

/** Callbacks for streaming SSE answer */
export interface StreamCallbacks {
  onToken: (text: string) => void;
  onSources: (sources: SourceCitation[]) => void;
  onDone: (mode: string, processingTimeMs: number, sessionId?: string | null) => void;
  onError: (message: string) => void;
}

export function useApi() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const call = useCallback(async <T>(fn: () => Promise<T>): Promise<T | null> => {
    setLoading(true);
    setError(null);
    try {
      const result = await fn();
      return result;
    } catch (e: any) {
      setError(e.message);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const uploadDocument = useCallback(
    (file: File) => call(() => {
      const form = new FormData();
      form.append('file', file);
      const url = withToken(`${BASE}/documents/upload`);
      return fetch(url, { method: 'POST', body: form }).then(r => {
        if (!r.ok) return r.json().then(e => { throw new Error(e.detail); });
        return r.json();
      });
    }),
    [call]
  );

  const listDocuments = useCallback(() => call<DocumentInfo[]>(() => request(withToken('/documents'))), [call]);
  const deleteDocument = useCallback((id: string) => call(() => request(withToken(`/documents/${id}`), { method: 'DELETE' })), [call]);
  const replaceDocument = useCallback((id: string, file: File) => call(() => {
    const form = new FormData();
    form.append('file', file);
    const url = withToken(`${BASE}/documents/${id}`);
    return fetch(url, { method: 'PUT', body: form }).then(r => {
      if (!r.ok) return r.json().then(e => { throw new Error(e.detail); });
      return r.json();
    });
  }), [call]);

  const askQuestion = useCallback((question: string, topK = 5) =>
    call<AnswerResponse>(() => request(withToken('/qa/ask'), { method: 'POST', body: JSON.stringify({ question, top_k: topK }) })),
    [call]
  );

  /** Stream an answer via SSE. Returns an abort function to cancel the stream. */
  const askQuestionStream = useCallback(
    (question: string, topK: number, callbacks: StreamCallbacks, sessionId?: string | null): (() => void) => {
      const abortController = new AbortController();
      let timedOut = false;

      // 120s timeout — prevent stuck connections
      const timeoutId = setTimeout(() => {
        timedOut = true;
        abortController.abort();
        callbacks.onError(translateUi('请求超时（120秒），请简化问题或稍后重试'));
      }, 120_000);

      const params = new URLSearchParams({ question, top_k: String(topK) });
      if (sessionId) params.set('session_id', sessionId);
      const token = getAuthToken();
      if (token) params.set('token', token);
      const url = `${BASE}/qa/ask-stream?${params.toString()}`;

      fetch(url, { signal: abortController.signal })
        .then(async (response) => {
          if (!response.ok) {
            clearTimeout(timeoutId);
            const err = await response.json().catch(() => ({ detail: response.statusText }));
            callbacks.onError(err.detail || `请求失败: ${response.status}`);
            return;
          }
          const reader = response.body?.getReader();
          if (!reader) {
            clearTimeout(timeoutId);
            callbacks.onError(translateUi('浏览器不支持流式读取'));
            return;
          }
          const decoder = new TextDecoder();
          let buffer = '';
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split('\n');
            buffer = lines.pop() || '';
            for (const line of lines) {
              if (line.startsWith('data: ')) {
                try {
                  const data = JSON.parse(line.slice(6));
                  switch (data.type) {
                    case 'token':
                      callbacks.onToken(data.text);
                      break;
                    case 'sources':
                      callbacks.onSources(data.sources);
                      break;
                    case 'done':
                      clearTimeout(timeoutId);
                      callbacks.onDone(data.mode, data.processing_time_ms, data.session_id || null);
                      break;
                    case 'error':
                      clearTimeout(timeoutId);
                      callbacks.onError(data.message);
                      break;
                  }
                } catch {
                  // Skip malformed JSON lines
                }
              }
            }
          }
        })
        .catch((err) => {
          clearTimeout(timeoutId);
          if (err.name === 'AbortError') {
            if (!timedOut) {
              // User-initiated stop — fire onDone so the app resumes
              callbacks.onDone('aborted', 0, null);
            }
            return;
          }
          callbacks.onError(err.message || translateUi('网络请求失败'));
        });

      return () => {
        clearTimeout(timeoutId);
        abortController.abort();
      };
    },
    []
  );
  const getHealth = useCallback(() => call<HealthResponse>(() => request('/health')), [call]);

  const getConfig = useCallback(() => call<ConfigState>(() => request(withToken('/config'))), [call]);
  const setMockMode = useCallback((mockLl: boolean) =>
    call<{ mock_llm: boolean; message: string }>(() =>
      request(withToken('/config/mode'), { method: 'POST', body: JSON.stringify({ mock_llm: mockLl }) })
    ), [call]);

  // Document preview
  const getDocumentPreview = useCallback(
    (docId: string, chunks = 3) => call<DocumentPreview>(() => request(withToken(`/documents/${docId}/preview?chunks=${chunks}`))),
    [call]
  );

  /** Batch upload with SSE progress. Returns an abort function. */
  const uploadDocumentsBatch = useCallback(
    (files: File[], onProgress: (event: any) => void): (() => void) => {
      const abortController = new AbortController();
      const form = new FormData();
      files.forEach(f => form.append('files', f));

      fetch(withToken(`${BASE}/documents/upload-batch`), {
        method: 'POST',
        body: form,
        signal: abortController.signal,
      })
        .then(async (res) => {
          if (!res.ok) {
            const err = await res.json().catch(() => ({ detail: res.statusText }));
            onProgress({ type: 'error', message: err.detail });
            return;
          }
          const { batch_id } = await res.json();
          // Open SSE progress stream
          const progressUrl = `${BASE}/documents/upload-progress/${batch_id}`;
          const progressRes = await fetch(progressUrl, { signal: abortController.signal });
          const reader = progressRes.body?.getReader();
          if (!reader) return;
          const decoder = new TextDecoder();
          let buffer = '';
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split('\n');
            buffer = lines.pop() || '';
            for (const line of lines) {
              if (line.startsWith('data: ')) {
                try {
                  const data = JSON.parse(line.slice(6));
                  onProgress(data);
                } catch { /* skip */ }
              }
            }
          }
        })
        .catch((err) => {
          if (err.name !== 'AbortError') {
            onProgress({ type: 'error', message: err.message });
          }
        });

      return () => abortController.abort();
    },
    []
  );

  // Session management — per-user, token-authenticated
  const createSession = useCallback(() =>
    call<{ session_id: string }>(() => request(withToken('/qa/sessions'), { method: 'POST' })),
    [call]
  );
  const listSessions = useCallback(() =>
    call<SessionInfo[]>(() => request(withToken('/qa/sessions'))),
    [call]
  );
  const deleteSession = useCallback((id: string) =>
    call(() => request(withToken(`/qa/sessions/${id}`), { method: 'DELETE' })),
    [call]
  );
  const loadSessionMessages = useCallback((id: string) =>
    call<{ session_id: string; messages: { role: string; content: string }[] }>(() => request(withToken(`/qa/sessions/${id}/messages`))),
    [call]
  );

  // Bookmarks — per-user, token-authenticated
  const saveBookmark = useCallback((question: string, answer: string, sources: SourceCitation[] = [], docNames: string[] = []) =>
    call<Bookmark>(() => request(withToken('/bookmarks'), { method: 'POST', body: JSON.stringify({ question, answer, sources, doc_names: docNames }) })),
    [call]
  );
  const getBookmarks = useCallback(() => call<Bookmark[]>(() => request(withToken('/bookmarks'))), [call]);
  const deleteBookmark = useCallback((id: string) => call(() => request(withToken(`/bookmarks/${id}`), { method: 'DELETE' })), [call]);

  // login bypasses `call()` so LoginPage can distinguish network errors from wrong password
  const login = useCallback(async (username: string, password: string) => {
    try {
      const res = await fetch(`${BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });
      if (res.status === 401) return null; // wrong credentials — not a network error
      if (!res.ok) throw new Error(`登录失败: ${res.status}`);
      return await res.json() as { token: string; role: string; username: string };
    } catch {
      throw new Error('network'); // network error — LoginPage catches this
    }
  }, []);
  const me = useCallback((token: string) =>
    call<AuthState & { valid: boolean }>(() => request('/auth/me?token=' + encodeURIComponent(token))), [call]);
  const authLogoutFn = useCallback((token: string) =>
    call(() => request('/auth/logout?token=' + encodeURIComponent(token), { method: 'POST' })), [call]);

  // System management (admin)
  const getSystemStatus = useCallback(() =>
    call<{ pid: number; status: string; uptime: string; uptime_seconds: number; port: number; embedding_loaded: boolean; embedding_model: string; llm_mode: string; llm_model: string; documents_count: number; log_tail: string[] }>(() => request(withToken('/system/status'))), [call]
  );
  const restartServer = useCallback(() =>
    call<{ status: string; message: string }>(() => request(withToken('/system/restart'), { method: 'POST' })), [call]
  );
  const stopServer = useCallback(() =>
    call<{ status: string; message: string }>(() => request(withToken('/system/stop'), { method: 'POST' })), [call]
  );

  return { loading, error, setError, uploadDocument, listDocuments, deleteDocument, replaceDocument, askQuestion, askQuestionStream, getHealth, getConfig, setMockMode, createSession, listSessions, deleteSession, loadSessionMessages, getDocumentPreview, uploadDocumentsBatch, saveBookmark, getBookmarks, deleteBookmark, login, me, authLogoutFn, getSystemStatus, restartServer, stopServer };
}
