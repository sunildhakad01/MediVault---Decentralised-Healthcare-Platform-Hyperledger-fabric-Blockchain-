// AI-Vaidya — SuggestedPrompts.jsx | MediVault Platform

/**
 * Horizontal scrollable row of quick-prompt chip buttons.
 * Shown above the input area when the conversation is empty.
 * Hidden once messages exist.
 *
 * Props:
 *   prompts   string[]              — list of prompt strings from portal policy
 *   onSelect  (prompt: string) => void — called when a chip is clicked
 *   visible   boolean               — hides when conversation starts
 */
export default function SuggestedPrompts({ prompts = [], onSelect, visible = true }) {
  if (!visible || prompts.length === 0) return null;

  return (
    <div className="px-3 pb-2">
      <p className="text-xs text-gray-400 mb-2 font-medium">Suggested questions</p>
      <div className="flex gap-2 overflow-x-auto aivaidya-prompts-scroll pb-1">
        {prompts.map((prompt, i) => (
          <button
            key={i}
            onClick={() => onSelect(prompt)}
            className="flex-shrink-0 text-xs px-3 py-1.5 rounded-full border border-emerald-300 bg-emerald-50 text-emerald-700 hover:bg-emerald-500 hover:text-white hover:border-emerald-500 transition-all duration-150 whitespace-nowrap"
          >
            {prompt}
          </button>
        ))}
      </div>
    </div>
  );
}
