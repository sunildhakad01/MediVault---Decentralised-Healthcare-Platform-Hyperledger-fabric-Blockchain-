// AI-Vaidya — MessageBubble.jsx | MediVault Platform

import { useState } from 'react';
import AiVaidyaAvatar from './AiVaidyaAvatar';
import { FiChevronDown, FiChevronUp, FiAlertTriangle } from 'react-icons/fi';

/**
 * Renders a single chat message.
 *
 * message shape:
 *   id          string
 *   role        "user" | "assistant" | "loading"
 *   content     string  (supports basic markdown: **bold**, line breaks)
 *   timestamp   Date
 *   sources     string[]   (optional)
 *   disclaimer  string     (optional)
 *   urgency     "normal" | "urgent" | "emergency"
 */
export default function MessageBubble({ message }) {
  const [sourcesOpen, setSourcesOpen] = useState(false);

  if (message.role === 'loading') {
    return (
      <div className="flex items-end gap-2 aivaidya-message-appear mb-3">
        <AiVaidyaAvatar size={24} showPulse />
        <div className="bg-gray-50 border border-gray-100 rounded-2xl rounded-bl-sm px-4 py-3 flex items-center gap-1">
          <span className="aivaidya-typing-dot w-2 h-2 rounded-full bg-emerald-400 inline-block" />
          <span className="aivaidya-typing-dot w-2 h-2 rounded-full bg-emerald-400 inline-block" />
          <span className="aivaidya-typing-dot w-2 h-2 rounded-full bg-emerald-400 inline-block" />
        </div>
      </div>
    );
  }

  /* ── Emergency message ── */
  if (message.urgency === 'emergency') {
    return (
      <div className="aivaidya-message-appear mb-3 w-full">
        <div className="bg-red-500 rounded-2xl px-4 py-3 text-white">
          <div className="flex items-center gap-2 mb-2">
            <FiAlertTriangle className="w-5 h-5 flex-shrink-0" />
            <span className="font-bold text-sm">Emergency Alert</span>
          </div>
          <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.content}</p>
        </div>
        <Timestamp ts={message.timestamp} align="left" />
      </div>
    );
  }

  /* ── User message ── */
  if (message.role === 'user') {
    return (
      <div className="aivaidya-message-appear mb-3 flex flex-col items-end">
        <div
          className="max-w-[80%] bg-emerald-500 text-white rounded-2xl rounded-br-sm px-4 py-2.5 text-sm leading-relaxed"
        >
          {message.content}
        </div>
        <Timestamp ts={message.timestamp} align="right" />
      </div>
    );
  }

  /* ── AI message ── */
  return (
    <div className="aivaidya-message-appear mb-3 flex flex-col items-start">
      <div className="flex items-end gap-2 max-w-[88%]">
        <AiVaidyaAvatar size={24} />
        <div className="bg-gray-50 border border-gray-100 rounded-2xl rounded-bl-sm px-4 py-2.5 text-sm text-gray-800 leading-relaxed">
          <FormattedContent text={message.content} />
        </div>
      </div>

      {/* Disclaimer */}
      {message.disclaimer && (
        <p className="ml-8 mt-1 text-xs text-gray-400 italic leading-snug max-w-[85%]">
          {message.disclaimer}
        </p>
      )}

      {/* Sources toggle */}
      {message.sources && message.sources.length > 0 && (
        <div className="ml-8 mt-1">
          <button
            onClick={() => setSourcesOpen(v => !v)}
            className="flex items-center gap-1 text-xs text-emerald-600 hover:text-emerald-700 transition-colors"
          >
            {sourcesOpen ? <FiChevronUp className="w-3 h-3" /> : <FiChevronDown className="w-3 h-3" />}
            {message.sources.length} source{message.sources.length > 1 ? 's' : ''}
          </button>
          {sourcesOpen && (
            <ul className="mt-1 space-y-0.5">
              {message.sources.map((src, i) => (
                <li key={i} className="text-xs text-gray-500 flex items-center gap-1">
                  <span className="w-1 h-1 rounded-full bg-emerald-400 inline-block flex-shrink-0" />
                  {src}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      <Timestamp ts={message.timestamp} align="left" extraClass="ml-8" />
    </div>
  );
}

/* ── Timestamp ── */
function Timestamp({ ts, align, extraClass = '' }) {
  if (!ts) return null;
  const label = new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  return (
    <p className={`mt-0.5 text-[10px] text-gray-400 ${align === 'right' ? 'text-right' : 'text-left'} ${extraClass}`}>
      {label}
    </p>
  );
}

/* ── Simple markdown renderer (bold, line breaks) ── */
function FormattedContent({ text }) {
  if (!text) return null;

  // Split into paragraphs first
  const paragraphs = text.split(/\n\n+/);

  return (
    <>
      {paragraphs.map((para, pi) => {
        // Check if it's a bullet list paragraph
        const lines = para.split('\n');
        const isList = lines.some(l => /^[\u2022\-\*]\s/.test(l.trim()) || /^\d+\.\s/.test(l.trim()));

        if (isList) {
          return (
            <ul key={pi} className="list-none space-y-0.5 my-1">
              {lines.map((line, li) => {
                const cleaned = line.replace(/^[\u2022\-\*]\s/, '').replace(/^\d+\.\s/, '');
                if (!cleaned.trim()) return null;
                return (
                  <li key={li} className="flex items-start gap-1.5">
                    <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-emerald-400 flex-shrink-0" />
                    <span>{renderInline(cleaned)}</span>
                  </li>
                );
              })}
            </ul>
          );
        }

        return (
          <p key={pi} className={pi > 0 ? 'mt-2' : ''}>
            {lines.map((line, li) => (
              <span key={li}>
                {renderInline(line)}
                {li < lines.length - 1 && <br />}
              </span>
            ))}
          </p>
        );
      })}
    </>
  );
}

/* Renders **bold** inline */
function renderInline(text) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, i) => {
    if (/^\*\*[^*]+\*\*$/.test(part)) {
      return <strong key={i} className="font-semibold text-gray-900">{part.slice(2, -2)}</strong>;
    }
    return part;
  });
}
