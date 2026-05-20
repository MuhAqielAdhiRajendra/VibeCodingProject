import { useState, useEffect, useRef } from 'react';

interface HackerBootProps {
  onFinish: () => void;
}

const LINES = [
  { text: 'BIOS v2.09.1 — Initializing hardware...', delay: 0, color: '#aaffaa' },
  { text: 'CPU: Intel Core i9-13900K @ 3.00GHz [32 CORES] .............. OK', delay: 300, color: '#aaffaa' },
  { text: 'RAM: 64GB DDR5-6400 .......................................... OK', delay: 500, color: '#aaffaa' },
  { text: 'GPU: NVIDIA RTX 4090 24GB .................................... OK', delay: 700, color: '#aaffaa' },
  { text: '', delay: 900, color: '#aaffaa' },
  { text: 'Booting NightOS v13.3.7 — [CLASSIFIED BUILD]', delay: 1000, color: '#00ffcc' },
  { text: '> Loading kernel modules...', delay: 1300, color: '#88aaff' },
  { text: '> Mounting encrypted volumes [AES-256-XTS]...', delay: 1600, color: '#88aaff' },
  { text: '> Starting network daemon (TOR bridge active)...', delay: 1900, color: '#88aaff' },
  { text: '> Initializing firewall rules [IPTABLES]...', delay: 2200, color: '#88aaff' },
  { text: '> Launching rootkit scanner...', delay: 2500, color: '#88aaff' },
  { text: '', delay: 2700, color: '#aaffaa' },
  { text: '[SYS] Scanning target network: 192.168.0.0/16', delay: 2800, color: '#ffcc00' },
  { text: '[SYS] Open ports detected: 22, 80, 443, 8080, 3306', delay: 3100, color: '#ffcc00' },
  { text: '[SYS] Vulnerability DB updated: CVE-2024-21412, CVE-2024-30051', delay: 3400, color: '#ffcc00' },
  { text: '', delay: 3600, color: '#aaffaa' },
  { text: '[NET] Establishing secure tunnel... done', delay: 3700, color: '#00ffcc' },
  { text: '[NET] Spoofing MAC address: DE:AD:BE:EF:CA:FE', delay: 3900, color: '#00ffcc' },
  { text: '[NET] Anonymizing traffic through 7 nodes...', delay: 4100, color: '#00ffcc' },
  { text: '', delay: 4300, color: '#aaffaa' },
  { text: '[EXPLOIT] Loading payload: shadow_breach_v4.bin', delay: 4400, color: '#ff4444' },
  { text: '[EXPLOIT] Injecting shellcode into process memory...', delay: 4700, color: '#ff4444' },
  { text: '[EXPLOIT] Privilege escalation: ROOT ACQUIRED ✓', delay: 5000, color: '#ff4444' },
  { text: '', delay: 5200, color: '#aaffaa' },
  { text: '[ACCESS] Decrypting shadow file...', delay: 5300, color: '#ff8800' },
  { text: '[ACCESS] Brute-force complete: 4096 hashes cracked', delay: 5600, color: '#ff8800' },
  { text: '[ACCESS] Session token injected. Auth bypass successful.', delay: 5900, color: '#ff8800' },
  { text: '', delay: 6100, color: '#aaffaa' },
  { text: '████████████████████████ ACCESS GRANTED ████████████████████████', delay: 6200, color: '#00ff88' },
  { text: '', delay: 6400, color: '#aaffaa' },
  { text: '[ BRIEFING MISI ]', delay: 6500, color: '#00ffcc' },
  { text: '', delay: 6650, color: '#aaffaa' },
  { text: '  01 ▸ Mencari File berharga yang tersembunyi di sistem', delay: 6700, color: '#ffcc00' },
  { text: '  02 ▸ Mengintai — pantau pergerakan target tanpa terdeteksi', delay: 6900, color: '#ffcc00' },
  { text: '  03 ▸ Ambil semua yang berharga', delay: 7100, color: '#ffcc00' },
];

const TOTAL_DURATION = 7800;

export default function HackerBoot({ onFinish }: HackerBootProps) {
  const [visibleLines, setVisibleLines] = useState<number[]>([]);
  const [cursorVisible, setCursorVisible] = useState(true);
  const [progress, setProgress] = useState(0);
  const [ready, setReady] = useState(false);   // progress hit 100%
  const [bypassed, setBypassed] = useState(false);   // user clicked bypass
  const [fadeOut, setFadeOut] = useState(false);
  const [btnPulse, setBtnPulse] = useState(false);   // draw attention animation
  const bottomRef = useRef<HTMLDivElement>(null);
  const onFinishRef = useRef(onFinish);
  useEffect(() => { onFinishRef.current = onFinish; }, [onFinish]);

  // Reveal lines one by one
  useEffect(() => {
    const timers = LINES.map((line, i) =>
      setTimeout(() => setVisibleLines(prev => [...prev, i]), line.delay)
    );
    return () => timers.forEach(clearTimeout);
  }, []);

  // Blinking cursor
  useEffect(() => {
    const t = setInterval(() => setCursorVisible(v => !v), 500);
    return () => clearInterval(t);
  }, []);

  // Progress bar — stops at 100%, does NOT auto-transition
  useEffect(() => {
    const start = Date.now();
    const t = setInterval(() => {
      const elapsed = Date.now() - start;
      const p = Math.min(100, Math.floor((elapsed / TOTAL_DURATION) * 100));
      setProgress(p);
      if (p >= 100) {
        clearInterval(t);
        setReady(true);
        // Pulse animation to draw user attention to the button
        setTimeout(() => setBtnPulse(true), 200);
      }
    }, 50);
    return () => clearInterval(t);
  }, []);

  // When user bypasses AND progress is done → fade out → call onFinish
  useEffect(() => {
    if (!bypassed || !ready) return;
    const t = setTimeout(() => setFadeOut(true), 100);
    const t2 = setTimeout(() => onFinishRef.current(), 900);
    return () => { clearTimeout(t); clearTimeout(t2); };
  }, [bypassed, ready]);

  // Auto-scroll to bottom
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [visibleLines]);

  const handleBypass = () => {
    if (!ready) return; // ignore if not done yet
    setBypassed(true);
  };

  return (
    <div
      className={`fixed inset-0 z-50 flex flex-col transition-opacity duration-700 ${fadeOut ? 'opacity-0' : 'opacity-100'}`}
      style={{ background: '#0a0a0a', fontFamily: "'Courier New', Courier, monospace" }}
    >
      {/* Scanlines overlay */}
      <div
        className="absolute inset-0 pointer-events-none z-10 opacity-[0.04]"
        style={{
          backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, #00ff00 2px, #00ff00 4px)',
        }}
      />

      {/* Header bar */}
      <div className="flex items-center justify-between px-6 py-2 border-b border-green-900/60 z-20 shrink-0">
        <span style={{ color: '#00ff88', fontSize: 12 }}>NightOS Terminal v13.3.7</span>
        <span style={{ color: '#ff4444', fontSize: 12 }}>⬤ SECURE MODE</span>
        <span style={{ color: '#888', fontSize: 12 }}>PID: 1337 | USER: root</span>
      </div>

      {/* Log output */}
      <div className="flex-1 overflow-y-auto px-6 py-4 z-20" style={{ scrollbarWidth: 'none' }}>
        {LINES.map((line, i) =>
          visibleLines.includes(i) ? (
            <div
              key={i}
              style={{ color: line.color, fontSize: 13, lineHeight: '1.7', whiteSpace: 'pre' }}
            >
              {line.text || '\u00A0'}
            </div>
          ) : null
        )}

        {/* Blinking cursor */}
        <span style={{ color: '#00ff88', fontSize: 13 }}>
          {cursorVisible ? '█' : ' '}
        </span>
        <div ref={bottomRef} />
      </div>

      {/* Footer */}
      <div className="px-6 pb-5 pt-2 z-20 shrink-0 border-t border-green-900/40">
        {/* Progress bar */}
        <div className="flex justify-between mb-1.5">
          <span style={{ color: '#00ff88', fontSize: 11 }}>System Boot Progress</span>
          <span style={{ color: '#00ff88', fontSize: 11 }}>{progress}%</span>
        </div>
        <div className="w-full rounded h-[6px] mb-4" style={{ background: '#111' }}>
          <div
            className="h-full rounded transition-all duration-100"
            style={{
              width: `${progress}%`,
              background: progress < 60
                ? 'linear-gradient(90deg, #00ff88, #00ccff)'
                : progress < 90
                  ? 'linear-gradient(90deg, #ffaa00, #ff6600)'
                  : 'linear-gradient(90deg, #00ff88, #00ff44)',
              boxShadow: '0 0 8px rgba(0,255,136,0.6)',
            }}
          />
        </div>

        {/* ── BYPASS BUTTON ── */}
        <div className="flex items-center justify-between gap-4">
          <span style={{ color: ready ? '#ff4444' : '#555', fontSize: 11, fontFamily: 'inherit' }}>
            {ready
              ? '⚠  ANTIVIRUS TERDETEKSI — Bypass diperlukan untuk melanjutkan'
              : '· Menunggu sistem siap...'}
          </span>
          <button
            onClick={handleBypass}
            disabled={!ready}
            className={`shrink-0 px-4 py-2 text-xs font-bold rounded border transition-all duration-300 ${ready
              ? `border-red-500 text-red-400 hover:bg-red-500 hover:text-black cursor-pointer ${btnPulse ? 'animate-pulse shadow-[0_0_12px_rgba(255,60,60,0.7)]' : ''
              }`
              : 'border-gray-700 text-gray-600 cursor-not-allowed'
              }`}
            style={{ fontFamily: 'inherit', letterSpacing: '0.05em' }}
          >
            {bypassed ? '✓ BYPASSED' : '[ BYPASS ANTIVIRUS ]'}
          </button>
        </div>
      </div>
    </div>
  );
}
