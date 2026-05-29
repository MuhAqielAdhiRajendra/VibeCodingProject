import { useState, useEffect } from 'react';
import { getTools, toggleTool, getFakeIp, subscribe, getOwnedTools, unlockTool, getCrypto, spendCrypto, clearSave } from '../game/gameStore';
import type { StealthTools as ToolsState } from '../game/gameStore';

interface StealthToolsProps { onClose: () => void; }

const TOOL_CONFIG: { key: keyof ToolsState; icon: string; label: string; desc: string; activeText: string; inactiveText: string; required?: string; price: number }[] = [
  { key: 'stealthMode', icon: '👁️', label: 'Stealth Mode', desc: 'Anonymize traffic & enable covert scanning', activeText: 'All traffic routed through TOR', inactiveText: 'Required to scan targets', required: 'SCAN', price: 0 },
  { key: 'fakeIp', icon: '🌐', label: 'IP Spoofing', desc: 'Mask your real IP with a fake identity', activeText: '', inactiveText: 'Required to exploit vulnerabilities', required: 'EXPLOIT', price: 0 },
  { key: 'vpn', icon: '🔐', label: 'VPN Tunnel', desc: 'Encrypted tunnel for extra protection', activeText: 'WireGuard tunnel active (3 hops)', inactiveText: 'Adds encryption layer', price: 12000 },
  { key: 'proxyChain', icon: '🔗', label: 'Proxy Chain', desc: 'Route through multiple proxy servers', activeText: 'Chained: SOCKS5 → HTTP → SOCKS4', inactiveText: 'Multi-hop proxy routing', price: 25000 },
  { key: 'macSpoof', icon: '📡', label: 'MAC Spoofing', desc: 'Randomize hardware address', activeText: '', inactiveText: 'Randomize network identity', price: 8500 },
];

export default function StealthToolsApp({ onClose }: StealthToolsProps) {
  const [, forceUpdate] = useState(0);
  useEffect(() => subscribe(() => forceUpdate(n => n + 1)), []);
  const tools = getTools();
  const fakeIp = getFakeIp();
  const owned = getOwnedTools();
  const crypto = getCrypto();

  return (
    <div className="fixed inset-0 z-50 flex items-center landscape:items-start md:items-center justify-center overflow-y-auto p-2 landscape:py-8 landscape:px-4" style={{ background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(4px)' }}>
      <div className="relative flex flex-col rounded-xl overflow-hidden w-[95vw] md:w-[500px] h-[95vh] landscape:h-[450px] md:h-[580px]" style={{
        background: 'linear-gradient(180deg, #0c0e14 0%, #080a10 100%)',
        border: '1px solid rgba(0,255,136,0.15)', boxShadow: '0 0 60px rgba(0,255,136,0.08)',
      }}>
        {/* Title bar */}
        <div className="flex items-center justify-between px-4 py-2.5 shrink-0" style={{ background: 'rgba(0,255,136,0.04)', borderBottom: '1px solid rgba(0,255,136,0.1)' }}>
          <div className="flex items-center gap-2">
            <span className="text-base">🛡️</span>
            <span className="text-xs font-mono font-bold" style={{ color: '#00ff88' }}>STEALTH TOOLS</span>
          </div>
          <button onClick={onClose} className="text-lg px-2 hover:scale-125 transition-transform" style={{ color: '#ff4444' }}>✕</button>
        </div>

        {/* Tools list */}
        <div className="flex-1 overflow-y-auto p-4 font-mono space-y-3" style={{ scrollbarWidth: 'thin' }}>
          {TOOL_CONFIG.map((cfg) => {
            const active = tools[cfg.key];
            const isOwned = owned[cfg.key];
            const activeLabel = cfg.key === 'fakeIp' && active ? `Spoofed IP: ${fakeIp}` :
              cfg.key === 'macSpoof' && active ? `Spoofed: ${Array.from({length:6},()=>Math.floor(Math.random()*256).toString(16).padStart(2,'0')).join(':')}` :
              cfg.activeText;
            return (
              <div key={cfg.key} className="p-3 rounded-lg transition-all duration-300" style={{
                background: active ? 'rgba(0,255,136,0.04)' : 'rgba(255,255,255,0.02)',
                border: `1px solid ${active ? 'rgba(0,255,136,0.2)' : 'rgba(255,255,255,0.05)'}`,
              }}>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <span className="text-xl">{cfg.icon}</span>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold" style={{ color: '#ccddcc' }}>{cfg.label}</span>
                        {cfg.required && (
                          <span className="text-[8px] px-1.5 py-0.5 rounded font-bold" style={{
                            background: active ? 'rgba(0,255,136,0.1)' : 'rgba(255,170,0,0.1)',
                            color: active ? '#00ff88' : '#ffaa00',
                            border: `1px solid ${active ? 'rgba(0,255,136,0.2)' : 'rgba(255,170,0,0.2)'}`,
                          }}>REQ: {cfg.required}</span>
                        )}
                      </div>
                      <div className="text-[10px] mt-0.5" style={{ color: '#556655' }}>{cfg.desc}</div>
                    </div>
                  </div>
                  {/* Toggle / Buy */}
                  {isOwned ? (
                    <button onClick={() => toggleTool(cfg.key)} className="relative w-12 h-6 rounded-full transition-all duration-300 shrink-0" style={{
                      background: active ? 'linear-gradient(90deg, #00ff88, #00ccaa)' : 'rgba(255,255,255,0.08)',
                      boxShadow: active ? '0 0 12px rgba(0,255,136,0.4)' : 'none',
                    }}>
                      <div className="absolute top-0.5 w-5 h-5 rounded-full transition-all duration-300" style={{
                        left: active ? '26px' : '2px', background: active ? '#0a0a0a' : '#444',
                        boxShadow: '0 1px 3px rgba(0,0,0,0.4)',
                      }} />
                    </button>
                  ) : (
                    <button onClick={() => {
                      if (crypto >= cfg.price && spendCrypto(cfg.price)) {
                        unlockTool(cfg.key);
                        toggleTool(cfg.key);
                      }
                    }} disabled={crypto < cfg.price} className={`px-2.5 py-1 text-[10px] rounded font-bold transition-colors ${crypto >= cfg.price ? 'bg-[#9900ff22] text-[#c266ff] hover:bg-[#9900ff44] border border-[#9900ff55]' : 'bg-[#222] text-gray-500 border border-[#333]'}`}>
                      {cfg.price.toLocaleString()} NTC
                    </button>
                  )}
                </div>
                {/* Status */}
                <div className="flex items-center gap-2 px-3 py-1.5 rounded text-[10px] tracking-wider" style={{
                  background: active ? 'rgba(0,255,136,0.06)' : 'rgba(255,68,68,0.04)',
                  border: `1px solid ${active ? 'rgba(0,255,136,0.12)' : 'rgba(255,255,255,0.04)'}`,
                  color: active ? '#00ff88' : '#776655',
                }}>
                  <span className={active ? 'animate-pulse' : ''}>⬤</span>
                  <span>{active ? activeLabel : cfg.inactiveText}</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Readiness summary */}
        <div className="p-3 shrink-0 font-mono" style={{ borderTop: '1px solid rgba(0,255,136,0.08)' }}>
          <div className="flex items-center justify-around text-[10px] mb-2.5">
            <div className="flex items-center gap-1.5">
              <span style={{ color: tools.stealthMode ? '#00ff88' : '#ff4444' }}>{tools.stealthMode ? '✓' : '✕'}</span>
              <span style={{ color: tools.stealthMode ? '#00ff88' : '#ff4444' }}>Scan Ready</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span style={{ color: tools.fakeIp ? '#00ff88' : '#ff4444' }}>{tools.fakeIp ? '✓' : '✕'}</span>
              <span style={{ color: tools.fakeIp ? '#00ff88' : '#ff4444' }}>Exploit Ready</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span style={{ color: Object.values(tools).every(Boolean) ? '#00ff88' : '#ffaa00' }}>
                {Object.values(tools).filter(Boolean).length}/5
              </span>
              <span style={{ color: '#556655' }}>Tools Active</span>
            </div>
          </div>
          
          <div className="mt-2.5 pt-2 flex justify-center border-t border-dashed border-red-500/10">
            <button
              onClick={() => {
                if (window.confirm('Apakah Anda yakin ingin menghapus semua progress game dan mulai dari awal?')) {
                  clearSave();
                  window.location.reload();
                }
              }}
              className="w-full py-1 rounded text-[9px] font-bold tracking-widest text-[#ff4444] border border-[#ff4444]/25 hover:bg-[#ff4444]/10 transition-colors uppercase"
            >
              ⚠️ Reset Progress Game
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
