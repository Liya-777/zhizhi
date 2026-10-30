import { useState, useEffect, useRef } from 'react';
import type { ChatMessage } from '../types';

const MSG_PREFIX = 'rag-chat-messages';
const SID_PREFIX = 'rag-chat-session';

function mk(base: string, user: string) {
  return `${base}-${user}`;
}

/** Per-user chat storage using sessionStorage. Handles message and
 *  session-id persistence across page refreshes. Isolates users so
 *  switching accounts doesn't leak chat history. */
export function useChatStorage(username: string) {
  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    if (!username) return [];
    try {
      const s = sessionStorage.getItem(mk(MSG_PREFIX, username));
      return s ? JSON.parse(s) : [];
    } catch { return []; }
  });

  const [sessionId, setSessionId] = useState<string | null>(() => {
    if (!username) return null;
    try { return sessionStorage.getItem(mk(SID_PREFIX, username)) || null; } catch { return null; }
  });

  const sessionRef = useRef<string | null>(sessionId);
  useEffect(() => { sessionRef.current = sessionId; }, [sessionId]);

  // When username changes (login/logout/switch accounts), reload from storage.
  // Track previous username to skip the no-op initial mount.
  const prevRef = useRef(username);
  useEffect(() => {
    const prev = prevRef.current;
    prevRef.current = username;
    // Initial mount or same user — don't overwrite state that was already set
    if (prev === username) return;
    if (!username) {
      setMessages([]);
      setSessionId(null);
      return;
    }
    try {
      const saved = sessionStorage.getItem(mk(MSG_PREFIX, username));
      setMessages(saved ? JSON.parse(saved) : []);
      const sid = sessionStorage.getItem(mk(SID_PREFIX, username));
      setSessionId(sid || null);
    } catch {
      setMessages([]);
      setSessionId(null);
    }
  }, [username]);

  // Persist messages
  useEffect(() => {
    if (!username) return;
    messages.length > 0
      ? sessionStorage.setItem(mk(MSG_PREFIX, username), JSON.stringify(messages))
      : sessionStorage.removeItem(mk(MSG_PREFIX, username));
  }, [messages, username]);

  // Persist sessionId
  useEffect(() => {
    if (!username) return;
    sessionId
      ? sessionStorage.setItem(mk(SID_PREFIX, username), sessionId)
      : sessionStorage.removeItem(mk(SID_PREFIX, username));
  }, [sessionId, username]);

  /** Clear chat state for this user (new chat or logout). */
  const clear = () => {
    setMessages([]);
    setSessionId(null);
    if (username) {
      sessionStorage.removeItem(mk(MSG_PREFIX, username));
      sessionStorage.removeItem(mk(SID_PREFIX, username));
    }
  };

  /** Adopt a restored session from history. */
  const loadSession = (msgs: ChatMessage[], sid: string) => {
    setMessages(msgs);
    setSessionId(sid);
    if (username) {
      sessionStorage.setItem(mk(SID_PREFIX, username), sid);
      sessionStorage.setItem(mk(MSG_PREFIX, username), JSON.stringify(msgs));
    }
  };

  /** Record a completed stream response. */
  const onStreamDone = (newSid: string) => {
    setSessionId(newSid);
    if (username) sessionStorage.setItem(mk(SID_PREFIX, username), newSid);
  };

  return {
    messages, setMessages,
    sessionId, setSessionId,
    sessionRef,
    clear, loadSession, onStreamDone,
  };
}
