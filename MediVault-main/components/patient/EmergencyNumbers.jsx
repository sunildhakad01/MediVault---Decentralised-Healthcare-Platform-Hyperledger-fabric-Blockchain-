/**
 * EmergencyNumbers — Indian emergency contact numbers
 * Props:
 *   compact: boolean — if true, renders a slim horizontal bar; default is full card grid
 */
export default function EmergencyNumbers({ compact = false }) {
  const numbers = [
    { label: 'Ambulance',       number: '108',  href: 'tel:108',  emoji: '🚑', bg: 'bg-red-50',    border: 'border-red-200',    text: 'text-red-700',    badgeBg: 'bg-red-600'    },
    { label: 'Police',          number: '100',  href: 'tel:100',  emoji: '🚔', bg: 'bg-blue-50',   border: 'border-blue-200',   text: 'text-blue-700',   badgeBg: 'bg-blue-600'   },
    { label: 'Health Helpline', number: '104',  href: 'tel:104',  emoji: '🏥', bg: 'bg-green-50',  border: 'border-green-200',  text: 'text-green-700',  badgeBg: 'bg-green-600'  },
    { label: 'Women Helpline',  number: '1091', href: 'tel:1091', emoji: '🆘', bg: 'bg-purple-50', border: 'border-purple-200', text: 'text-purple-700', badgeBg: 'bg-purple-600' },
  ];

  if (compact) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-2xl px-4 py-3">
        <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2">
          {numbers.map((n) => (
            <a
              key={n.number}
              href={n.href}
              className="flex items-center gap-1.5 text-sm font-semibold text-red-700 hover:text-red-900 transition-colors"
            >
              <span>{n.emoji}</span>
              <span>{n.label}:</span>
              <span className="font-mono text-base">{n.number}</span>
            </a>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
        🆘 Emergency Numbers (India)
      </h3>
      <div className="grid grid-cols-2 gap-3">
        {numbers.map((n) => (
          <a
            key={n.number}
            href={n.href}
            className={`flex items-center space-x-3 p-3 rounded-xl border ${n.bg} ${n.border} hover:shadow-md transition-all duration-200 group`}
          >
            <div className={`p-2 ${n.badgeBg} rounded-lg shadow-sm flex-shrink-0`}>
              <span className="text-lg leading-none">{n.emoji}</span>
            </div>
            <div className="min-w-0">
              <p className={`text-xs font-medium ${n.text} truncate`}>{n.label}</p>
              <p className={`text-xl font-bold font-mono ${n.text} leading-tight`}>{n.number}</p>
            </div>
          </a>
        ))}
      </div>
      <p className="text-xs text-gray-400 text-center">Tap any number to call • Available 24/7</p>
    </div>
  );
}
