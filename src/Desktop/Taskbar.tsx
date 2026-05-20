import { getReputation, getMoney, getReputationLabel } from '../game/gameStore';
import { useState, useEffect } from 'react';
import { subscribe } from '../game/gameStore';

interface TaskbarProps {
  onSwitchToTerminal: () => void;
  currentTime: string;
}

export default function Taskbar({ onSwitchToTerminal, currentTime }: TaskbarProps) {
  const [, forceUpdate] = useState(0);

  useEffect(() => {
    return subscribe(() => forceUpdate(n => n + 1));
  }, []);

  const rep = getReputation();
  const repInfo = getReputationLabel();
  const money = getMoney();
  // Map -100..100 to 0..100%
  const repPercent = ((rep + 100) / 200) * 100;

  return (
    <div className="absolute bottom-0 left-0 right-0 h-12 flex items-center justify-between px-3 z-50"
      style={{
        background: 'linear-gradient(180deg, rgba(15,15,20,0.95) 0%, rgba(10,10,15,0.98) 100%)',
        borderTop: '1px solid rgba(0,255,136,0.15)',
        backdropFilter: 'blur(12px)',
      }}
    >
      {/* Left side - Terminal button */}
      <div className="flex items-center gap-2">
        <button
          onClick={onSwitchToTerminal}
          className="flex items-center gap-2 px-3 py-1.5 rounded text-xs font-mono transition-all duration-200 hover:scale-105"
          style={{
            background: 'rgba(0,255,136,0.1)',
            border: '1px solid rgba(0,255,136,0.3)',
            color: '#00ff88',
          }}
        >
          <span style={{ fontSize: 14 }}>⬛</span>
          <span>Terminal</span>
        </button>
      </div>

      {/* Center - Reputation bar + money */}
      <div className="absolute left-1/2 -translate-x-1/2 flex items-center gap-3">
        {/* Reputation mini bar */}
        <div className="flex items-center gap-1.5 font-mono">
          <span className="text-[9px]" style={{ color: '#ff4400' }}>BH</span>
          <div className="w-20 h-1.5 rounded-full overflow-hidden relative" style={{ background: 'rgba(255,255,255,0.06)' }}>
            {/* Gradient bar */}
            <div className="absolute inset-0 rounded-full" style={{
              background: 'linear-gradient(90deg, #ff0044, #ff8800, #888888, #88aaff, #00ff88)',
              opacity: 0.4,
            }} />
            {/* Indicator dot */}
            <div className="absolute top-1/2 -translate-y-1/2 w-2 h-2 rounded-full transition-all duration-500"
              style={{
                left: `calc(${repPercent}% - 4px)`,
                background: repInfo.color,
                boxShadow: `0 0 6px ${repInfo.color}`,
              }}
            />
          </div>
          <span className="text-[9px]" style={{ color: '#00ff88' }}>WH</span>
        </div>

        {/* Money */}
        <span className="text-[10px] font-mono font-bold" style={{ color: '#ffcc00' }}>
          ${money.toLocaleString()}
        </span>
      </div>

      {/* Right side - Clock & indicators */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-1.5">
          <span className="text-[10px]" style={{ color: '#00ff88', opacity: 0.6 }}>⬤</span>
          <span className="text-[10px] font-mono" style={{ color: 'rgba(0,255,136,0.5)' }}>TOR</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-[10px]" style={{ color: '#ffaa00', opacity: 0.6 }}>⬤</span>
          <span className="text-[10px] font-mono" style={{ color: 'rgba(255,170,0,0.5)' }}>VPN</span>
        </div>
        <span className="text-xs font-mono" style={{ color: '#00ff88' }}>
          {currentTime}
        </span>
      </div>
    </div>
  );
}
