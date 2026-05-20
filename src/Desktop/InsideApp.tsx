import { useState, useEffect, useRef } from 'react';
import { addScanResult, markExploited, generateLoot, addLoot, getReputation, getMoney, getCrypto, getReputationLabel, reportVuln, sellLoot, checkStealthPenalties, getSpeedMultiplier } from '../game/gameStore';
import type { LootItem } from '../game/gameStore';

interface Vulnerability { type: string; severity: 'CRITICAL'|'HIGH'|'MEDIUM'|'LOW'; detail: string; }
interface ScanResult { url: string; ip: string; server: string; status: string; vulns: Vulnerability[]; score: number; }

const FAKE_SITES = [
  { url: 'ecommerce-deals.id', ip: '103.28.12.44', server: 'Apache/2.4.41' },
  { url: 'bankportal-secure.co', ip: '45.77.134.22', server: 'nginx/1.18.0' },
  { url: 'hospital-records.net', ip: '202.134.0.88', server: 'IIS/10.0' },
  { url: 'gov-portal.go.id', ip: '118.98.36.42', server: 'Apache/2.4.29' },
  { url: 'university-lms.ac.id', ip: '167.205.1.10', server: 'nginx/1.22.1' },
  { url: 'smartparking.io', ip: '34.101.50.12', server: 'Express/4.18' },
  { url: 'food-delivery-app.com', ip: '52.74.88.201', server: 'Cloudflare' },
  { url: 'social-media-clone.net', ip: '185.199.110.3', server: 'nginx/1.20' },
  { url: 'crypto-exchange.xyz', ip: '104.21.55.77', server: 'Caddy/2.6' },
  { url: 'iot-dashboard.local', ip: '192.168.10.50', server: 'lighttpd/1.4' },
  { url: 'school-portal.sch.id', ip: '103.56.148.20', server: 'Apache/2.4.38' },
  { url: 'travel-booking.co.id', ip: '139.59.120.11', server: 'nginx/1.19' },
  { url: 'hr-management.biz', ip: '68.183.44.92', server: 'Tomcat/9.0' },
  { url: 'news-aggregate.media', ip: '143.198.65.33', server: 'Varnish/6.0' },
  { url: 'realestate-listing.id', ip: '103.100.28.15', server: 'Apache/2.4.52' },
];

const VULN_POOL: Vulnerability[] = [
  { type: 'API Exposed', severity: 'CRITICAL', detail: 'REST API endpoint /api/v1/users accessible without authentication.' },
  { type: 'SQL Injection', severity: 'CRITICAL', detail: "Login form vulnerable to SQL injection via username field." },
  { type: 'Unencrypted Data', severity: 'HIGH', detail: 'Sensitive data transmitted over HTTP without TLS.' },
  { type: 'XSS (Stored)', severity: 'HIGH', detail: 'Comment section allows stored XSS.' },
  { type: 'IDOR', severity: 'HIGH', detail: 'Changing /user/123 to /user/124 exposes other users\' data.' },
  { type: 'Directory Traversal', severity: 'HIGH', detail: 'Path traversal via ../../etc/passwd exposes system files.' },
  { type: 'Exposed .env File', severity: 'CRITICAL', detail: '/.env file publicly accessible with secrets.' },
  { type: 'Weak Encryption', severity: 'MEDIUM', detail: 'Passwords hashed with MD5 without salt.' },
  { type: 'CORS Misconfigured', severity: 'MEDIUM', detail: 'Access-Control-Allow-Origin set to *.' },
  { type: 'Debug Mode ON', severity: 'MEDIUM', detail: 'Stack traces and internal paths exposed.' },
  { type: 'Outdated Dependencies', severity: 'MEDIUM', detail: '14 npm packages with known CVEs detected.' },
  { type: 'Session Fixation', severity: 'HIGH', detail: 'Session ID not regenerated after login.' },
  { type: 'No Rate Limiting', severity: 'MEDIUM', detail: 'Brute-force attack can attempt 10,000 passwords/minute.' },
  { type: 'Open Admin Panel', severity: 'CRITICAL', detail: '/admin accessible with default credentials admin:admin123.' },
  { type: 'File Upload RCE', severity: 'CRITICAL', detail: 'File upload allows .php files for RCE.' },
  { type: 'JWT None Algorithm', severity: 'CRITICAL', detail: 'JWT accepts alg:none, auth bypass possible.' },
  { type: 'Missing CSP Header', severity: 'LOW', detail: 'No Content-Security-Policy header.' },
  { type: 'Info Disclosure', severity: 'LOW', detail: 'Server version exposed in HTTP headers.' },
  { type: 'Insecure Cookies', severity: 'MEDIUM', detail: 'Session cookies missing Secure/HttpOnly flags.' },
  { type: 'GraphQL Introspection', severity: 'HIGH', detail: 'Full API schema including private fields exposed.' },
];

function pickRandom<T>(arr: T[], count: number): T[] {
  return [...arr].sort(() => Math.random() - 0.5).slice(0, count);
}
function sevColor(s: string) {
  return s === 'CRITICAL' ? '#ff0044' : s === 'HIGH' ? '#ff6600' : s === 'MEDIUM' ? '#ffaa00' : '#00ccff';
}

type Phase = 'idle' | 'scanning' | 'results' | 'exploiting' | 'loot-action' | 'action-result';

interface InsideAppProps { onClose: () => void; }

export default function InsideApp({ onClose }: InsideAppProps) {
  const [phase, setPhase] = useState<Phase>('idle');
  const [scanLogs, setScanLogs] = useState<string[]>([]);
  const [result, setResult] = useState<ScanResult | null>(null);
  const [exploitedVulns, setExploitedVulns] = useState<Set<number>>(new Set());
  const [currentLoot, setCurrentLoot] = useState<LootItem | null>(null);
  const [actionMsg, setActionMsg] = useState('');
  const [actionType, setActionType] = useState<'success'|'error'>('success');
  const [isSelling, setIsSelling] = useState(false);
  const logRef = useRef<HTMLDivElement>(null);

  useEffect(() => { logRef.current?.scrollTo({ top: logRef.current.scrollHeight, behavior: 'smooth' }); }, [scanLogs]);

  const startScan = async () => {
    const penalty = checkStealthPenalties('scan');
    if (penalty.caught) {
      window.location.reload(); // Reload to trigger game over in App.tsx (the gameStore will hold the reason)
      return;
    }

    setPhase('scanning'); setScanLogs([]); setResult(null); setExploitedVulns(new Set()); setCurrentLoot(null);
    const site = FAKE_SITES[Math.floor(Math.random() * FAKE_SITES.length)];
    const vulns = pickRandom(VULN_POOL, Math.floor(Math.random() * 5) + 2);
    const score = Math.max(0, 100 - vulns.reduce((a, v) => a + (v.severity === 'CRITICAL' ? 25 : v.severity === 'HIGH' ? 15 : v.severity === 'MEDIUM' ? 8 : 3), 0));
    const steps = [
      { t: `[INSIDE] Target: https://${site.url}`, d: 400 }, { t: `[DNS] Resolving...`, d: 500 },
      { t: `[DNS] → ${site.ip}`, d: 300 }, { t: `[CONN] TLS handshake (TLS 1.3)`, d: 400 },
      { t: `[HTTP] Server: ${site.server}`, d: 200 }, { t: `[SCAN] Enumerating endpoints...`, d: 700 },
      { t: `[SCAN] Found 47 endpoints, 12 forms`, d: 500 }, { t: `[SCAN] Testing injections...`, d: 600 },
      { t: `[SCAN] Checking auth & headers...`, d: 500 }, { t: `[SCAN] Probing exposed files...`, d: 600 },
      { t: `[SCAN] CVE analysis...`, d: 700 }, { t: '', d: 150 },
      { t: `[RESULT] ${vulns.length} vulnerabilities found — Score: ${score}/100`, d: 0 },
    ];
    for (const s of steps) { setScanLogs(p => [...p, s.t]); if (s.d) await new Promise(r => setTimeout(r, s.d * getSpeedMultiplier())); }
    const sr: ScanResult = { url: site.url, ip: site.ip, server: site.server, status: score < 30 ? 'CRITICALLY INSECURE' : score < 60 ? 'VULNERABLE' : 'MODERATE', vulns, score };
    setResult(sr); setPhase('results');
    addScanResult({ url: site.url, ip: site.ip, server: site.server, score, vulns: vulns.map(v => ({ ...v, exploited: false })), timestamp: Date.now() });
  };

  const runExploit = async (vulnIdx: number) => {
    if (!result) return;
    
    const penalty = checkStealthPenalties('exploit');
    if (penalty.caught) {
      window.location.reload(); // Reload to trigger game over
      return;
    }

    const v = result.vulns[vulnIdx];
    setPhase('exploiting');
    const slug = v.type.toLowerCase().replace(/\s+/g, '-');
    const steps = [
      { t: `[EXPLOIT] Module: ${slug}`, d: 400 }, { t: `[EXPLOIT] Crafting payload...`, d: 600 },
      { t: `[EXPLOIT] Delivering via ${v.severity === 'CRITICAL' ? 'zero-day' : 'known vuln'}...`, d: 800 },
      { t: `[EXPLOIT] Bypassing security...`, d: 500 }, { t: `[EXPLOIT] Extracting data...`, d: 900 },
      { t: `[SUCCESS] ✓ Exploit successful!`, d: 0 },
    ];
    for (const s of steps) { setScanLogs(p => [...p, s.t]); if (s.d) await new Promise(r => setTimeout(r, s.d * getSpeedMultiplier())); }
    markExploited(result.url, slug);
    const loot = generateLoot(result.url, slug);
    if (loot) { addLoot(loot); setCurrentLoot(loot); }
    setExploitedVulns(p => new Set(p).add(vulnIdx));
    setPhase('loot-action');
  };

  const handleReport = () => {
    if (!currentLoot) return;
    const res = reportVuln(currentLoot.id);
    setActionMsg(res.message);
    setActionType('success');
    setPhase('action-result');
  };

  const handleSell = async () => {
    if (!currentLoot) return;
    setIsSelling(true);
    const rep = getReputation();
    const delayTime = Math.max(200, 2000 + (rep * 30)) * getSpeedMultiplier();
    await new Promise(r => setTimeout(r, delayTime));
    const res = sellLoot(currentLoot.id);
    setActionMsg(res.message);
    setActionType(res.caught ? 'error' : 'success');
    setPhase('action-result');
    setIsSelling(false);
  };

  const backToResults = () => { setCurrentLoot(null); setPhase('results'); };

  const rep = getReputation();
  const repInfo = getReputationLabel();
  const money = getMoney();
  const crypto = getCrypto();
  const repPct = ((rep + 100) / 200) * 100;
  const scoreColor = (s: number) => s < 30 ? '#ff0044' : s < 60 ? '#ffaa00' : '#00ff88';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 landscape:p-1" style={{ background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(4px)' }}>
      <div className="relative flex flex-col rounded-xl overflow-hidden w-[95vw] md:w-[960px] h-[95vh] md:h-[700px]" style={{
        background: 'linear-gradient(180deg, #0c0e14 0%, #080a10 100%)',
        border: '1px solid rgba(0,255,136,0.15)', boxShadow: '0 0 60px rgba(0,255,136,0.08)',
      }}>
        {/* Title bar */}
        <div className="flex items-center justify-between px-4 py-2 shrink-0" style={{ background: 'rgba(0,255,136,0.04)', borderBottom: '1px solid rgba(0,255,136,0.1)' }}>
          <div className="flex items-center gap-2">
            <span className="text-base">🔍</span>
            <span className="text-xs font-mono font-bold" style={{ color: '#00ff88' }}>INSIDE</span>
            <span className="text-[10px] font-mono" style={{ color: 'rgba(0,255,136,0.4)' }}>— Web Vulnerability Scanner v3.2</span>
          </div>
          {/* Wallet bar */}
          <div className="flex items-center gap-3 mr-8">
            <div className="flex items-center gap-1 font-mono">
              <span className="text-[8px]" style={{ color: '#ff4400' }}>BH</span>
              <div className="w-14 h-1.5 rounded-full overflow-hidden relative" style={{ background: 'rgba(255,255,255,0.06)' }}>
                <div className="absolute inset-0 rounded-full" style={{ background: 'linear-gradient(90deg, #ff0044, #888, #00ff88)', opacity: 0.4 }} />
                <div className="absolute top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full" style={{ left: `calc(${repPct}% - 3px)`, background: repInfo.color, boxShadow: `0 0 4px ${repInfo.color}` }} />
              </div>
              <span className="text-[8px]" style={{ color: '#00ff88' }}>WH</span>
            </div>
            <div className="flex flex-col items-end">
              <span className="text-[10px] font-mono font-bold" style={{ color: '#00ccff' }}>{crypto.toLocaleString()} NTC</span>
              <span className="text-[10px] font-mono font-bold" style={{ color: '#ffcc00' }}>${money.toLocaleString()}</span>
            </div>
          </div>
          <button onClick={onClose} className="text-lg px-2 hover:scale-125 transition-transform" style={{ color: '#ff4444' }}>✕</button>
        </div>

        {/* Main content */}
        <div className="flex flex-1 min-h-0">
          {/* Left: scan log */}
          <div className="flex-1 flex flex-col min-w-0">
            <div ref={logRef} className="flex-1 overflow-y-auto p-3 font-mono text-[11px] leading-relaxed" style={{ color: '#88aa88', scrollbarWidth: 'thin' }}>
              {phase === 'idle' && (
                <div className="flex flex-col items-center justify-center h-full gap-3 opacity-50">
                  <span className="text-4xl">🔍</span>
                  <span className="text-xs" style={{ color: '#00ff88' }}>Ready to scan</span>
                  <span className="text-[10px]" style={{ color: '#556655' }}>Click "SCAN" to find vulnerabilities</span>
                </div>
              )}
              {scanLogs.map((l, i) => (
                <div key={i} className={l === '' ? 'h-2' : ''} style={{ color: l.startsWith('[RESULT]') ? '#00ff88' : l.startsWith('[SCAN]') ? '#88aaff' : l.startsWith('[EXPLOIT]') ? '#ffaa00' : l.startsWith('[SUCCESS]') ? '#00ff88' : '#88aa88' }}>{l}</div>
              ))}
              {phase === 'scanning' && <span className="animate-pulse" style={{ color: '#00ff88' }}>█</span>}
            </div>
            <div className="p-3 shrink-0" style={{ borderTop: '1px solid rgba(0,255,136,0.08)' }}>
              <button onClick={startScan} disabled={phase === 'scanning' || phase === 'exploiting'}
                className="w-full py-2.5 rounded-lg text-xs font-mono font-bold tracking-wider transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                style={{ background: 'linear-gradient(135deg, rgba(0,255,136,0.15), rgba(0,200,255,0.1))', border: '1px solid rgba(0,255,136,0.25)', color: '#00ff88' }}>
                {phase === 'scanning' ? '⟳ SCANNING...' : '⚡ SCAN RANDOM TARGET'}
              </button>
            </div>
          </div>

          {/* Right panel */}
          <div className="w-[340px] shrink-0 flex flex-col border-l overflow-hidden" style={{ borderColor: 'rgba(0,255,136,0.08)', background: 'rgba(0,0,0,0.2)' }}>
            {/* Loot action phase */}
            {phase === 'loot-action' && currentLoot && (
              <div className="flex-1 flex flex-col p-3 gap-3 overflow-y-auto" style={{ scrollbarWidth: 'thin' }}>
                <div className="text-[10px] tracking-widest" style={{ color: 'rgba(0,255,136,0.4)' }}>── DATA EXTRACTED ──</div>
                <div className="p-3 rounded-lg font-mono text-[10px] leading-relaxed" style={{ background: 'rgba(0,255,136,0.03)', border: '1px solid rgba(0,255,136,0.1)', color: '#aabbaa' }}>
                  <div className="text-[9px] mb-1" style={{ color: '#556655' }}>Type: {currentLoot.type} | Source: {currentLoot.source}</div>
                  <div style={{ borderTop: '1px solid rgba(0,255,136,0.06)', paddingTop: 6, marginTop: 4 }}>{currentLoot.content}</div>
                </div>
                <div className="text-[10px] tracking-widest mt-2" style={{ color: 'rgba(0,255,136,0.4)' }}>── CHOOSE YOUR PATH ──</div>
                <button onClick={handleReport} className="w-full py-3 rounded-lg text-xs font-mono font-bold transition-all hover:scale-[1.02]" style={{ background: 'linear-gradient(135deg, rgba(0,180,255,0.12), rgba(0,255,136,0.08))', border: '1px solid rgba(0,180,255,0.3)', color: '#00ccff' }}>
                  <div>🛡️ REPORT — White Hat</div>
                  <div className="text-[9px] font-normal mt-1" style={{ color: 'rgba(0,200,255,0.5)' }}>Reputation ⬆ +8 | 30% chance bug bounty ($2K-$10K)</div>
                </button>
                <button disabled={isSelling} onClick={handleSell} className="w-full py-3 rounded-lg text-xs font-mono font-bold transition-all hover:scale-[1.02] disabled:opacity-50 disabled:scale-100" style={{ background: 'linear-gradient(135deg, rgba(255,0,68,0.12), rgba(255,100,0,0.08))', border: '1px solid rgba(255,0,68,0.3)', color: '#ff4444' }}>
                  <div>{isSelling ? '⏳ NEGOTIATING...' : '💀 SELL — Black Hat'}</div>
                  <div className="text-[9px] font-normal mt-1" style={{ color: 'rgba(255,68,68,0.5)' }}>Reputation ⬇ -10 | High $$$ but risk of trace</div>
                </button>
              </div>
            )}

            {/* Action result phase */}
            {phase === 'action-result' && (
              <div className="flex-1 flex flex-col p-3 gap-3 items-center justify-center">
                <span className="text-3xl">{actionType === 'success' ? '✅' : '⚠️'}</span>
                <div className="text-xs font-mono text-center leading-relaxed px-2" style={{ color: actionType === 'success' ? '#00ff88' : '#ff4444' }}>{actionMsg}</div>
                <div className="text-[11px] font-mono mt-2 space-y-1 w-full px-4">
                  <div className="flex justify-between"><span style={{ color: '#556655' }}>Reputation</span><span style={{ color: repInfo.color }}>{rep} ({repInfo.label})</span></div>
                  <div className="flex justify-between"><span style={{ color: '#556655' }}>Balance</span><span style={{ color: '#ffcc00' }}>${money.toLocaleString()}</span></div>
                </div>
                <button onClick={backToResults} className="mt-3 px-6 py-2 rounded-lg text-xs font-mono transition-all hover:scale-105" style={{ background: 'rgba(0,255,136,0.1)', border: '1px solid rgba(0,255,136,0.25)', color: '#00ff88' }}>
                  ← Back to Vulnerabilities
                </button>
              </div>
            )}

            {/* Results / default panel */}
            {(phase === 'results' || phase === 'exploiting') && result && (
              <>
                <div className="p-3 shrink-0" style={{ borderBottom: '1px solid rgba(0,255,136,0.08)' }}>
                  <div className="text-[10px] tracking-widest mb-2" style={{ color: 'rgba(0,255,136,0.4)' }}>── TARGET ──</div>
                  <div className="space-y-1 font-mono text-[11px]">
                    <div className="flex justify-between"><span style={{ color: '#556655' }}>URL</span><span style={{ color: '#00ccff' }}>{result.url}</span></div>
                    <div className="flex justify-between"><span style={{ color: '#556655' }}>IP</span><span style={{ color: '#aabbaa' }}>{result.ip}</span></div>
                    <div className="flex justify-between items-center">
                      <span style={{ color: '#556655' }}>Score</span>
                      <div className="flex items-center gap-2">
                        <div className="w-14 h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.05)' }}>
                          <div className="h-full rounded-full" style={{ width: `${result.score}%`, background: scoreColor(result.score) }} />
                        </div>
                        <span className="text-xs font-bold" style={{ color: scoreColor(result.score) }}>{result.score}/100</span>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="flex-1 overflow-y-auto p-2" style={{ scrollbarWidth: 'thin' }}>
                  <div className="text-[10px] tracking-widest mb-2 px-1" style={{ color: 'rgba(0,255,136,0.4)' }}>
                    ── VULNS ({result.vulns.length}) — Click to exploit ──
                  </div>
                  <div className="space-y-1.5">
                    {result.vulns.map((v, i) => {
                      const done = exploitedVulns.has(i);
                      return (
                        <button key={i} onClick={() => !done && phase === 'results' && runExploit(i)} disabled={done || phase === 'exploiting'}
                          className="w-full text-left p-2.5 rounded-lg transition-all font-mono disabled:cursor-not-allowed group" style={{
                            background: done ? 'rgba(0,255,136,0.04)' : 'rgba(0,0,0,0.2)',
                            border: `1px solid ${done ? 'rgba(0,255,136,0.15)' : 'rgba(255,255,255,0.04)'}`,
                            opacity: done ? 0.5 : 1,
                          }}>
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-[11px] font-bold" style={{ color: done ? '#556655' : '#ccddcc' }}>
                              {done ? '✓ ' : ''}{v.type}
                            </span>
                            <span className="text-[9px] px-1.5 py-0.5 rounded font-bold" style={{ background: `${sevColor(v.severity)}18`, color: sevColor(v.severity), border: `1px solid ${sevColor(v.severity)}30` }}>{v.severity}</span>
                          </div>
                          <div className="text-[9px]" style={{ color: '#667766' }}>{v.detail}</div>
                          {!done && phase === 'results' && (
                            <div className="text-[9px] mt-1.5 font-bold tracking-wider opacity-0 group-hover:opacity-100 transition-opacity" style={{ color: '#ff6600' }}>
                              ⚡ CLICK TO EXPLOIT
                            </div>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </>
            )}

            {/* Idle */}
            {(phase === 'idle' || phase === 'scanning') && !result && (
              <div className="flex-1 flex flex-col items-center justify-center gap-2 opacity-30">
                <span className="text-2xl">📊</span>
                <span className="text-[10px] font-mono" style={{ color: '#556655' }}>Scan a target to begin</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
