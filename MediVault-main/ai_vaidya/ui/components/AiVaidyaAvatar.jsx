// AI-Vaidya — AiVaidyaAvatar.jsx | MediVault Platform

/**
 * SVG doctor avatar. Renders correctly at 24 / 32 / 40 / 48 / 72 px.
 * Uses MediVault's primary emerald (#10b981) as the brand accent.
 *
 * Props:
 *   size        {number}  — pixel dimension of the avatar (default 40)
 *   animated    {boolean} — breathing opacity pulse animation (3s loop)
 *   showPulse   {boolean} — green pulsing dot at bottom-right (online indicator)
 */
export default function AiVaidyaAvatar({ size = 40, animated = false, showPulse = false }) {
  return (
    <span
      className={`inline-block relative flex-shrink-0${animated ? ' aivaidya-avatar-breathing' : ''}`}
      style={{ width: size, height: size }}
      aria-label="AI-Vaidya"
    >
      <svg
        width={size}
        height={size}
        viewBox="0 0 80 80"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* ── Circular background ── */}
        <circle cx="40" cy="40" r="40" fill="#E1F5EE" />
        <circle cx="40" cy="40" r="38" stroke="#10b981" strokeWidth="2" fill="none" />

        {/* ── White coat body ── */}
        <rect x="20" y="54" width="40" height="22" rx="6" fill="white" />
        {/* Coat lapels */}
        <path d="M40 54 L30 60 L28 78 L40 78 Z" fill="#f0fdf4" />
        <path d="M40 54 L50 60 L52 78 L40 78 Z" fill="#f0fdf4" />
        {/* Collar fold lines */}
        <path d="M34 56 L40 62 L46 56" stroke="#10b981" strokeWidth="1.2" strokeLinecap="round" fill="none" />

        {/* ── Shirt/scrubs under coat ── */}
        <rect x="30" y="56" width="20" height="22" rx="2" fill="#d1fae5" />

        {/* ── Stethoscope ── */}
        {/* Earpiece left */}
        <path
          d="M28 52 C24 50 22 44 24 40 C26 36 30 36 31 39"
          stroke="#059669"
          strokeWidth="2"
          strokeLinecap="round"
          fill="none"
        />
        {/* Earpiece right */}
        <path
          d="M52 52 C56 50 58 44 56 40 C54 36 50 36 49 39"
          stroke="#059669"
          strokeWidth="2"
          strokeLinecap="round"
          fill="none"
        />
        {/* Tube joining */}
        <path
          d="M31 39 C32 45 38 50 40 52 C42 50 48 45 49 39"
          stroke="#059669"
          strokeWidth="2"
          strokeLinecap="round"
          fill="none"
        />
        {/* Chest piece */}
        <circle cx="40" cy="53" r="3" fill="#059669" />
        <circle cx="40" cy="53" r="1.5" fill="#10b981" />

        {/* ── Head ── */}
        <ellipse cx="40" cy="30" rx="14" ry="15" fill="#fde68a" />

        {/* ── Hair (doctor cap suggestion) ── */}
        <path
          d="M26 27 C26 18 54 18 54 27"
          fill="#374151"
        />
        <rect x="24" y="25" width="32" height="4" rx="2" fill="#1f2937" />

        {/* ── Eyes ── */}
        <ellipse cx="35" cy="30" rx="2.2" ry="2.5" fill="#1f2937" />
        <ellipse cx="45" cy="30" rx="2.2" ry="2.5" fill="#1f2937" />
        {/* Eye glints */}
        <circle cx="36" cy="29" r="0.8" fill="white" />
        <circle cx="46" cy="29" r="0.8" fill="white" />

        {/* ── Nose ── */}
        <ellipse cx="40" cy="35" rx="1.5" ry="1" fill="#f59e0b" opacity="0.6" />

        {/* ── Smile ── */}
        <path
          d="M35 39 Q40 43 45 39"
          stroke="#92400e"
          strokeWidth="1.5"
          strokeLinecap="round"
          fill="none"
        />

        {/* ── Ears ── */}
        <ellipse cx="26" cy="31" rx="2.5" ry="3.5" fill="#fde68a" />
        <ellipse cx="54" cy="31" rx="2.5" ry="3.5" fill="#fde68a" />
      </svg>

      {/* ── Online pulse dot ── */}
      {showPulse && (
        <span
          className="absolute aivaidya-pulse-dot"
          style={{
            bottom: size * 0.06,
            right: size * 0.06,
            width: Math.max(6, size * 0.18),
            height: Math.max(6, size * 0.18),
            background: '#22c55e',
            borderRadius: '50%',
            border: '2px solid white',
            display: 'block',
          }}
        />
      )}
    </span>
  );
}
