// AI-Vaidya — AiVaidyaButton.jsx | MediVault Platform

import { useState } from 'react';
import ReactDOM from 'react-dom';
import { useAuth } from '../../../context/AuthContext';
import { usePortalContext } from '../hooks/usePortalContext';
import AiVaidyaAvatar from './AiVaidyaAvatar';
import AiVaidyaChat from './AiVaidyaChat';

/**
 * Floating trigger button — appears on every authenticated portal page.
 * Rendered via ReactDOM.createPortal directly on document.body so that
 * parent overflow:hidden / transforms can never clip or hide it.
 * Only renders when the user is authenticated and on a known portal route.
 */
export default function AiVaidyaButton() {
  const [chatOpen, setChatOpen] = useState(false);
  const { isAuthenticated } = useAuth();
  const { portalId } = usePortalContext();

  // Only show on known portal routes for authenticated users
  if (!isAuthenticated || !portalId) return null;

  // Prevent SSR crash — portals need document
  if (typeof document === 'undefined') return null;

  const fabContent = (
    <>
      {/* ── Floating Action Button ── */}
      <button
        onClick={() => setChatOpen(true)}
        aria-label="Open AI-Vaidya health assistant"
        className="
          aivaidya-fab
          fixed bottom-6 right-6 z-[9999]
          flex items-center gap-2
          px-4 py-2.5
          bg-gradient-to-r from-emerald-500 to-teal-500
          hover:from-emerald-600 hover:to-teal-600
          text-white font-semibold text-sm
          shadow-lg hover:shadow-xl
          transition-all duration-200
          hover:brightness-95
          focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:ring-offset-2
        "
        style={{ borderRadius: '40px' }}
      >
        <AiVaidyaAvatar size={28} showPulse />
        <span>Ask AI-Vaidya</span>
      </button>

      {/* ── Chat Drawer ── */}
      <AiVaidyaChat
        isOpen={chatOpen}
        onClose={() => setChatOpen(false)}
      />
    </>
  );

  return ReactDOM.createPortal(fabContent, document.body);
}
