interface DesktopIconProps {
  icon: string;
  label: string;
  onClick: () => void;
  glowColor?: string;
}

export default function DesktopIcon({ icon, label, onClick, glowColor = '#00ff88' }: DesktopIconProps) {
  return (
    <button
      onClick={onClick}
      className="flex flex-col items-center gap-1.5 p-2 rounded-lg transition-all duration-200 hover:scale-110 group w-20"
      style={{ background: 'transparent' }}
      onMouseEnter={(e) => {
        e.currentTarget.style.background = 'rgba(0,255,136,0.08)';
        e.currentTarget.style.boxShadow = `0 0 20px ${glowColor}22`;
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = 'transparent';
        e.currentTarget.style.boxShadow = 'none';
      }}
    >
      <div
        className="w-12 h-12 flex items-center justify-center rounded-lg text-2xl transition-all duration-200"
        style={{
          background: `linear-gradient(135deg, ${glowColor}15, ${glowColor}08)`,
          border: `1px solid ${glowColor}30`,
          boxShadow: `0 2px 8px ${glowColor}10`,
        }}
      >
        {icon}
      </div>
      <span
        className="text-[10px] font-mono text-center leading-tight truncate w-full"
        style={{
          color: '#ccddcc',
          textShadow: `0 0 8px ${glowColor}40`,
        }}
      >
        {label}
      </span>
    </button>
  );
}
