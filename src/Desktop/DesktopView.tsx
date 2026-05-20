import { useState, useEffect } from 'react';
import Taskbar from './Taskbar';
import DesktopIcon from './DesktopIcon';
import InsideApp from './InsideApp';
import StealthToolsApp from './SettingsApp';
import DarkNetApp from './DarkNetApp';
import IspApp from './IspApp';
import HackToolApp from './HackToolApp';
import { getTools, subscribe, getReputation } from '../game/gameStore';

interface DesktopViewProps {
  onSwitchToTerminal: () => void;
}

export default function DesktopView({ onSwitchToTerminal }: DesktopViewProps) {
  const [currentTime, setCurrentTime] = useState('');
  const [notification, setNotification] = useState<string | null>(null);
  const [openApp, setOpenApp] = useState<string | null>(null);
  const [, forceUpdate] = useState(0);

  useEffect(() => subscribe(() => forceUpdate(n => n + 1)), []);
  useEffect(() => {
    const update = () => {
      const now = new Date();
      setCurrentTime(now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false }));
    };
    update();
    const t = setInterval(update, 1000);
    return () => clearInterval(t);
  }, []);

  const showNotification = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3000);
  };

  const tools = getTools();
  const rep = getReputation();

  const handleInsideClick = () => {
    setOpenApp('inside');
  };

  const baseIcons = [
    { icon: '⬛', label: 'Terminal', onClick: onSwitchToTerminal, glowColor: '#00ff88' },
    { icon: '🛡️', label: 'Stealth Tools', onClick: () => setOpenApp('stealth'), glowColor: '#8888ff' },
    { icon: '🔍', label: 'Inside', onClick: handleInsideClick, glowColor: tools.stealthMode ? '#00ffcc' : '#333333' },
    { icon: '⚡', label: 'HackTool', onClick: () => setOpenApp('hacktool'), glowColor: '#00ffaa' },
    { icon: '📡', label: 'ISP Manager', onClick: () => setOpenApp('isp'), glowColor: '#00ccff' },
  ];

  if (rep <= 10) {
    baseIcons.push({ icon: '🕸️', label: 'DarkNet Market', onClick: () => setOpenApp('darknet'), glowColor: '#ff4444' });
  }
  if (rep <= -30) {
    baseIcons.push({ icon: '☠️', label: 'Zero-Day VIP', onClick: () => showNotification('☠️ WELCOME TO VIP UNDERGROUND ☠️'), glowColor: '#9900ff' });
  }

  const desktopIcons = baseIcons;

  return (
    <div className="w-screen h-screen relative overflow-hidden select-none" style={{ background: '#0a0a0a' }}>
      {/* Grid bg */}
      <div className="absolute inset-0 opacity-[0.03]" style={{
        backgroundImage: 'linear-gradient(rgba(0,255,136,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(0,255,136,0.3) 1px, transparent 1px)',
        backgroundSize: '50px 50px',
      }} />
      {/* Scanline */}
      <div className="absolute inset-0 pointer-events-none z-30 opacity-[0.03]" style={{
        backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, #00ff00 2px, #00ff00 4px)',
      }} />
      {/* Corners */}
      <div className="absolute top-3 left-3 z-20" style={{ color: 'rgba(0,255,136,0.15)', fontSize: 10, fontFamily: 'monospace' }}>
        ┌─ NIGHTOS DESKTOP ─────────
      </div>
      <div className="absolute top-3 right-3 z-20" style={{ color: 'rgba(0,255,136,0.15)', fontSize: 10, fontFamily: 'monospace' }}>
        ────── SECURE SESSION ─┐
      </div>

      {/* Icons */}
      <div className="absolute top-10 left-4 right-4 bottom-14 z-10 p-4">
        <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-4 content-start">
          {desktopIcons.map((item, i) => (
            <DesktopIcon key={i} icon={item.icon} label={item.label} onClick={item.onClick} glowColor={item.glowColor} />
          ))}
        </div>
      </div>

      {/* System status */}
      <div className="absolute top-10 right-4 z-20 p-3 rounded-lg hidden md:block" style={{
        background: 'rgba(0,255,136,0.03)', border: '1px solid rgba(0,255,136,0.1)',
        fontFamily: "'Courier New', monospace", minWidth: 200,
      }}>
        <div className="text-[10px] mb-2 tracking-widest" style={{ color: 'rgba(0,255,136,0.4)' }}>── SYSTEM STATUS ──</div>
        <div className="space-y-1">
          {[
            { label: 'CPU', value: '12%', color: '#00ff88' },
            { label: 'MEM', value: '4.2G/64G', color: '#00ccff' },
            { label: 'STEALTH', value: tools.stealthMode ? 'ON' : 'OFF', color: tools.stealthMode ? '#00ff88' : '#ff4444' },
            { label: 'FAKE IP', value: tools.fakeIp ? 'ON' : 'OFF', color: tools.fakeIp ? '#00ff88' : '#ff4444' },
            { label: 'TOOLS', value: `${Object.values(tools).filter(Boolean).length}/5`, color: '#ffaa00' },
          ].map((s, i) => (
            <div key={i} className="flex justify-between text-[10px]">
              <span style={{ color: 'rgba(0,255,136,0.3)' }}>{s.label}</span>
              <span style={{ color: s.color, opacity: 0.6 }}>{s.value}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Notification */}
      {notification && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-50 px-4 py-2.5 rounded-lg text-xs font-mono animate-pulse" style={{
          background: 'rgba(0,15,5,0.95)', border: '1px solid rgba(0,255,136,0.3)',
          color: '#00ff88', boxShadow: '0 0 30px rgba(0,255,136,0.15)', backdropFilter: 'blur(8px)',
        }}>
          <span style={{ color: '#ffaa00' }}>⚡</span> {notification}
        </div>
      )}

      {/* Apps */}
      {openApp === 'inside' && <InsideApp onClose={() => setOpenApp(null)} />}
      {openApp === 'stealth' && <StealthToolsApp onClose={() => setOpenApp(null)} />}
      {openApp === 'darknet' && <DarkNetApp onClose={() => setOpenApp(null)} />}
      {openApp === 'isp' && <IspApp onClose={() => setOpenApp(null)} />}
      {openApp === 'hacktool' && <HackToolApp onClose={() => setOpenApp(null)} onGameOver={() => window.location.reload()} />}

      <Taskbar onSwitchToTerminal={onSwitchToTerminal} currentTime={currentTime} />
    </div>
  );
}
