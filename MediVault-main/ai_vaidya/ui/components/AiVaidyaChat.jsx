// AI-Vaidya — AiVaidyaChat.jsx | MediVault Platform

import { useEffect, useRef, useState, useCallback } from 'react';
import ReactDOM from 'react-dom';
import { FiX, FiRefreshCw, FiSend, FiMoreVertical, FiTrash2, FiFile, FiImage } from 'react-icons/fi';

import AiVaidyaAvatar from './AiVaidyaAvatar';
import MessageBubble   from './MessageBubble';
import SuggestedPrompts from './SuggestedPrompts';
import FileUploadZone  from './FileUploadZone';
import { useAiVaidya }     from '../hooks/useAiVaidya';
import { usePortalContext } from '../hooks/usePortalContext';

/**
 * Main chat drawer — rendered via ReactDOM.createPortal to document.body.
 *
 * Props:
 *   isOpen   boolean
 *   onClose  () => void
 */
export default function AiVaidyaChat({ isOpen, onClose }) {
  const portalContext = usePortalContext();
  const {
    messages,
    isLoading,
    sendMessage,
    clearConversation,
    retryLastMessage,
    hasMessages,
  } = useAiVaidya(portalContext);

  const [input,        setInput]        = useState('');
  const [menuOpen,     setMenuOpen]     = useState(false);
  const [pendingFile,  setPendingFile]  = useState(null); // { base64, mimeType, name }
  const [isClosing,    setIsClosing]    = useState(false);

  const messagesEndRef = useRef(null);
  const textareaRef    = useRef(null);
  const drawerRef      = useRef(null);

  // Scroll to bottom when messages update
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Auto-focus input when drawer opens
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => textareaRef.current?.focus(), 300);
      setIsClosing(false);
    }
  }, [isOpen]);

  // Auto-expand textarea
  function handleInputChange(e) {
    setInput(e.target.value);
    const ta = e.target;
    ta.style.height = 'auto';
    ta.style.height = Math.min(ta.scrollHeight, 120) + 'px';
  }

  // Send on Enter (Shift+Enter = new line)
  function handleKeyDown(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  function handleSend() {
    const trimmed = input.trim();
    if (!trimmed && !pendingFile) return;
    sendMessage(trimmed, pendingFile);
    setInput('');
    setPendingFile(null);
    // Reset textarea height
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  }

  function handleSuggestedPrompt(prompt) {
    sendMessage(prompt, null);
  }

  function handleFileReady(base64, mimeType, name) {
    setPendingFile({ base64, mimeType, name });
  }

  // Animated close
  function handleClose() {
    setIsClosing(true);
    setTimeout(() => {
      setIsClosing(false);
      onClose();
    }, 280);
  }

  function handleClear() {
    clearConversation();
    setMenuOpen(false);
  }

  // Don't render at all when not open and not mid-close
  if (!isOpen && !isClosing) return null;

  // Prevent SSR issues with createPortal
  if (typeof document === 'undefined') return null;

  const drawerContent = (
    <>
      {/* ── Backdrop ── */}
      <div
        className={`fixed inset-0 z-[9997] bg-gray-900 bg-opacity-30 backdrop-blur-[2px] ${
          isClosing ? 'aivaidya-overlay-close' : 'aivaidya-overlay-open'
        }`}
        onClick={handleClose}
        aria-hidden="true"
      />

      {/* ── Drawer ── */}
      <div
        ref={drawerRef}
        role="dialog"
        aria-modal="true"
        aria-label="AI-Vaidya health assistant"
        className={`
          aivaidya-drawer aivaidya-container
          fixed right-0 top-0 h-screen z-[9998]
          w-[400px] bg-white border-l border-gray-200
          flex flex-col
          ${isClosing ? 'aivaidya-drawer-close' : 'aivaidya-drawer-open'}
        `}
      >
        {/* ── Header ── */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-100 flex-shrink-0">
          <AiVaidyaAvatar size={32} showPulse animated />

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-gray-800 text-sm">AI-Vaidya</span>
              {portalContext.badgeLabel && (
                <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${portalContext.badgeColor}`}>
                  {portalContext.badgeLabel}
                </span>
              )}
            </div>
            <p className="text-[10px] text-gray-400 truncate">Powered by MediVault</p>
          </div>

          {/* Menu button */}
          <div className="relative">
            <button
              onClick={() => setMenuOpen(v => !v)}
              className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
              aria-label="More options"
            >
              <FiMoreVertical className="w-4 h-4" />
            </button>
            {menuOpen && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />
                <div className="absolute right-0 top-full mt-1 w-44 bg-white border border-gray-100 rounded-xl shadow-lg z-20 py-1">
                  <button
                    onClick={handleClear}
                    className="flex items-center gap-2 w-full px-3 py-2 text-sm text-gray-600 hover:bg-gray-50 transition-colors"
                  >
                    <FiTrash2 className="w-3.5 h-3.5" />
                    Clear conversation
                  </button>
                  <button
                    onClick={() => { retryLastMessage(); setMenuOpen(false); }}
                    className="flex items-center gap-2 w-full px-3 py-2 text-sm text-gray-600 hover:bg-gray-50 transition-colors"
                  >
                    <FiRefreshCw className="w-3.5 h-3.5" />
                    Retry last message
                  </button>
                </div>
              </>
            )}
          </div>

          {/* Close button */}
          <button
            onClick={handleClose}
            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
            aria-label="Close AI-Vaidya"
          >
            <FiX className="w-4 h-4" />
          </button>
        </div>

        {/* ── Messages area ── */}
        <div className="flex-1 overflow-y-auto aivaidya-messages-scroll px-4 py-4">
          {!hasMessages && (
            <WelcomeMessage portalId={portalContext.portalId} />
          )}

          {messages.map(msg => (
            <MessageBubble key={msg.id} message={msg} />
          ))}

          <div ref={messagesEndRef} />
        </div>

        {/* ── Input area ── */}
        <div className="flex-shrink-0 border-t border-gray-100">
          {/* Pending file preview chip — rendered in the parent so it persists
              across re-renders without remounting FileUploadZone */}
          {pendingFile && (
            <div className="mx-3 mt-2 mb-1">
              <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 rounded-xl px-3 py-2">
                {pendingFile.mimeType === 'application/pdf'
                  ? <FiFile className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                  : <FiImage className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                }
                <span className="text-xs font-medium text-gray-700 truncate flex-1">{pendingFile.name}</span>
                <button
                  onClick={() => setPendingFile(null)}
                  className="text-gray-400 hover:text-red-500 transition-colors flex-shrink-0"
                  aria-label="Remove file"
                >
                  <FiX className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* Suggested prompts (first open only) */}
          <SuggestedPrompts
            prompts={portalContext.suggestedPrompts}
            onSelect={handleSuggestedPrompt}
            visible={!hasMessages}
          />

          {/* Text input row */}
          <div className="flex items-end gap-2 px-3 py-3">
            {/* File upload trigger — always render when uploads allowed so internal
                state is preserved; the pending file preview chip above shows the file */}
            {portalContext.isFileUploadAllowed && (
              <FileUploadZone
                allowedTypes={portalContext.allowedFileTypes}
                onFileReady={handleFileReady}
                onClear={() => setPendingFile(null)}
              />
            )}

            {/* Textarea */}
            <textarea
              ref={textareaRef}
              value={input}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              placeholder={portalContext.inputPlaceholder || 'Ask AI-Vaidya a health question...'}
              rows={1}
              className="
                aivaidya-textarea flex-1
                px-3 py-2 text-sm text-gray-800
                bg-gray-50 border border-gray-200 rounded-xl
                focus:outline-none focus:ring-2 focus:ring-emerald-300 focus:border-emerald-400
                placeholder-gray-400 transition-colors
              "
              disabled={isLoading}
            />

            {/* Send button */}
            <button
              onClick={handleSend}
              disabled={(!input.trim() && !pendingFile) || isLoading}
              className="
                flex-shrink-0 p-2.5 rounded-xl
                bg-emerald-500 text-white
                hover:bg-emerald-600 active:scale-95
                disabled:opacity-40 disabled:cursor-not-allowed
                transition-all duration-150
              "
              aria-label="Send message"
            >
              <FiSend className="w-4 h-4" />
            </button>
          </div>

          {/* Footer disclaimer */}
          <p className="text-center text-[10px] text-gray-400 pb-3 px-4 leading-snug">
            AI-Vaidya · Powered by MediVault · Not a substitute for professional advice
          </p>
        </div>
      </div>
    </>
  );

  return ReactDOM.createPortal(drawerContent, document.body);
}

/* ── Welcome message shown before any conversation ── */
function WelcomeMessage({ portalId }) {
  const messages = {
    patient:  "Hello! I'm AI-Vaidya, your personal health assistant. Ask me about medicines, symptoms, or your health records. I'm here to help!",
    doctor:   "Hello, Doctor. I'm AI-Vaidya, your clinical decision support assistant. How can I help with your patient today?",
    hospital: "Hello! I'm AI-Vaidya. I can help with ward-level patient management, clinical decisions, and drug safety checks.",
    admin:    "Hello! I'm AI-Vaidya. I can provide platform analytics, usage summaries, and compliance reports.",
  };

  const text = messages[portalId] || messages.patient;

  return (
    <div className="flex flex-col items-center justify-center py-8 text-center gap-4">
      <AiVaidyaAvatar size={64} animated showPulse />
      <div>
        <h3 className="font-semibold text-gray-800 text-sm mb-1">AI-Vaidya</h3>
        <p className="text-xs text-gray-500 max-w-[280px] leading-relaxed">{text}</p>
      </div>
    </div>
  );
}
