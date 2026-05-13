// AI-Vaidya — Full-page chat | MediVault Platform

import { useState, useRef, useEffect } from 'react';
import Head from 'next/head';
import {
  FiSend, FiTrash2, FiRefreshCw, FiFile, FiImage, FiX,
  FiZap, FiShield, FiCpu,
} from 'react-icons/fi';
import { MdLocalHospital } from 'react-icons/md';
import AiVaidyaAvatar   from '../ai_vaidya/ui/components/AiVaidyaAvatar';
import MessageBubble    from '../ai_vaidya/ui/components/MessageBubble';
import SuggestedPrompts from '../ai_vaidya/ui/components/SuggestedPrompts';
import FileUploadZone   from '../ai_vaidya/ui/components/FileUploadZone';
import { useAiVaidya }     from '../ai_vaidya/ui/hooks/useAiVaidya';
import { usePortalContext } from '../ai_vaidya/ui/hooks/usePortalContext';

const FEATURE_CARDS = [
  {
    icon: <FiZap  className="w-5 h-5 text-emerald-500" />,
    title: 'Instant Answers',
    desc:  'Ask about medicines, symptoms, lab reports, or general health questions.',
  },
  {
    icon: <FiFile className="w-5 h-5 text-teal-500" />,
    title: 'Upload Documents',
    desc:  'Share PDFs, images or DICOM files — AI-Vaidya reads and explains them.',
  },
  {
    icon: <FiShield className="w-5 h-5 text-cyan-500" />,
    title: 'Private & Secure',
    desc:  'All queries are processed securely on MediVault\'s infrastructure.',
  },
  {
    icon: <FiCpu className="w-5 h-5 text-indigo-500" />,
    title: 'Context-Aware',
    desc:  'AI-Vaidya knows your portal role and tailors every answer accordingly.',
  },
];

export default function AiVaidyaPage() {
  const portalContext = usePortalContext();
  const {
    messages,
    isLoading,
    sendMessage,
    clearConversation,
    retryLastMessage,
    hasMessages,
  } = useAiVaidya(portalContext);

  const [input,       setInput]       = useState('');
  const [pendingFile, setPendingFile] = useState(null); // { base64, mimeType, name }
  const [menuOpen,    setMenuOpen]    = useState(false);

  const messagesEndRef = useRef(null);
  const textareaRef    = useRef(null);

  // Scroll to newest message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  function handleInputChange(e) {
    setInput(e.target.value);
    const ta = e.target;
    ta.style.height = 'auto';
    ta.style.height = Math.min(ta.scrollHeight, 140) + 'px';
  }

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
    if (textareaRef.current) textareaRef.current.style.height = 'auto';
  }

  function handleSuggestedPrompt(prompt) {
    sendMessage(prompt, null);
  }

  function handleFileReady(base64, mimeType, name) {
    setPendingFile({ base64, mimeType, name });
  }

  function handleClear() {
    clearConversation();
    setMenuOpen(false);
  }

  return (
    <>
      <Head><title>AI-Vaidya – MediVault</title></Head>

      {/* Two-column layout: info panel (desktop only) + chat */}
      <div className="flex gap-6 h-[calc(100vh-9rem)] min-h-0">

        {/* ── Left info panel (hidden on mobile) ── */}
        <aside className="hidden xl:flex flex-col w-72 flex-shrink-0 gap-4">
          {/* Branding card */}
          <div className="bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl p-5 text-white shadow-md">
            <div className="flex items-center gap-3 mb-3">
              <AiVaidyaAvatar size={48} animated showPulse />
              <div>
                <h2 className="font-bold text-lg leading-tight">AI-Vaidya</h2>
                <p className="text-xs text-emerald-100">Health Intelligence Assistant</p>
              </div>
            </div>
            {portalContext.badgeLabel && (
              <span className="inline-block text-xs font-semibold px-3 py-1 bg-white bg-opacity-20 rounded-full">
                {portalContext.badgeLabel} Portal
              </span>
            )}
            <p className="mt-3 text-xs text-emerald-100 leading-relaxed">
              Powered by MediVault's clinical AI. Ask anything about your health, medicines, or records.
            </p>
          </div>

          {/* Feature cards */}
          <div className="flex flex-col gap-2">
            {FEATURE_CARDS.map((f, i) => (
              <div key={i} className="flex items-start gap-3 bg-white rounded-xl p-3 shadow-sm border border-gray-100">
                <div className="mt-0.5">{f.icon}</div>
                <div>
                  <p className="text-xs font-semibold text-gray-800">{f.title}</p>
                  <p className="text-xs text-gray-500 mt-0.5 leading-snug">{f.desc}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Disclaimer */}
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 mt-auto">
            <p className="text-[10px] text-amber-700 leading-relaxed">
              <strong>Note:</strong> AI-Vaidya provides general health information only. It is not a substitute for professional medical advice, diagnosis, or treatment.
            </p>
          </div>
        </aside>

        {/* ── Main chat panel ── */}
        <div className="flex-1 flex flex-col bg-white rounded-2xl shadow-sm border border-gray-100 min-h-0 overflow-hidden">

          {/* Chat header */}
          <div className="flex items-center gap-3 px-5 py-3.5 border-b border-gray-100 flex-shrink-0 bg-gradient-to-r from-emerald-50 to-teal-50">
            <AiVaidyaAvatar size={36} animated showPulse />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-bold text-gray-800">AI-Vaidya</span>
                {portalContext.badgeLabel && (
                  <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${portalContext.badgeColor}`}>
                    {portalContext.badgeLabel}
                  </span>
                )}
                <span className="flex items-center gap-1 text-[10px] text-emerald-600 bg-emerald-100 px-2 py-0.5 rounded-full">
                  <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full inline-block animate-pulse" />
                  Online
                </span>
              </div>
              <p className="text-xs text-gray-400">Powered by MediVault · Clinical Health Assistant</p>
            </div>

            {/* Actions */}
            <div className="relative flex-shrink-0">
              <button
                onClick={() => setMenuOpen(v => !v)}
                className="p-2 rounded-xl text-gray-400 hover:text-gray-700 hover:bg-white transition-colors text-xs font-medium border border-gray-200 flex items-center gap-1"
                aria-label="Chat options"
              >
                Options
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
          </div>

          {/* Messages area */}
          <div className="flex-1 overflow-y-auto aivaidya-messages-scroll px-5 py-4 min-h-0">
            {!hasMessages && (
              <WelcomeScreen
                portalId={portalContext.portalId}
                prompts={portalContext.suggestedPrompts}
                onSelectPrompt={handleSuggestedPrompt}
              />
            )}

            {messages.map(msg => (
              <MessageBubble key={msg.id} message={msg} />
            ))}

            <div ref={messagesEndRef} />
          </div>

          {/* Input area */}
          <div className="flex-shrink-0 border-t border-gray-100 bg-white">
            {/* Pending file chip */}
            {pendingFile && (
              <div className="mx-4 mt-3 mb-1">
                <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 rounded-xl px-3 py-2">
                  {pendingFile.mimeType === 'application/pdf'
                    ? <FiFile  className="w-4 h-4 text-emerald-600 flex-shrink-0" />
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

            {/* Suggested prompts (shown when conversation is empty) */}
            {hasMessages ? null : (
              <div className="px-4 pt-2">
                <SuggestedPrompts
                  prompts={portalContext.suggestedPrompts}
                  onSelect={handleSuggestedPrompt}
                  visible
                />
              </div>
            )}

            {/* Text row */}
            <div className="flex items-end gap-2 px-4 py-3">
              {portalContext.isFileUploadAllowed && (
                <FileUploadZone
                  allowedTypes={portalContext.allowedFileTypes}
                  onFileReady={handleFileReady}
                  onClear={() => setPendingFile(null)}
                />
              )}

              <textarea
                ref={textareaRef}
                value={input}
                onChange={handleInputChange}
                onKeyDown={handleKeyDown}
                placeholder={portalContext.inputPlaceholder || 'Ask AI-Vaidya a health question…'}
                rows={1}
                disabled={isLoading}
                className="aivaidya-textarea flex-1 px-4 py-2.5 text-sm text-gray-800 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-300 focus:border-emerald-400 placeholder-gray-400 transition-colors"
              />

              <button
                onClick={handleSend}
                disabled={(!input.trim() && !pendingFile) || isLoading}
                aria-label="Send message"
                className="flex-shrink-0 p-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-white hover:from-emerald-600 hover:to-teal-600 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-150 shadow-sm"
              >
                <FiSend className="w-4 h-4" />
              </button>
            </div>

            <p className="text-center text-[10px] text-gray-400 pb-3 px-4 leading-snug">
              AI-Vaidya · Not a substitute for professional medical advice
            </p>
          </div>
        </div>
      </div>
    </>
  );
}

/* ── Welcome screen shown before any message ── */
function WelcomeScreen({ portalId, prompts, onSelectPrompt }) {
  const greetings = {
    patient:  "Hello! I'm AI-Vaidya, your personal health assistant. Ask me about medicines, symptoms, or your health records.",
    doctor:   "Hello, Doctor. I'm AI-Vaidya, your clinical decision support assistant. How can I help with your patient today?",
    hospital: "Hello! I'm AI-Vaidya. I can help with ward-level patient management, clinical decisions, and drug safety checks.",
    admin:    "Hello! I'm AI-Vaidya. I can provide platform analytics, usage summaries, and compliance reports.",
  };

  return (
    <div className="flex flex-col items-center justify-center py-10 text-center gap-5">
      <AiVaidyaAvatar size={80} animated showPulse />
      <div>
        <h3 className="font-bold text-gray-800 text-lg mb-1">AI-Vaidya</h3>
        <p className="text-sm text-gray-500 max-w-md leading-relaxed mx-auto">
          {greetings[portalId] || greetings.patient}
        </p>
      </div>

      {prompts?.length > 0 && (
        <div className="w-full max-w-lg">
          <p className="text-xs text-gray-400 mb-3 font-medium">Try asking:</p>
          <div className="flex flex-wrap justify-center gap-2">
            {prompts.map((p, i) => (
              <button
                key={i}
                onClick={() => onSelectPrompt(p)}
                className="text-xs px-4 py-2 rounded-full border border-emerald-300 bg-emerald-50 text-emerald-700 hover:bg-emerald-500 hover:text-white hover:border-emerald-500 transition-all duration-150"
              >
                {p}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
