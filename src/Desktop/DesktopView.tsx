import { useState, useEffect } from 'react';
import Taskbar from './Taskbar';
import DesktopIcon from './DesktopIcon';
import InsideApp from './InsideApp';
import StealthToolsApp from './SettingsApp';
import DarkNetApp from './DarkNetApp';
import IspApp from './IspApp';
import HackToolApp from './HackToolApp';
import ZeroDayVipApp from './ZeroDayVipApp';
import WhiteHatAuditApp from './WhiteHatAuditApp';
import RolesApp from './RolesApp';
import { getTools, subscribe, getReputation, getSuspect } from '../game/gameStore';

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
    { icon: '🎓', label: 'Roles Guide', onClick: () => setOpenApp('roles'), glowColor: '#ffaa00' },
    { icon: '🛡️', label: 'Stealth Tools', onClick: () => setOpenApp('stealth'), glowColor: '#8888ff' },
    { icon: '🔍', label: 'Inside', onClick: handleInsideClick, glowColor: tools.stealthMode ? '#00ffcc' : '#333333' },
    { icon: '⚡', label: 'HackTool', onClick: () => setOpenApp('hacktool'), glowColor: '#00ffaa' },
    { icon: '📡', label: 'ISP Manager', onClick: () => setOpenApp('isp'), glowColor: '#00ccff' },
  ];

  if (rep <= 10) {
    baseIcons.push({ icon: '🕸️', label: 'Exchange', onClick: () => setOpenApp('darknet'), glowColor: '#ff4444' });
  }
  if (rep <= -30) {
    baseIcons.push({
      icon: '☠️',
      label: 'Zero-Day VIP',
      onClick: () => {
        showNotification('☠️ ACCESSING VIP UNDERGROUND ☠️');
        setOpenApp('zeroday');
      },
      glowColor: '#9900ff'
    });
  }
  if (rep >= 30) {
    baseIcons.push({
      icon: '🔬',
      label: 'White-Hat Audit',
      onClick: () => {
        showNotification('🔬 ACCESSING ETHICAL SECURITY AUDITORS 🔬');
        setOpenApp('whitehat');
      },
      glowColor: '#06b6d4'
    });
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
      <div className="absolute top-3 left-3 z-20 hidden sm:block" style={{ color: 'rgba(0,255,136,0.15)', fontSize: 10, fontFamily: 'monospace' }}>
        ┌─ NIGHTOS DESKTOP ─────────
      </div>
      <div className="absolute top-3 right-3 z-20 hidden sm:block" style={{ color: 'rgba(0,255,136,0.15)', fontSize: 10, fontFamily: 'monospace' }}>
        ────── SECURE SESSION ─┐
      </div>

      {/* Icons */}
      <div className="absolute top-20 md:top-10 left-4 right-4 md:right-[240px] bottom-14 z-10 p-4">
        <div className="grid grid-cols-3 min-[380px]:grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-4 content-start">
          {desktopIcons.map((item, i) => (
            <DesktopIcon key={i} icon={item.icon} label={item.label} onClick={item.onClick} glowColor={item.glowColor} />
          ))}
        </div>
      </div>

      {/* System status */}
      <div className="absolute top-4 left-4 right-4 md:left-auto md:right-4 md:top-10 md:w-52 z-20 p-2 md:p-3 rounded-lg flex flex-row md:flex-col items-center md:items-stretch justify-between md:justify-start gap-3 md:gap-1 font-mono" style={{
        background: 'rgba(0,255,136,0.03)', border: '1px solid rgba(0,255,136,0.1)',
        backdropFilter: 'blur(8px)',
      }}>
        <div className="text-[9px] md:text-[10px] tracking-widest shrink-0 font-bold" style={{ color: 'rgba(0,255,136,0.4)' }}>
          <span className="md:hidden">SYS STATUS</span>
          <span className="hidden md:inline">── SYSTEM STATUS ──</span>
        </div>
        <div className="flex flex-row md:flex-col flex-1 justify-around md:justify-start gap-x-3 gap-y-1 md:gap-1 w-full overflow-x-auto md:overflow-x-visible custom-scrollbar">
          {[
            { label: 'CPU', value: '12%', color: '#00ff88' },
            { label: 'MEM', value: '4.2G/64G', color: '#00ccff' },
            { label: 'STEALTH', value: tools.stealthMode ? 'ON' : 'OFF', color: tools.stealthMode ? '#00ff88' : '#ff4444' },
            { label: 'FAKE IP', value: tools.fakeIp ? 'ON' : 'OFF', color: tools.fakeIp ? '#00ff88' : '#ff4444' },
            { label: 'SUSPECT', value: `${getSuspect()}%`, color: getSuspect() > 70 ? '#ff0044' : getSuspect() > 40 ? '#ffaa00' : getSuspect() > 0 ? '#00ccff' : '#556655' },
            { label: 'TOOLS', value: `${Object.values(tools).filter(Boolean).length}/5`, color: '#ffaa00' },
          ].map((s, i) => (
            <div key={i} className="flex justify-between items-center gap-1 md:gap-0 text-[8px] md:text-[10px] whitespace-nowrap">
              <span className="opacity-50 mr-1 md:mr-0" style={{ color: 'rgba(0,255,136,0.3)' }}>{s.label}</span>
              <span style={{ color: s.color, opacity: 0.8 }}>{s.value}</span>
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
      {openApp === 'roles' && <RolesApp onClose={() => setOpenApp(null)} />}
      {openApp === 'stealth' && <StealthToolsApp onClose={() => setOpenApp(null)} />}
      {openApp === 'darknet' && <DarkNetApp onClose={() => setOpenApp(null)} />}
      {openApp === 'isp' && <IspApp onClose={() => setOpenApp(null)} />}
      {openApp === 'hacktool' && <HackToolApp onClose={() => setOpenApp(null)} onGameOver={() => window.location.reload()} />}
      {openApp === 'zeroday' && <ZeroDayVipApp onClose={() => setOpenApp(null)} />}
      {openApp === 'whitehat' && <WhiteHatAuditApp onClose={() => setOpenApp(null)} />}

      <Taskbar onSwitchToTerminal={onSwitchToTerminal} currentTime={currentTime} />
    </div>
  );
}
