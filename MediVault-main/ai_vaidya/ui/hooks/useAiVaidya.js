// AI-Vaidya — useAiVaidya.js | MediVault Platform

import { useState, useCallback, useRef } from 'react';

// Use a relative fetch so it hits the Next.js API route on the same server,
// not the external backend URL stored in apiClient's baseURL.
async function postAiVaidyaQuery(payload) {
  const token = typeof window !== 'undefined' ? localStorage.getItem('mv_token') : null;
  const res = await fetch('/api/ai-vaidya/query', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const err = Object.assign(new Error('AI query failed'), { response: { status: res.status, data: await res.json().catch(() => ({})) } });
    throw err;
  }
  return res.json();
}

const MAX_HISTORY_TURNS = 10;

function makeId() {
  return Math.random().toString(36).slice(2, 10);
}

/**
 * Main chat hook. Manages message state and API communication.
 *
 * portalContext — object from usePortalContext()
 */
export function useAiVaidya(portalContext) {
  const [messages, setMessages]                   = useState([]);
  const [isLoading, setIsLoading]                 = useState(false);
  const [error, setError]                         = useState(null);
  const [conversationHistory, setConvHistory]     = useState([]);

  // Track the last user query for retry
  const lastQueryRef = useRef({ query: null, file: null });

  // ── Add a message to the list ──────────────────────────────────────────────
  const addMessage = useCallback((role, content, extras = {}) => {
    const msg = {
      id:        makeId(),
      role,
      content,
      timestamp: new Date(),
      sources:   extras.sources    || null,
      disclaimer:extras.disclaimer || null,
      urgency:   extras.urgency    || 'normal',
    };
    setMessages(prev => [...prev, msg]);
    return msg;
  }, []);

  // ── Core send logic ────────────────────────────────────────────────────────
  const _doSend = useCallback(async (query, uploadedFile) => {
    if (!query?.trim() && !uploadedFile) return;
    setError(null);

    // 1. Add user message immediately
    addMessage('user', query || '📎 Document attached');

    // 2. Trim conversation history to last MAX_HISTORY_TURNS turns
    const historyToSend = conversationHistory.slice(-MAX_HISTORY_TURNS);

    // 3. Show loading bubble
    const loadingId = makeId();
    setMessages(prev => [...prev, { id: loadingId, role: 'loading' }]);
    setIsLoading(true);

    try {
      // 4. POST to the AI-Vaidya API endpoint
      const payload = {
        query:                query || '',
        portal_id:            portalContext?.portalId,
        patient_id:           portalContext?.patientId,
        conversation_history: historyToSend,
      };

      if (uploadedFile) {
        payload.file = {
          data:     uploadedFile.base64,
          mimeType: uploadedFile.mimeType,
          name:     uploadedFile.name,
        };
      }

      const data = await postAiVaidyaQuery(payload);

      // 5. Remove loading bubble, add AI response
      setMessages(prev => {
        const filtered = prev.filter(m => m.id !== loadingId);
        return [
          ...filtered,
          {
            id:         makeId(),
            role:       'assistant',
            content:    data.response || 'Sorry, I could not generate a response.',
            timestamp:  new Date(),
            sources:    data.sources    || null,
            disclaimer: data.disclaimer || null,
            urgency:    data.urgency    || 'normal',
          },
        ];
      });

      // 6. Update conversation history — keep at most MAX_HISTORY_TURNS * 2 entries
      //    so the state never grows unbounded across a long chat session.
      setConvHistory(prev => {
        const updated = [
          ...prev,
          { role: 'user',      content: query || '' },
          { role: 'assistant', content: data.response || '' },
        ];
        return updated.slice(-(MAX_HISTORY_TURNS * 2));
      });

    } catch (err) {
      // Remove loading bubble, show error message
      setMessages(prev => {
        const filtered = prev.filter(m => m.id !== loadingId);
        const isRateLimit = err?.response?.status === 429;
        const is403       = err?.response?.status === 403;
        const errText = isRateLimit
          ? 'Too many requests. Please wait a moment before sending another message.'
          : is403
          ? (err?.response?.data?.message || 'Access denied for this type of query.')
          : 'I\'m having a little trouble right now. Please try again in a moment, or contact your doctor directly for urgent queries.';

        return [
          ...filtered,
          {
            id:         makeId(),
            role:       'assistant',
            content:    errText,
            timestamp:  new Date(),
            sources:    null,
            disclaimer: null,
            urgency:    'normal',
          },
        ];
      });
      setError(err?.message || 'Unknown error');
    } finally {
      setIsLoading(false);
    }
  }, [addMessage, conversationHistory, portalContext]);

  // ── Public: sendMessage ────────────────────────────────────────────────────
  const sendMessage = useCallback((query, uploadedFile = null) => {
    lastQueryRef.current = { query, file: uploadedFile };
    return _doSend(query, uploadedFile);
  }, [_doSend]);

  // ── Public: retryLastMessage ───────────────────────────────────────────────
  const retryLastMessage = useCallback(() => {
    const { query, file } = lastQueryRef.current;
    if (query || file) {
      return _doSend(query, file);
    }
  }, [_doSend]);

  // ── Public: clearConversation ──────────────────────────────────────────────
  const clearConversation = useCallback(() => {
    setMessages([]);
    setConvHistory([]);
    setError(null);
    lastQueryRef.current = { query: null, file: null };
  }, []);

  return {
    messages,
    isLoading,
    error,
    sendMessage,
    clearConversation,
    retryLastMessage,
    hasMessages: messages.filter(m => m.role !== 'loading').length > 0,
  };
}
