import { useState, useEffect, useRef } from 'react';
import { infectedDevices } from '../game/infectedDevicesData';
import { checkStealthPenalties, getSpeedMultiplier, getInternetSpeed, addLoot, sellLoot } from '../game/gameStore';

export default function HackToolApp({ onClose, onGameOver }: { onClose: () => void, onGameOver: () => void }) {
  const [ipInput, setIpInput] = useState('');
  const [connectedDevice, setConnectedDevice] = useState<any | null>(null);
  const [logs, setLogs] = useState<string[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [logs]);

  const addLog = (text: string) => setLogs(p => [...p, text]);
  const delay = (ms: number) => new Promise(r => setTimeout(r, ms * getSpeedMultiplier()));

  const runSequence = async (steps: {t: string, d: number}[]) => {
    setIsProcessing(true);
    for (const s of steps) {
      addLog(s.t);
      if (s.d > 0) await delay(s.d);
    }
    setIsProcessing(false);
  };

  // Generates a transfer progress bar gimmick that scales with internet speed
  const runTransferGimmick = async (label: string, sizeMB: number) => {
    const speed = getInternetSpeed(); // in Mbps
    const transferTimeSec = sizeMB / speed; // simulated seconds
    const totalSteps = Math.max(4, Math.min(20, Math.ceil(transferTimeSec * 2)));
    const delayPerStep = Math.max(80, Math.floor((transferTimeSec * 1000) / totalSteps));

    addLog(`[${label}] Starting transfer... (${sizeMB} MB @ ${speed} Mbps)`);

    for (let i = 1; i <= totalSteps; i++) {
      const pct = Math.min(100, Math.round((i / totalSteps) * 100));
      const filled = Math.round(pct / 5);
      const bar = '█'.repeat(filled) + '░'.repeat(20 - filled);
      setLogs(p => {
        const copy = [...p];
        // Replace last progress line if it exists
        if (copy.length > 0 && copy[copy.length - 1].startsWith(`    [${label}]`)) {
          copy[copy.length - 1] = `    [${label}] [${bar}] ${pct}%`;
        } else {
          copy.push(`    [${label}] [${bar}] ${pct}%`);
        }
        return copy;
      });
      await new Promise(r => setTimeout(r, delayPerStep));
    }
  };

  const handleConnect = async () => {
    if (!ipInput.trim() || isProcessing) return;
    
    setLogs([]);
    const target = infectedDevices.find(d => d.ip === ipInput.trim());
    
    if (target) {
      await runSequence([
        { t: `[HACKTOOL] Initializing connection to ${ipInput}...`, d: 500 },
        { t: `[HACKTOOL] Bypassing firewall...`, d: 800 },
        { t: `[HACKTOOL] Handshake successful. Device OS: ${target.os}`, d: 300 },
        { t: `[HACKTOOL] Connection established.`, d: 0 }
      ]);
      setConnectedDevice(target);
    } else {
      await runSequence([
        { t: `[HACKTOOL] Initializing connection to ${ipInput}...`, d: 500 },
        { t: `[ERROR] Connection refused or host unreachable.`, d: 0 }
      ]);
    }
  };

  const handleDisconnect = () => {
    setConnectedDevice(null);
    setLogs(p => [...p, `[HACKTOOL] Disconnected from target.`]);
    setIpInput('');
  };

  const handleShareVirus = async () => {
    if (isProcessing) return;
    setIsProcessing(true);
    setLogs([]);

    addLog('[+] Initializing HackTool Payload Delivery System...');
    await delay(800);
    addLog('[+] Binding to local interface: 192.168.1.55');
    await delay(600);
    addLog(`[+] Scanning local network (192.168.1.0/24) @ ${getInternetSpeed()} Mbps...`);
    await runTransferGimmick('SCAN', 12);
    addLog('[+] Broadcasting zero-click infection payload...');
    await delay(1500);
    addLog('[+] Exploit successful. Backdoors established.');
    await delay(800);
    addLog(`[+] Found ${infectedDevices.length} vulnerable devices active on the network:\n`);
    await delay(600);
    for (let i = 0; i < infectedDevices.length; i++) {
      const dev = infectedDevices[i];
      addLog(`    -> [${dev.ip}] : ${dev.type} (${dev.os})`);
      if (i < infectedDevices.length - 1) await delay(400);
    }

    setIsProcessing(false);
  };

  const handleStealAndSell = async () => {
    if (!connectedDevice || isProcessing) return;
    setIsProcessing(true);

    const penalty = checkStealthPenalties('download');
    if (penalty.caught) {
      onGameOver();
      return;
    }

    // Try to find a meaningful file in the infected device's fs
    let foundFile: any = null;
    const searchFs = (node: any) => {
      if (foundFile) return;
      if (node.type === 'file' && node.content && node.content.length > 20) {
        foundFile = node;
      }
      if (node.children) {
        node.children.forEach(searchFs);
      }
    };
    if (connectedDevice.fs) searchFs(connectedDevice.fs);

    const dataSizeMB = Math.floor(Math.random() * 200 + 50);

    addLog(`[EXPLOIT] Scanning file system on ${connectedDevice.ip}...`);
    await delay(600);
    addLog(`[EXPLOIT] Accessing ${foundFile ? 'target data' : '/root/Storage'}...`);
    await delay(400);
    addLog(`[DOWNLOAD] Packing sensitive data (${dataSizeMB} MB)...`);
    await delay(500);

    // Transfer gimmick — speed-dependent
    await runTransferGimmick('DOWNLOAD', dataSizeMB);

    addLog(`[SUCCESS] ${dataSizeMB} MB exfiltrated from ${connectedDevice.ip}.`);
    await delay(300);

    // Create loot
    let newLoot;
    if (foundFile) {
      const lootType = foundFile.name.endsWith('.jpg') || foundFile.name.endsWith('.png') ? 'stolen_image' : foundFile.name.endsWith('.db') ? 'database_dump' : foundFile.name.endsWith('.pdf') ? 'stolen_document' : 'stolen_file';
      newLoot = {
        id: `loot_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        type: lootType,
        source: connectedDevice.ip,
        timestamp: Date.now(),
        content: `Filename: ${foundFile.name}\n\n${foundFile.content}`
      };
    } else {
      newLoot = {
        id: `loot_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        type: 'stolen_file',
        source: connectedDevice.ip,
        timestamp: Date.now(),
        content: `Raw system dump from ${connectedDevice.os}`
      };
    }
    addLoot(newLoot);

    // Sell immediately
    addLog(`[DARKNET] Connecting to marketplace...`);
    await delay(400);
    addLog(`[DARKNET] Uploading data to anonymous buyer...`);
    await runTransferGimmick('UPLOAD', Math.floor(dataSizeMB * 0.3));
    addLog(`[DARKNET] Negotiating price...`);
    await delay(600);

    const res = sellLoot(newLoot.id);
    if (res.caught) {
      addLog(`[ERROR] ${res.message}`);
      setIsProcessing(false);
      setTimeout(() => onGameOver(), 2000);
    } else {
      addLog(`[PROFIT] ${res.message}`);
      setIsProcessing(false);
    }
  };

  const speed = getInternetSpeed();
  const speedLabel = speed >= 50 ? '🟢' : speed >= 10 ? '🟡' : '🔴';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 landscape:p-1" style={{ background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(5px)' }}>
      <div className="relative flex flex-col rounded-xl overflow-hidden w-[95vw] md:w-[700px] h-[95vh] md:h-[500px]" style={{
        background: '#050a0f', border: '1px solid #00ffaa', boxShadow: '0 0 50px rgba(0, 255, 170, 0.15)'
      }}>
        {/* Top Bar */}
        <div className="flex items-center justify-between px-4 py-2 shrink-0" style={{ background: '#08121a', borderBottom: '1px solid #00ffaa33' }}>
          <div className="flex items-center gap-2">
            <span className="text-lg">⚡</span>
            <span className="text-sm font-mono font-bold text-[#00ffaa]">HACKTOOL <span className="text-[#00ccff]">v2.1</span></span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs font-mono text-gray-400">{speedLabel} {speed} Mbps</span>
            <button onClick={onClose} className="text-lg hover:text-red-500 transition-colors text-[#00ffaa55]">✕</button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 flex flex-col p-4 overflow-hidden gap-4">
          
          {/* Controls */}
          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={handleShareVirus}
              disabled={isProcessing || connectedDevice}
              className="bg-[#ffaa0022] hover:bg-[#ffaa0044] text-[#ffaa00] border border-[#ffaa0055] px-4 py-2 rounded font-mono font-bold transition-colors disabled:opacity-50"
              title="Broadcast infection to local network"
            >
              📡 SHARE VIRUS
            </button>
            <input 
              type="text" 
              value={ipInput}
              onChange={e => setIpInput(e.target.value)}
              disabled={isProcessing || connectedDevice}
              placeholder="Target IP Address (e.g. 192.168.1.104)"
              className="flex-1 bg-[#0a1520] border border-[#00ffaa33] text-[#00ffaa] p-2 rounded font-mono text-sm focus:outline-none focus:border-[#00ffaa]"
            />
            {!connectedDevice ? (
              <button 
                onClick={handleConnect}
                disabled={isProcessing || !ipInput.trim()}
                className="bg-[#00ffaa22] hover:bg-[#00ffaa44] text-[#00ffaa] border border-[#00ffaa55] px-6 py-2 rounded font-mono font-bold transition-colors disabled:opacity-50"
              >
                CONNECT
              </button>
            ) : (
              <button 
                onClick={handleDisconnect}
                disabled={isProcessing}
                className="bg-red-500/20 hover:bg-red-500/40 text-red-400 border border-red-500/50 px-4 py-2 rounded font-mono font-bold transition-colors disabled:opacity-50"
              >
                DISCONNECT
              </button>
            )}
          </div>

          {/* Action Area */}
          {connectedDevice && (
            <div className="shrink-0">
              <button 
                onClick={handleStealAndSell}
                disabled={isProcessing}
                className="w-full bg-[#ff005522] hover:bg-[#ff005544] text-[#ff0055] border border-[#ff005555] py-3 rounded font-mono font-bold transition-colors disabled:opacity-50"
              >
                <span className="mr-2">💰</span> STEAL & SELL (BLACK HAT)
              </button>
            </div>
          )}

          {/* Console */}
          <div 
            ref={scrollRef}
            className="flex-1 bg-[#020508] border border-[#00ffaa22] rounded p-3 overflow-y-auto font-mono text-xs text-gray-300 space-y-1"
          >
            {logs.length === 0 && <div className="text-gray-600 italic">Waiting for connection...</div>}
            {logs.map((log, i) => (
              <div key={i} className={`${log.includes('[ERROR]') ? 'text-red-400' : log.includes('[SUCCESS]') ? 'text-[#00ffaa] font-bold' : log.includes('[PROFIT]') ? 'text-[#ffaa00] font-bold' : ''}`}>
                {log}
              </div>
            ))}
            {isProcessing && <div className="text-[#00ffaa] animate-pulse">_</div>}
          </div>

        </div>
      </div>
    </div>
  );
}
