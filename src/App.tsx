import { useState, useRef, useEffect, useCallback } from 'react';
import { infectedDevices } from './game/infectedDevicesData';
import type { FileNode } from './game/infectedDevicesData';
import DesktopView from './Desktop/DesktopView';
import { getScannedTargets, findTarget, markExploited, generateLoot, addLoot, getLoot, getReputation, getMoney, getReputationLabel, sellLoot, reportVuln, toggleTool, getTools, getFakeIp, addScanResult, getCrypto, exchangeCrypto, spendCrypto, checkStealthPenalties, gameOverReason, getInternetSpeed, getSpeedMultiplier, getUpgradeSpeedPrice, upgradeInternetSpeed, getOwnedTools, unlockTool } from './game/gameStore';

type GameScreen = 'warning' | 'menu' | 'gameover';
type ViewMode = 'terminal' | 'desktop';

interface Log {
  type: 'input' | 'output' | 'error';
  text: string;
}

export default function App() {
  const [gameState, setGameState] = useState<GameScreen>('warning');
  const [input, setInput] = useState('');
  const [isHacktoolInstalled, setIsHacktoolInstalled] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [hasSudoAccess, setHasSudoAccess] = useState(false);
  const [connectedIp, setConnectedIp] = useState<string | null>(null);
  const [currentPath, setCurrentPath] = useState<string[]>([]);
  const [commandHistory, setCommandHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [viewMode, setViewMode] = useState<ViewMode>('terminal');
  const [logs, setLogs] = useState<Log[]>([
    { type: 'output', text: '  ___ _   _ ____ ___  ____  _____' },
    { type: 'output', text: ' |_ _| \\ | / ___|_ _| |  _ \\| ____|' },
    { type: 'output', text: '  | ||  \\| \\___ \\| |  | | | |  _|  ' },
    { type: 'output', text: '  | || |\\  |___) | |  | |_| | |___ ' },
    { type: 'output', text: ' |___|_| \\_|____/___| |____/|_____|' },
    { type: 'output', text: '' },
    { type: 'output', text: 'NightOS Terminal v13.3.7 [Secure Shell]' },
    { type: 'output', text: 'Type "help" for a list of available commands.' },
    { type: 'output', text: 'Type "tutorial" for a quick start guide.\n' }
  ]);
  
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  const getCurrentDirNode = useCallback(() => {
    if (!connectedIp) return null;
    const device = infectedDevices.find(d => d.ip === connectedIp);
    if (!device) return null;
    let current: FileNode = device.fs;
    for (const p of currentPath) {
      const next = current.children?.find(c => c.name === p && c.type === 'dir');
      if (next) current = next; else break;
    }
    return current;
  }, [connectedIp, currentPath]);

  const findInTree = (node: FileNode, pattern: string, path: string): string[] => {
    const results: string[] = [];
    if (node.name.toLowerCase().includes(pattern.toLowerCase())) results.push(path + node.name);
    if (node.children) for (const c of node.children) results.push(...findInTree(c, pattern, path + node.name + '/'));
    return results;
  };

  const buildTree = (node: FileNode, prefix: string, isLast: boolean): string[] => {
    const lines: string[] = [];
    const connector = isLast ? '└── ' : '├── ';
    lines.push(prefix + connector + (node.type === 'dir' ? node.name + '/' : node.name));
    if (node.children) {
      const np = prefix + (isLast ? '    ' : '│   ');
      node.children.forEach((c, i) => lines.push(...buildTree(c, np, i === node.children!.length - 1)));
    }
    return lines;
  };

  const runAsyncSequence = async (steps: {text: string; delay: number}[], onDone?: () => void) => {
    setIsProcessing(true);
    for (const step of steps) {
      setLogs(prev => [...prev, { type: 'output', text: step.text }]);
      if (step.delay > 0) await new Promise(r => setTimeout(r, step.delay * getSpeedMultiplier()));
    }
    setIsProcessing(false);
    onDone?.();
    setTimeout(() => inputRef.current?.focus(), 100);
  };

  const runInstallSequence = async () => {
    setIsProcessing(true);
    const steps = [
      { text: 'Reading package lists... Done', delay: 400 },
      { text: 'Building dependency tree... Done', delay: 300 },
      { text: 'Reading state information... Done', delay: 200 },
      { text: 'The following NEW packages will be installed:', delay: 100 },
      { text: '  hacktool libhack-core libcrypto-ssl', delay: 500 },
      { text: '0 upgraded, 3 newly installed, 0 to remove and 0 not upgraded.', delay: 200 },
      { text: 'Need to get 24.5 MB of archives.', delay: 300 },
      { text: 'Get:1 http://repo.nightos.local/main hacktool 2.1.0 [18.2 MB]', delay: 800 },
      { text: 'Get:2 http://repo.nightos.local/main libhack-core 1.0.4 [4.1 MB]', delay: 600 },
      { text: 'Get:3 http://repo.nightos.local/main libcrypto-ssl 3.2.1 [2.2 MB]', delay: 500 },
      { text: 'Fetched 24.5 MB in 2s (12.2 MB/s)', delay: 400 },
      { text: 'Selecting previously unselected package hacktool.', delay: 200 },
      { text: '(Reading database ... 10245 files and directories currently installed.)', delay: 600 },
      { text: 'Preparing to unpack .../hacktool_2.1.0_amd64.deb ...', delay: 300 },
      { text: 'Unpacking hacktool (2.1.0) ...', delay: 800 },
      { text: 'Setting up libcrypto-ssl (3.2.1) ...', delay: 400 },
      { text: 'Setting up libhack-core (1.0.4) ...', delay: 400 },
      { text: 'Setting up hacktool (2.1.0) ...', delay: 500 },
      { text: 'Processing triggers for man-db (2.9.1-1) ...', delay: 300 },
      { text: 'Installation complete. Hacktool is now ready to use.\n', delay: 0 }
    ];

    for (const step of steps) {
      setLogs(prev => [...prev, { type: 'output', text: step.text }]);
      if (step.delay > 0) {
        await new Promise(r => setTimeout(r, step.delay * getSpeedMultiplier()));
      }
    }
    setIsHacktoolInstalled(true);
    setIsProcessing(false);
    setTimeout(() => inputRef.current?.focus(), 100);
  };

  const runShareVirusSequence = async () => {
    setIsProcessing(true);
    const steps = [
      { text: '[+] Initializing HackTool Payload Delivery System...', delay: 800 },
      { text: '[+] Binding to local interface: 192.168.1.55', delay: 600 },
      { text: '[+] Scanning local network (192.168.1.0/24) for vulnerable targets...', delay: 1200 },
      { text: '    [====================] 100%', delay: 500 },
      { text: '[+] Broadcasting zero-click infection payload...', delay: 1500 },
      { text: '[+] Exploit successful. Backdoors established.', delay: 800 },
      { text: `[+] Found ${infectedDevices.length} vulnerable devices active on the network:\n`, delay: 600 },
      ...infectedDevices.map((dev, i) => ({
        text: `    -> [${dev.ip}] : ${dev.type} (${dev.os})`,
        delay: i === infectedDevices.length - 1 ? 0 : 400
      }))
    ];

    for (const step of steps) {
      setLogs(prev => [...prev, { type: 'output', text: step.text }]);
      if (step.delay > 0) {
        await new Promise(r => setTimeout(r, step.delay * getSpeedMultiplier()));
      }
    }
    setLogs(prev => [...prev, { type: 'output', text: '\nType a command to interact with a target device (e.g., connect 192.168.1.104).\n' }]);
    setIsProcessing(false);
    setTimeout(() => inputRef.current?.focus(), 100);
  };

  const handleCommand = (cmd: string) => {
    if (isProcessing) return;
    const trimmed = cmd.trim();
    if (!trimmed) return;
    
    const promptPrefix = connectedIp ? `user@${connectedIp}:/${currentPath.join('/')}$` : `user@nightos:~$`;
    setLogs(prev => [...prev, { type: 'input', text: `${promptPrefix} ${trimmed}` }]);
    setCommandHistory(prev => [...prev, trimmed]);
    setHistoryIndex(-1);
    
    let isSudo = hasSudoAccess;
    let actualCmd = trimmed;
    if (actualCmd.toLowerCase().startsWith('sudo ')) {
      isSudo = true;
      actualCmd = actualCmd.substring(5).trim();
      if (!hasSudoAccess) {
        setHasSudoAccess(true);
        setLogs(prev => [...prev, { type: 'output', text: '[sudo] password cached for current session.\n' }]);
      }
    }
    
    const lower = actualCmd.toLowerCase();
    
    if (lower === 'help') {
      setLogs(prev => [...prev, 
        { type: 'output', text: '╔══════════════════════════════════════════════════════╗' },
        { type: 'output', text: '║           NIGHTOS TERMINAL — COMMAND REFERENCE       ║' },
        { type: 'output', text: '╚══════════════════════════════════════════════════════╝' },
        { type: 'output', text: '' },
        { type: 'output', text: ' 🛡️ STEALTH & OPSEC:' },
        { type: 'output', text: '  stealth                View status of stealth tools' },
        { type: 'output', text: '  stealth toggle [tool]  Toggle tools (mode, ip, vpn, proxy, mac)' },
        { type: 'output', text: '' },
        { type: 'output', text: ' ⚡ HACKING TOOLS (require sudo):' },
        { type: 'output', text: '  sudo install [pkg]     Install a package (e.g. hacktool)' },
        { type: 'output', text: '  sudo share virus       Broadcast infection to local network' },
        { type: 'output', text: '  sudo connect [ip]      Connect to an infected device' },
        { type: 'output', text: '  sudo nmap [ip/range]   Scan network for open ports' },
        { type: 'output', text: '  ssh [ip]               Alias for connect' },
        { type: 'output', text: '  disconnect / exit      Disconnect from current device' },
        { type: 'output', text: '' },
        { type: 'output', text: ' 💀 EXPLOIT SYSTEM (use Inside app to scan first):' },
        { type: 'output', text: '  targets                List scanned targets & vulns' },
        { type: 'output', text: '  exploit [type] [url]   Run exploit on a vulnerability' },
        { type: 'output', text: '  loot                   View collected loot inventory' },
        { type: 'output', text: '  loot view [number]     Inspect a specific loot item' },
        { type: 'output', text: '' },
        { type: 'output', text: ' 💰 REPUTATION & ECONOMY:' },
        { type: 'output', text: '  sell [loot-number]     Sell data from inventory (Black Hat)' },
        { type: 'output', text: '  report [loot-number]   Report data from inventory (White Hat)' },
        { type: 'output', text: '  exchange [amount]      Exchange Crypto to Money (Watch out for AML!)' },
        { type: 'output', text: '  wallet / balance       Check money, crypto & reputation' },
        { type: 'output', text: '  reputation / rep       View reputation bar & details' },
        { type: 'output', text: '  shop                   Open DarkNet tool shop' },
        { type: 'output', text: '  purchase [item-id]     Buy and auto-install a tool' },
        { type: 'output', text: '' },
        { type: 'output', text: ' 📁 FILE SYSTEM (requires connection):' },
        { type: 'output', text: '  ls                     List directory contents' },
        { type: 'output', text: '  cd [dir]               Change directory (.. to go back)' },
        { type: 'output', text: '  pwd                    Print working directory' },
        { type: 'output', text: '  cat [file]             Display file contents' },
        { type: 'output', text: '  download [file]        Steal file to loot inventory' },
        { type: 'output', text: '  head [file]            Show first lines of a file' },
        { type: 'output', text: '  tail [file]            Show last lines of a file' },
        { type: 'output', text: '  find [name]            Search files recursively' },
        { type: 'output', text: '  grep [pattern] [file]  Search text inside files' },
        { type: 'output', text: '  tree                   Display directory tree' },
        { type: 'output', text: '  mkdir [name]           Create a new directory' },
        { type: 'output', text: '  touch [name]           Create an empty file' },
        { type: 'output', text: '  rm [name]              Remove a file or directory' },
        { type: 'output', text: '  cp [src] [dst]         Copy a file' },
        { type: 'output', text: '  mv [src] [dst]         Move / rename a file' },
        { type: 'output', text: '  chmod [mode] [file]    Change file permissions' },
        { type: 'output', text: '' },
        { type: 'output', text: ' 🖥️  SYSTEM INFO:' },
        { type: 'output', text: '  whoami                 Display current user' },
        { type: 'output', text: '  hostname               Show system hostname' },
        { type: 'output', text: '  uname -a               System information' },
        { type: 'output', text: '  uptime                 System uptime' },
        { type: 'output', text: '  date                   Current date and time' },
        { type: 'output', text: '  ps aux                 List running processes' },
        { type: 'output', text: '  kill [pid]             Terminate a process' },
        { type: 'output', text: '  df -h                  Disk space usage' },
        { type: 'output', text: '  free -h                Memory usage' },
        { type: 'output', text: '  neofetch               System info with ASCII art' },
        { type: 'output', text: '' },
        { type: 'output', text: ' 🌐 NETWORK:' },
        { type: 'output', text: '  ifconfig / ip a        Network interface info' },
        { type: 'output', text: '  ping [host]            Ping a host' },
        { type: 'output', text: '  wget / curl [url]      Download from URL' },
        { type: 'output', text: '' },
        { type: 'output', text: ' 📋 OTHER:' },
        { type: 'output', text: '  echo [text]            Print text to terminal' },
        { type: 'output', text: '  history                Show command history' },
        { type: 'output', text: '  man [cmd]              Show manual for a command' },
        { type: 'output', text: '  tutorial               Quick start guide' },
        { type: 'output', text: '  clear                  Clear terminal output' },
        { type: 'output', text: '' },
        { type: 'output', text: ' TIP: Use ↑↓ arrows to navigate history, TAB to autocomplete\n' }
      ]);
    } else if (lower.startsWith('tutorial')) {
      const arg = lower.split(' ')[1];
      if (!arg) {
        setLogs(prev => [...prev, 
          { type: 'output', text: '╔══════════════════════════════════════════════════════╗' },
          { type: 'output', text: '║           NIGHTOS — HACKING SCENARIOS GUIDE          ║' },
          { type: 'output', text: '╚══════════════════════════════════════════════════════╝' },
          { type: 'output', text: '' },
          { type: 'output', text: ' Please select a tutorial by typing: tutorial [number]' },
          { type: 'output', text: '' },
          { type: 'output', text: '  [1] Web Vulnerability Exploitation' },
          { type: 'output', text: '  [2] Local Network Infection (Hacktool)' },
          { type: 'output', text: '  [3] Laundering Crypto (Profit)' },
          { type: 'output', text: '  [4] DarkNet Shop (Buying Tools)' },
          { type: 'output', text: '' },
          { type: 'output', text: ' Example: tutorial 4\n' },
        ]);
      } else if (arg === '1') {
        setLogs(prev => [...prev,
          { type: 'output', text: ' SCENARIO 1: WEB VULNERABILITY EXPLOITATION' },
          { type: 'output', text: ' ──────────────────────────────────────────' },
          { type: 'output', text: ' 1. Setup   : Aktifkan Stealth Mode & Fake IP via "stealth" command.' },
          { type: 'output', text: ' 2. Scan    : Gunakan command "sudo nmap [ip]" untuk mencari target acak.' },
          { type: 'output', text: ' 3. Target  : Ketik "targets" di terminal untuk melihat daftar celah keamanan.' },
          { type: 'output', text: ' 4. Exploit : Ketik "exploit [jenis-celah] [url] [--sell | --report | --keep]"' },
          { type: 'output', text: '              --sell   : Otomatis jual (Black Hat, Dapat NTC).' },
          { type: 'output', text: '              --report : Otomatis report (White Hat).' },
          { type: 'output', text: '              --keep   : Simpan ke inventory ("loot").' },
          { type: 'output', text: '              *White Hat tidak bisa auto-sell. Jika Anda White Hat dan pakai --sell,' },
          { type: 'output', text: '              file akan otomatis masuk "loot". Jual manual dengan "sell [no]".' },
          { type: 'output', text: '              Jika argumen tidak diisi, otomatis mencoba --sell.' },
          { type: 'output', text: '              Contoh target (tergantung hasil scan):' },
          { type: 'output', text: '               → exploit sql-injection ecommerce-deals.id' },
          { type: 'output', text: '               → exploit xss social-media-clone.net' },
          { type: 'output', text: '\nKetik "tutorial" untuk kembali ke menu.\n' }
        ]);
      } else if (arg === '2') {
        setLogs(prev => [...prev,
          { type: 'output', text: ' SCENARIO 2: LOCAL NETWORK INFECTION (HACKTOOL)' },
          { type: 'output', text: ' ──────────────────────────────────────────────' },
          { type: 'output', text: ' 1. Install : Ketik "sudo install hacktool" untuk mengunduh exploit toolkit.' },
          { type: 'output', text: ' 2. Spread  : Ketik "sudo share virus" untuk menginfeksi perangkat di jaringan lokal.' },
          { type: 'output', text: ' 3. Connect : Ketik "sudo connect [ip]" untuk membuka backdoor ke perangkat target.' },
          { type: 'output', text: ' 4. Explore : Gunakan "ls" dan "cd" untuk mencari file rahasia.' },
          { type: 'output', text: ' 5. Steal   : Ketik "download [nama_file] [--sell | --report | --keep]"' },
          { type: 'output', text: '              Sama seperti exploit, White Hat tidak bisa auto-sell.' },
          { type: 'output', text: ' 6. Exit    : Ketik "disconnect" untuk keluar dari perangkat.' },
          { type: 'output', text: '\nKetik "tutorial" untuk kembali ke menu.\n' }
        ]);
      } else if (arg === '3') {
        setLogs(prev => [...prev,
          { type: 'output', text: ' SCENARIO 3: LAUNDERING CRYPTO (PROFIT)' },
          { type: 'output', text: ' ──────────────────────────────────────' },
          { type: 'output', text: ' 1. Wallet  : Ketik "wallet" untuk melihat saldo Fiat ($) dan Crypto (NTC) Anda.' },
          { type: 'output', text: ' 2. Exchange: Ketik "exchange [jumlah]" untuk mencairkan NightCoin (NTC).' },
          { type: 'output', text: '              Contoh: "exchange 10000" akan mencuci 10.000 NTC menjadi $10.000.' },
          { type: 'output', text: ' ⚠ WARNING  : Sistem AML (Anti-Money Laundering) mengawasi aliran dana!' },
          { type: 'output', text: '              Jika Anda mencairkan lebih dari 50.000 NTC sekaligus,' },
          { type: 'output', text: '              atau secara total dalam waktu 60 detik (Smurfing),' },
          { type: 'output', text: '              ada kemungkinan 80% Game Over (ditangkap AML)!' },
          { type: 'output', text: '\nKetik "tutorial" untuk kembali ke menu.\n' }
        ]);
      } else if (arg === '4') {
        setLogs(prev => [...prev,
          { type: 'output', text: ' SCENARIO 4: DARKNET SHOP (BUYING TOOLS)' },
          { type: 'output', text: ' ───────────────────────────────────────' },
          { type: 'output', text: ' 1. Shop    : Ketik "shop" untuk melihat daftar alat (stealth tools) yang dijual.' },
          { type: 'output', text: ' 2. Balance : Pastikan Anda memiliki cukup NTC dari hasil menjual data (Black Hat).' },
          { type: 'output', text: ' 3. Purchase: Ketik "purchase [id_alat]" untuk membeli.' },
          { type: 'output', text: '              Contoh: "purchase proxy" (seharga 25.000 NTC).' },
          { type: 'output', text: ' 4. Install : Sistem akan menginstal alat tersebut dan men-generate' },
          { type: 'output', text: '              License Key secara otomatis.' },
          { type: 'output', text: ' 5. Active  : Alat yang dibeli akan langsung Aktif (ON) tanpa perlu' },
          { type: 'output', text: '              Anda ketik perintah manual lagi.' },
          { type: 'output', text: '\nKetik "tutorial" untuk kembali ke menu.\n' }
        ]);
      } else {
        setLogs(prev => [...prev, { type: 'error', text: `Tutorial ${arg} tidak ditemukan. Ketik "tutorial" untuk melihat daftar.\n` }]);
      }
    } else if (lower === 'clear') {
      setLogs([]);
    } else if (lower === 'whoami') {
      setLogs(prev => [...prev, { type: 'output', text: isSudo ? 'root\n' : 'user\n' }]);
    } else if (lower.startsWith('install') || lower.startsWith('apt install') || lower.startsWith('apt-get install')) {
      if (!isSudo) {
        setLogs(prev => [...prev, { type: 'error', text: 'E: Could not open lock file - open (13: Permission denied)' }]);
        setLogs(prev => [...prev, { type: 'error', text: 'E: Unable to acquire the dpkg frontend lock, are you root?\n' }]);
        return;
      }
      const args = lower.split(' ');
      const pkg = args[args.length - 1]; // To handle 'apt install hacktool' or 'install hacktool'
      if (pkg === 'hacktool') {
        if (isHacktoolInstalled) {
          setLogs(prev => [...prev, { type: 'output', text: 'hacktool is already the newest version (2.1.0).\n' }]);
        } else {
          runInstallSequence();
        }
      } else if (args.length < 2 || pkg === 'install') {
        setLogs(prev => [...prev, { type: 'error', text: 'Usage: sudo install [package]. Example: sudo install hacktool\n' }]);
      } else {
        setLogs(prev => [...prev, { type: 'error', text: `E: Unable to locate package ${pkg}\n` }]);
      }
    } else if (lower === 'share virus' || lower === 'shere virus') {
      if (!isSudo) {
        setLogs(prev => [...prev, { type: 'error', text: 'Error: this command requires root privileges. Try "sudo share virus".\n' }]);
        return;
      }
      if (!isHacktoolInstalled) {
        setLogs(prev => [...prev, { type: 'error', text: 'Command not found. Note: "share virus" is a feature of "hacktool".' }]);
        setLogs(prev => [...prev, { type: 'error', text: 'Please install hacktool first using "sudo install hacktool".\n' }]);
      } else {
        runShareVirusSequence();
      }
    } else if (lower.startsWith('connect')) {
      if (!isSudo) {
        setLogs(prev => [...prev, { type: 'error', text: 'Error: socket binding requires root privileges. Try "sudo connect [ip]".\n' }]);
        return;
      }
      const args = lower.split(' ');
      const ip = args[1];
      if (!ip) {
        setLogs(prev => [...prev, { type: 'error', text: 'Usage: sudo connect [ip]\n' }]);
      } else {
        const target = infectedDevices.find(d => d.ip === ip);
        if (target) {
          setIsProcessing(true);
          setLogs(prev => [...prev, { type: 'output', text: `Connecting to ${ip}...` }]);
          setTimeout(() => {
            setConnectedIp(ip);
            setCurrentPath([]);
            setIsProcessing(false);
            setLogs(prev => [...prev, { type: 'output', text: `Connection established. Target OS: ${target.os}\n` }]);
            setTimeout(() => inputRef.current?.focus(), 50);
          }, 800 * getSpeedMultiplier());
        } else {
          setLogs(prev => [...prev, { type: 'error', text: `Connection failed: IP ${ip} not found or not vulnerable.\n` }]);
        }
      }
    } else if (lower === 'disconnect' || lower === 'exit') {
      if (connectedIp) {
        setLogs(prev => [...prev, { type: 'output', text: `Disconnected from ${connectedIp}.\n` }]);
        setConnectedIp(null);
        setCurrentPath([]);
      } else if (lower === 'exit') {
        setLogs(prev => [...prev, { type: 'output', text: 'Already at root session.\n' }]);
      }
    } else if (lower === 'ls') {
      if (!connectedIp) {
        setLogs(prev => [...prev, { type: 'error', text: 'ls: cannot open directory. Not connected to any device.\n' }]);
      } else {
        const node = getCurrentDirNode();
        if (node && node.children && node.children.length > 0) {
          const out = node.children.map(c => c.type === 'dir' ? `<DIR>  ${c.name}` : `       ${c.name}`).join('\n');
          setLogs(prev => [...prev, { type: 'output', text: out + '\n' }]);
        } else {
          setLogs(prev => [...prev, { type: 'output', text: '(empty directory)\n' }]);
        }
      }
    } else if (lower.startsWith('cd')) {
      if (!connectedIp) {
        setLogs(prev => [...prev, { type: 'error', text: 'cd: cannot change directory. Not connected to any device.\n' }]);
      } else {
        const targetDir = lower === 'cd' ? '' : actualCmd.substring(2).trim();
        if (!targetDir || targetDir === '/') {
          setCurrentPath([]);
        } else if (targetDir === '..') {
          setCurrentPath(prev => prev.slice(0, -1));
        } else {
          const node = getCurrentDirNode();
          const next = node?.children?.find(c => c.name.toLowerCase() === targetDir.toLowerCase());
          if (next && next.type === 'dir') {
             setCurrentPath(prev => [...prev, next.name]);
          } else if (next && next.type === 'file') {
             setLogs(prev => [...prev, { type: 'error', text: `cd: ${targetDir}: Not a directory\n` }]);
          } else {
             setLogs(prev => [...prev, { type: 'error', text: `cd: ${targetDir}: No such file or directory\n` }]);
          }
        }
      }
    } else if (lower.startsWith('cat ') || lower.startsWith('head ') || lower.startsWith('tail ')) {
      if (!connectedIp) { setLogs(p => [...p, { type: 'error', text: `${lower.split(' ')[0]}: not connected to any device.\n` }]); }
      else {
        const fname = actualCmd.substring(actualCmd.indexOf(' ') + 1).trim();
        const node = getCurrentDirNode();
        const file = node?.children?.find(c => c.name.toLowerCase() === fname.toLowerCase() && c.type === 'file');
        if (!file) setLogs(p => [...p, { type: 'error', text: `${lower.split(' ')[0]}: ${fname}: No such file\n` }]);
        else setLogs(p => [...p, { type: 'output', text: (file.content || '(empty file)') + '\n' }]);
      }
    } else if (lower.startsWith('download ')) {
      if (!connectedIp) { setLogs(p => [...p, { type: 'error', text: 'download: not connected to any device.\n' }]); }
      else {
        const penalty = checkStealthPenalties('download');
        if (penalty.caught) {
          setGameState('gameover');
          return;
        }

        const parts = actualCmd.substring(9).trim().split(' ');
        let fname = parts[0];
        let action = 'sell';
        
        if (parts.length > 1) {
          const last = parts[parts.length - 1];
          if (last === '--sell' || last === '--report' || last === '--keep') {
            action = last.substring(2);
            fname = parts.slice(0, -1).join(' ').trim();
          } else {
            fname = parts.join(' ').trim();
          }
        }

        const node = getCurrentDirNode();
        const file = node?.children?.find(c => c.name.toLowerCase() === fname.toLowerCase() && c.type === 'file');
        if (!file) setLogs(p => [...p, { type: 'error', text: `download: ${fname}: No such file\n` }]);
        else {
          const lootType = fname.endsWith('.jpg') || fname.endsWith('.png') ? 'stolen_image' : fname.endsWith('.db') ? 'database_dump' : fname.endsWith('.pdf') ? 'stolen_document' : 'stolen_file';
          const newLoot = {
            id: `loot_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
            type: lootType,
            source: connectedIp,
            timestamp: Date.now(),
            content: `Filename: ${file.name}\n\n${file.content || '(empty)'}`
          };
          addLoot(newLoot);
          
          if (action === 'keep') {
            setLogs(p => [...p,
              { type: 'output', text: `[STEAL] File '${file.name}' successfully stolen!` },
              { type: 'output', text: `[LOOT] Saved to inventory. Run "loot" to view.\n` }
            ]);
          } else if (action === 'report') {
            const res = reportVuln(newLoot.id);
            setLogs(p => [...p,
              { type: 'output', text: `[STEAL] File '${file.name}' successfully stolen!` },
              { type: 'output', text: `[WHITE HAT] Reporting to authorities...` },
              { type: 'output', text: `[RESULT] ${res.message}\n` }
            ]);
          } else {
            const rep = getReputation();
            if (rep > 10) {
              setLogs(p => [...p,
                { type: 'output', text: `[STEAL] File '${file.name}' successfully stolen!` },
                { type: 'error', text: `[DARKNET] Access denied. Your White Hat reputation prevents auto-selling.` },
                { type: 'output', text: `[LOOT] File saved to inventory. You must sell it manually via "sell" command.\n` }
              ]);
            } else {
              const delayTime = Math.max(200, 2000 + (rep * 20)); 
              runAsyncSequence([
                { text: `[STEAL] File '${file.name}' successfully stolen!`, delay: 400 },
                { text: `[DARKNET] Negotiating with anonymous buyer...`, delay: delayTime },
              ], () => {
                const res = sellLoot(newLoot.id);
                setLogs(p => [...p,
                  { type: 'output', text: `[PROFIT] ${res.message}\n` }
                ]);
              });
            }
          }
        }
      }
    } else if (lower === 'pwd') {
      if (!connectedIp) setLogs(p => [...p, { type: 'error', text: 'pwd: not connected to any device.\n' }]);
      else setLogs(p => [...p, { type: 'output', text: '/' + currentPath.join('/') + '\n' }]);
    } else if (lower.startsWith('find ')) {
      if (!connectedIp) { setLogs(p => [...p, { type: 'error', text: 'find: not connected to any device.\n' }]); }
      else {
        const pattern = actualCmd.substring(5).trim();
        if (!pattern) { setLogs(p => [...p, { type: 'error', text: 'Usage: find [name]\n' }]); }
        else {
          const device = infectedDevices.find(d => d.ip === connectedIp);
          if (device) {
            const results = findInTree(device.fs, pattern, '/');
            if (results.length > 0) setLogs(p => [...p, { type: 'output', text: results.join('\n') + '\n' }]);
            else setLogs(p => [...p, { type: 'output', text: `No files matching "${pattern}" found.\n` }]);
          }
        }
      }
    } else if (lower === 'tree') {
      if (!connectedIp) { setLogs(p => [...p, { type: 'error', text: 'tree: not connected to any device.\n' }]); }
      else {
        const node = getCurrentDirNode();
        if (node) {
          const lines = ['.' ];
          if (node.children) node.children.forEach((c, i) => lines.push(...buildTree(c, '', i === node.children!.length - 1)));
          setLogs(p => [...p, { type: 'output', text: lines.join('\n') + '\n' }]);
        }
      }
    } else if (lower.startsWith('grep ')) {
      if (!connectedIp) { setLogs(p => [...p, { type: 'error', text: 'grep: not connected to any device.\n' }]); }
      else {
        const parts = actualCmd.substring(5).trim().split(' ');
        if (parts.length < 2) { setLogs(p => [...p, { type: 'error', text: 'Usage: grep [pattern] [file]\n' }]); }
        else {
          const pattern = parts[0]; const fname = parts.slice(1).join(' ');
          const node = getCurrentDirNode();
          const file = node?.children?.find(c => c.name.toLowerCase() === fname.toLowerCase() && c.type === 'file');
          if (!file) setLogs(p => [...p, { type: 'error', text: `grep: ${fname}: No such file\n` }]);
          else if (!file.content) setLogs(p => [...p, { type: 'output', text: '(no matches)\n' }]);
          else {
            const matches = file.content.split('\n').filter(l => l.toLowerCase().includes(pattern.toLowerCase()));
            setLogs(p => [...p, { type: 'output', text: matches.length > 0 ? matches.join('\n') + '\n' : '(no matches)\n' }]);
          }
        }
      }
    } else if (lower.startsWith('mkdir ')) {
      if (!connectedIp) { setLogs(p => [...p, { type: 'error', text: 'mkdir: not connected.\n' }]); }
      else {
        const name = actualCmd.substring(6).trim();
        const node = getCurrentDirNode();
        if (node?.children?.find(c => c.name === name)) setLogs(p => [...p, { type: 'error', text: `mkdir: cannot create '${name}': File exists\n` }]);
        else { node?.children?.push({ name, type: 'dir', children: [] }); setLogs(p => [...p, { type: 'output', text: `Directory '${name}' created.\n` }]); }
      }
    } else if (lower.startsWith('touch ')) {
      if (!connectedIp) { setLogs(p => [...p, { type: 'error', text: 'touch: not connected.\n' }]); }
      else {
        const name = actualCmd.substring(6).trim();
        const node = getCurrentDirNode();
        if (node?.children?.find(c => c.name === name)) setLogs(p => [...p, { type: 'output', text: `'${name}' already exists.\n` }]);
        else { node?.children?.push({ name, type: 'file', content: '' }); setLogs(p => [...p, { type: 'output', text: `File '${name}' created.\n` }]); }
      }
    } else if (lower.startsWith('rm ')) {
      if (!connectedIp) { setLogs(p => [...p, { type: 'error', text: 'rm: not connected.\n' }]); }
      else {
        const name = actualCmd.substring(3).trim().replace('-r ', '').replace('-rf ', '');
        const node = getCurrentDirNode();
        const idx = node?.children?.findIndex(c => c.name.toLowerCase() === name.toLowerCase());
        if (idx === undefined || idx < 0) setLogs(p => [...p, { type: 'error', text: `rm: '${name}': No such file or directory\n` }]);
        else { node?.children?.splice(idx, 1); setLogs(p => [...p, { type: 'output', text: `Removed '${name}'.\n` }]); }
      }
    } else if (lower.startsWith('cp ')) {
      if (!connectedIp) { setLogs(p => [...p, { type: 'error', text: 'cp: not connected.\n' }]); }
      else {
        const parts = actualCmd.substring(3).trim().split(' ');
        if (parts.length < 2) { setLogs(p => [...p, { type: 'error', text: 'Usage: cp [source] [destination]\n' }]); }
        else {
          const node = getCurrentDirNode();
          const src = node?.children?.find(c => c.name.toLowerCase() === parts[0].toLowerCase());
          if (!src) setLogs(p => [...p, { type: 'error', text: `cp: '${parts[0]}': No such file\n` }]);
          else { node?.children?.push({ ...src, name: parts[1], content: src.content }); setLogs(p => [...p, { type: 'output', text: `Copied '${parts[0]}' -> '${parts[1]}'.\n` }]); }
        }
      }
    } else if (lower.startsWith('mv ')) {
      if (!connectedIp) { setLogs(p => [...p, { type: 'error', text: 'mv: not connected.\n' }]); }
      else {
        const parts = actualCmd.substring(3).trim().split(' ');
        if (parts.length < 2) { setLogs(p => [...p, { type: 'error', text: 'Usage: mv [source] [destination]\n' }]); }
        else {
          const node = getCurrentDirNode();
          const src = node?.children?.find(c => c.name.toLowerCase() === parts[0].toLowerCase());
          if (!src) setLogs(p => [...p, { type: 'error', text: `mv: '${parts[0]}': No such file\n` }]);
          else { src.name = parts[1]; setLogs(p => [...p, { type: 'output', text: `Renamed '${parts[0]}' -> '${parts[1]}'.\n` }]); }
        }
      }
    } else if (lower.startsWith('chmod ')) {
      if (!connectedIp) { setLogs(p => [...p, { type: 'error', text: 'chmod: not connected.\n' }]); }
      else {
        const parts = actualCmd.substring(6).trim().split(' ');
        if (parts.length < 2) setLogs(p => [...p, { type: 'error', text: 'Usage: chmod [mode] [file]\n' }]);
        else setLogs(p => [...p, { type: 'output', text: `Mode of '${parts[1]}' changed to ${parts[0]}.\n` }]);
      }
    } else if (lower === 'echo' || lower.startsWith('echo ')) {
      const text = actualCmd.length > 5 ? actualCmd.substring(5) : '';
      setLogs(p => [...p, { type: 'output', text: text + '\n' }]);
    } else if (lower === 'date') {
      setLogs(p => [...p, { type: 'output', text: new Date().toString() + '\n' }]);
    } else if (lower === 'uname -a' || lower === 'uname') {
      setLogs(p => [...p, { type: 'output', text: 'NightOS 6.1.0-night #1 SMP PREEMPT x86_64 GNU/Linux\n' }]);
    } else if (lower === 'hostname') {
      setLogs(p => [...p, { type: 'output', text: (connectedIp ? `target-${connectedIp.split('.').pop()}` : 'nightos') + '\n' }]);
    } else if (lower === 'ifconfig' || lower === 'ip a') {
      setLogs(p => [...p, { type: 'output', text: 'eth0: flags=4163<UP,BROADCAST,RUNNING,MULTICAST>  mtu 1500\n    inet 192.168.1.55  netmask 255.255.255.0  broadcast 192.168.1.255\n    ether DE:AD:BE:EF:CA:FE  txqueuelen 1000\n    RX packets 847293  bytes 1073741824 (1.0 GB)\n    TX packets 524188  bytes 536870912 (512.0 MB)\n\nlo: flags=73<UP,LOOPBACK,RUNNING>  mtu 65536\n    inet 127.0.0.1  netmask 255.0.0.0\n' }]);
    } else if (lower.startsWith('ping ')) {
      const host = actualCmd.substring(5).trim();
      if (!host) { setLogs(p => [...p, { type: 'error', text: 'Usage: ping [host]\n' }]); }
      else {
        runAsyncSequence([
          { text: `PING ${host} (${host}) 56(84) bytes of data.`, delay: 300 },
          { text: `64 bytes from ${host}: icmp_seq=1 ttl=64 time=${(Math.random()*10+1).toFixed(1)} ms`, delay: 800 },
          { text: `64 bytes from ${host}: icmp_seq=2 ttl=64 time=${(Math.random()*10+1).toFixed(1)} ms`, delay: 800 },
          { text: `64 bytes from ${host}: icmp_seq=3 ttl=64 time=${(Math.random()*10+1).toFixed(1)} ms`, delay: 800 },
          { text: `\n--- ${host} ping statistics ---\n3 packets transmitted, 3 received, 0% packet loss\n`, delay: 0 }
        ]);
      }
    } else if (lower.startsWith('nmap ')) {
      if (!isSudo) { setLogs(p => [...p, { type: 'error', text: 'nmap: requires root privileges. Try "sudo nmap [target]".\n' }]); }
      else {
        const targetUrl = actualCmd.substring(5).trim();
        const penalty = checkStealthPenalties('scan');
        if (penalty.caught) {
          setGameState('gameover');
          return;
        }
        
        // Fake scan generation logic
          const fakeIp = `104.${Math.floor(Math.random()*255)}.${Math.floor(Math.random()*255)}.${Math.floor(Math.random()*255)}`;
          const vulns = [
            { type: 'SQL Injection', severity: 'CRITICAL', detail: 'Vulnerable login form' },
            { type: 'XSS (Stored)', severity: 'HIGH', detail: 'Comment section vulnerable' },
            { type: 'API Exposed', severity: 'CRITICAL', detail: 'Unauthenticated API endpoint' }
          ].sort(() => Math.random() - 0.5).slice(0, Math.floor(Math.random() * 2) + 1);
          
          runAsyncSequence([
            { text: `Starting Nmap 7.94 ( https://nmap.org )`, delay: 400 },
            { text: `Scanning ${targetUrl}...`, delay: 1200 },
            { text: `Nmap scan report for ${targetUrl} (${fakeIp})`, delay: 600 },
            { text: 'PORT     STATE  SERVICE', delay: 200 },
            { text: '22/tcp   open   ssh', delay: 150 },
            { text: '80/tcp   open   http', delay: 150 },
            { text: '443/tcp  open   https', delay: 150 },
            { text: `\n[VULNERABILITY SCANNER] Analyzing headers and endpoints...`, delay: 800 },
            { text: `[+] Found ${vulns.length} potential vulnerabilities.`, delay: 500 },
            { text: `\nNmap done: 1 IP address (1 host up) scanned in 2.84s`, delay: 200 },
            { text: `Run "targets" to view details and start exploiting.\n`, delay: 0 }
          ], () => {
            // Save to store so 'targets' command can see it
            addScanResult({
              url: targetUrl,
              ip: fakeIp,
              server: 'Nginx/1.18.0',
              score: 40,
              vulns: vulns.map(v => ({ type: v.type, severity: v.severity as any, detail: v.detail, exploited: false })),
              timestamp: Date.now()
            });
          });
      }
    } else if (lower.startsWith('ssh ')) {
      const ip = actualCmd.substring(4).trim().replace(/.*@/, '');
      if (!isSudo) { setLogs(p => [...p, { type: 'error', text: 'ssh: requires root. Try "sudo ssh [ip]".\n' }]); }
      else if (!ip) { setLogs(p => [...p, { type: 'error', text: 'Usage: ssh [ip]\n' }]); }
      else {
        const target = infectedDevices.find(d => d.ip === ip);
        if (target) {
          setIsProcessing(true);
          setLogs(p => [...p, { type: 'output', text: `Connecting to ${ip}...` }]);
          setTimeout(() => { setConnectedIp(ip); setCurrentPath([]); setIsProcessing(false);
            setLogs(p => [...p, { type: 'output', text: `Connection established. Target OS: ${target.os}\n` }]);
            setTimeout(() => inputRef.current?.focus(), 50);
          }, 800 * getSpeedMultiplier());
        } else { setLogs(p => [...p, { type: 'error', text: `ssh: connect to host ${ip}: Connection refused\n` }]); }
      }
    } else if (lower === 'ps' || lower === 'ps aux') {
      setLogs(p => [...p, { type: 'output', text: 'USER       PID %CPU %MEM    VSZ   RSS TTY      STAT COMMAND\nroot         1  0.0  0.1 169344 13200 ?        Ss   /sbin/init\nroot        42  0.0  0.0      0     0 ?        S    [kthreadd]\nroot       187  0.1  0.2  72304 22400 ?        Ss   /usr/sbin/sshd\nroot       203  0.0  0.1  28352  8448 ?        Ss   /usr/sbin/cron\nwww-data   341  0.2  0.3 214500 31200 ?        S    /usr/sbin/apache2\nroot       512  1.2  0.5 385720 45800 ?        Sl   /usr/local/bin/hacktool\nuser      1337  0.0  0.0  10072  3200 pts/0    Ss   -bash\nuser      1842  0.0  0.0  10612  2100 pts/0    R+   ps aux\n' }]);
    } else if (lower.startsWith('kill ')) {
      const pid = actualCmd.substring(5).trim();
      if (!pid) setLogs(p => [...p, { type: 'error', text: 'Usage: kill [pid]\n' }]);
      else if (pid === '1' || pid === '42') setLogs(p => [...p, { type: 'error', text: `kill: (${pid}) - Operation not permitted\n` }]);
      else setLogs(p => [...p, { type: 'output', text: `Process ${pid} terminated.\n` }]);
    } else if (lower === 'history') {
      const hist = commandHistory.map((c, i) => `  ${i + 1}  ${c}`).join('\n');
      setLogs(p => [...p, { type: 'output', text: (hist || '(empty)') + '\n' }]);
    } else if (lower === 'uptime') {
      const mins = Math.floor(Math.random() * 500 + 60);
      const h = Math.floor(mins / 60); const m = mins % 60;
      setLogs(p => [...p, { type: 'output', text: ` ${new Date().toLocaleTimeString()} up ${h}:${String(m).padStart(2,'0')}, 1 user, load average: 0.42, 0.31, 0.28\n` }]);
    } else if (lower === 'df' || lower === 'df -h') {
      setLogs(p => [...p, { type: 'output', text: 'Filesystem      Size  Used Avail Use% Mounted on\n/dev/sda1       256G  142G  114G  56% /\ntmpfs           32G   1.2G  31G   4% /dev/shm\n/dev/sdb1       1.0T  687G  313G  69% /mnt/data\n' }]);
    } else if (lower === 'free' || lower === 'free -h') {
      setLogs(p => [...p, { type: 'output', text: '              total        used        free      shared  buff/cache   available\nMem:           64Gi       4.2Gi        52Gi       0.3Gi       7.8Gi        59Gi\nSwap:          8.0Gi       0.0Gi       8.0Gi\n' }]);
    } else if (lower === 'neofetch') {
      const user = connectedIp ? `user@${connectedIp}` : 'user@nightos';
      const sep = '-'.repeat(user.length);
      setLogs(p => [...p, { type: 'output', text:
`    ╔═══════════════╗       ${user}
    ║  ▄▄▄▄▄▄▄▄▄▄▄  ║       ${sep}
    ║  █ NIGHT OS █  ║       OS: NightOS v13.3.7 x86_64
    ║  █  v13.3.7 █  ║       Kernel: 6.1.0-night
    ║  ▀▀▀▀▀▀▀▀▀▀▀  ║       Uptime: ${Math.floor(Math.random()*10+1)} hours
    ╚═══════════════╝       Shell: nightsh 2.0
                            Terminal: NightTerm
     ████████████████       CPU: Intel i9-13900K (32) @ 3.00GHz
     ████████████████       GPU: NVIDIA RTX 4090
                            Memory: 4.2GiB / 64.0GiB
\n` }]);
    } else if (lower.startsWith('wget ') || lower.startsWith('curl ')) {
      const url = actualCmd.substring(actualCmd.indexOf(' ') + 1).trim();
      if (!url) { setLogs(p => [...p, { type: 'error', text: `Usage: ${lower.split(' ')[0]} [url]\n` }]); }
      else {
        runAsyncSequence([
          { text: `Connecting to ${url}...`, delay: 600 },
          { text: 'HTTP request sent, awaiting response... 200 OK', delay: 800 },
          { text: 'Length: 1048576 (1.0M) [application/octet-stream]', delay: 300 },
          { text: "Saving to: 'index.html'", delay: 200 },
          { text: '[===================>        ] 75%  512KB/s', delay: 700 },
          { text: '[============================] 100% 1.0M/s', delay: 500 },
          { text: `\n'index.html' saved [1048576/1048576]\n`, delay: 0 }
        ]);
      }
    } else if (lower.startsWith('man ')) {
      const cmd = actualCmd.substring(4).trim().toLowerCase();
      const manPages: Record<string,string> = {
        ls: 'ls - list directory contents\nUsage: ls\nList files and directories in the current location.',
        cd: 'cd - change directory\nUsage: cd [dir]\nNavigate the filesystem. Use ".." to go up, "/" to go to root.',
        cat: 'cat - concatenate and display file content\nUsage: cat [file]\nDisplay the full contents of a text file.',
        find: 'find - search for files\nUsage: find [pattern]\nRecursively search the filesystem for files matching the pattern.',
        grep: 'grep - search text patterns\nUsage: grep [pattern] [file]\nSearch for lines containing the pattern inside a file.',
        tree: 'tree - display directory structure\nUsage: tree\nShow a tree view of directories and files.',
        download: 'download - exfiltrate a file\nUsage: download [file]\nSteal a file from a connected device and automatically sell it on the darknet.',
        ping: 'ping - send ICMP echo\nUsage: ping [host]\nTest network connectivity to a host.',
        nmap: 'nmap - network scanner\nUsage: sudo nmap [target]\nScan a target for open ports and services.',
        connect: 'connect - backdoor connection\nUsage: sudo connect [ip]\nEstablish a backdoor to an infected device.',
        ssh: 'ssh - secure shell (alias for connect)\nUsage: sudo ssh [ip]\nConnect to a remote device.',
      };
      const page = manPages[cmd];
      if (page) setLogs(p => [...p, { type: 'output', text: page + '\n' }]);
      else setLogs(p => [...p, { type: 'error', text: `No manual entry for ${cmd}\n` }]);
    } else if (lower === 'targets') {
      const targets = getScannedTargets();
      if (targets.length === 0) {
        setLogs(p => [...p, { type: 'output', text: 'No scanned targets. Use the Inside app to scan websites first.\n' }]);
      } else {
        setLogs(p => [...p, { type: 'output', text: '── SCANNED TARGETS ──' }]);
        targets.forEach(t => {
          const unexploited = t.vulns.filter(v => !v.exploited).length;
          const total = t.vulns.length;
          setLogs(p => [...p, { type: 'output', text: `  ${t.url} [${t.ip}] — ${unexploited}/${total} vulns available` }]);
          t.vulns.forEach(v => {
            const slug = v.type.toLowerCase().replace(/\s+/g, '-');
            const status = v.exploited ? '✓ exploited' : '○ available';
            setLogs(p => [...p, { type: v.exploited ? 'output' : 'error', text: `    ${status}  ${slug} (${v.severity})` }]);
          });
        });
        setLogs(p => [...p, { type: 'output', text: '\nUsage: exploit [vuln-type] [target-url]\n' }]);
      }
    } else if (lower.startsWith('exploit ')) {
      const parts = actualCmd.substring(8).trim().split(' ');
      if (parts.length < 2) {
        setLogs(p => [...p, { type: 'error', text: 'Usage: exploit [vuln-type] [target-url] [--sell | --report | --keep]\nRun "targets" to see available exploits.\n' }]);
      } else {
        const vulnType = parts[0];
        let targetUrl = parts[1];
        let action = 'sell';
        
        if (parts.length === 3) {
          if (parts[2] === '--report') action = 'report';
          else if (parts[2] === '--sell') action = 'sell';
          else if (parts[2] === '--keep') action = 'keep';
          else targetUrl = parts.slice(1).join(' ');
        }
        
        const target = findTarget(targetUrl);
        if (!target) {
          setLogs(p => [...p, { type: 'error', text: `Target "${targetUrl}" not found. Scan it with Inside first.\n` }]);
        } else {
          const vuln = target.vulns.find(v => v.type.toLowerCase().replace(/\s+/g, '-') === vulnType.toLowerCase());
          if (!vuln) {
            setLogs(p => [...p, { type: 'error', text: `Vulnerability "${vulnType}" not found on ${targetUrl}.\nRun "targets" to see available vulns.\n` }]);
          } else if (vuln.exploited) {
            setLogs(p => [...p, { type: 'output', text: `Already exploited ${vulnType} on ${targetUrl}.\n` }]);
          } else {
            const penalty = checkStealthPenalties('exploit');
            if (penalty.caught) {
              setGameState('gameover');
              return;
            }

            // Run exploit sequence
            runAsyncSequence([
              { text: `[EXPLOIT] Initializing ${vulnType} exploit module...`, delay: 500 },
              { text: `[EXPLOIT] Target: ${targetUrl} (${target.ip})`, delay: 400 },
              { text: `[EXPLOIT] Crafting payload...`, delay: 700 },
              { text: `[EXPLOIT] Delivering payload via ${vuln.severity === 'CRITICAL' ? 'zero-day vector' : 'known vulnerability'}...`, delay: 900 },
              { text: `[EXPLOIT] Bypassing security controls...`, delay: 600 },
              { text: `[EXPLOIT] Executing remote code...`, delay: 800 },
              { text: `[EXPLOIT] Extracting data...`, delay: 1000 },
              { text: ``, delay: 200 },
              { text: `[SUCCESS] ✓ Exploit successful!`, delay: 300 },
            ], () => {
              markExploited(targetUrl, vulnType);
              const loot = generateLoot(targetUrl, vulnType);
              if (loot) {
                addLoot(loot);
                if (action === 'keep') {
                  setLogs(p => [...p,
                    { type: 'output', text: `[EXPLOIT] Data extracted: ${loot.type}` },
                    { type: 'output', text: `[LOOT] Saved to inventory. Run "loot" to view.\n` }
                  ]);
                } else if (action === 'report') {
                  const res = reportVuln(loot.id);
                  setLogs(p => [...p,
                    { type: 'output', text: `[EXPLOIT] Data extracted: ${loot.type}` },
                    { type: 'output', text: `[WHITE HAT] Reporting to authorities...` },
                    { type: 'output', text: `[RESULT] ${res.message}\n` }
                  ]);
                } else {
                  const rep = getReputation();
                  if (rep > 10) {
                    setLogs(p => [...p,
                      { type: 'output', text: `[EXPLOIT] Data extracted: ${loot.type}` },
                      { type: 'error', text: `[DARKNET] Access denied. Your White Hat reputation prevents auto-selling.` },
                      { type: 'output', text: `[LOOT] Data saved to inventory. You must sell it manually via "sell" command.\n` }
                    ]);
                  } else {
                    const delayTime = Math.max(200, 2000 + (rep * 20));
                    runAsyncSequence([
                      { text: `[EXPLOIT] Data extracted: ${loot.type}`, delay: 400 },
                      { text: `[DARKNET] Negotiating with anonymous buyer...`, delay: delayTime },
                    ], () => {
                      const res = sellLoot(loot.id);
                      setLogs(p => [...p,
                        { type: 'output', text: `[PROFIT] ${res.message}\n` },
                      ]);
                    });
                  }
                }
              }
            });
          }
        }
      }
    } else if (lower === 'loot') {
      const items = getLoot();
      if (items.length === 0) {
        setLogs(p => [...p, { type: 'output', text: 'No loot collected yet. Exploit vulnerabilities to extract data.\n' }]);
      } else {
        setLogs(p => [...p, { type: 'output', text: `── LOOT INVENTORY (${items.length} items) ──` }]);
        items.forEach((item, i) => {
          setLogs(p => [...p, { type: 'output', text: `  [${i + 1}] ${item.id} — ${item.type} (from ${item.source})` }]);
        });
        setLogs(p => [...p, { type: 'output', text: '\nRun "loot view [number]" to inspect an item.\n' }]);
      }
    } else if (lower.startsWith('loot view ')) {
      const idx = parseInt(actualCmd.substring(10).trim()) - 1;
      const items = getLoot();
      if (isNaN(idx) || idx < 0 || idx >= items.length) {
        setLogs(p => [...p, { type: 'error', text: `Invalid loot index. Run "loot" to see available items.\n` }]);
      } else {
        const item = items[idx];
        setLogs(p => [...p,
          { type: 'output', text: `── LOOT: ${item.id} ──` },
          { type: 'output', text: `Source: ${item.source}` },
          { type: 'output', text: `Type: ${item.type}` },
          { type: 'output', text: `Extracted: ${new Date(item.timestamp).toLocaleString()}` },
          { type: 'output', text: `───────────────────────` },
          { type: 'output', text: item.content },
          { type: 'output', text: '\n' },
        ]);
      }
    } else if (lower.startsWith('report ')) {
      const idx = parseInt(actualCmd.substring(7).trim()) - 1;
      const items = getLoot();
      if (isNaN(idx) || idx < 0 || idx >= items.length) {
        setLogs(p => [...p, { type: 'error', text: 'Usage: report [loot-number] — Report vulnerability to site owner (White Hat)\nRun "loot" to see items.\n' }]);
      } else {
        const result = reportVuln(items[idx].id);
        const repInfo = getReputationLabel();
        runAsyncSequence([
          { text: `[REPORT] Composing responsible disclosure email...`, delay: 600 },
          { text: `[REPORT] Sending to security@${items[idx].source}...`, delay: 800 },
          { text: `[REPORT] Encrypting communication (PGP)...`, delay: 500 },
          { text: `[REPORT] Disclosure sent successfully.`, delay: 400 },
          { text: ``, delay: 200 },
          { text: `${result.message}`, delay: 0 },
        ], () => {
          setLogs(p => [...p,
            { type: 'output', text: `Reputation: ${getReputation()} (${repInfo.label})` },
            { type: 'output', text: `Balance: $${getMoney().toLocaleString()} | Crypto: ${getCrypto().toLocaleString()} NTC\n` },
          ]);
        });
      }
    } else if (lower.startsWith('sell ')) {
      const idx = parseInt(actualCmd.substring(5).trim()) - 1;
      const items = getLoot();
      if (isNaN(idx) || idx < 0 || idx >= items.length) {
        setLogs(p => [...p, { type: 'error', text: 'Usage: sell [loot-number] — Sell data on dark market (Black Hat)\nRun "loot" to see items.\n' }]);
      } else {
        const result = sellLoot(items[idx].id);
        const repInfo = getReputationLabel();
        
        const rep = getReputation();
        const delayTime = Math.max(200, 2000 + (rep * 20));

        runAsyncSequence([
          { text: `[DARKNET] Connecting to .onion marketplace...`, delay: 600 },
          { text: `[DARKNET] Listing ${items[idx].type} from ${items[idx].source}...`, delay: 700 },
          { text: `[DARKNET] Negotiating with buyer...`, delay: delayTime },
          { text: `[DARKNET] Transferring data via encrypted channel...`, delay: 800 },
          { text: ``, delay: 200 },
          { text: result.caught ? `⚠ ${result.message}` : `✓ ${result.message}`, delay: 0 },
        ], () => {
          setLogs(p => [...p,
            { type: result.caught ? 'error' : 'output', text: `Reputation: ${getReputation()} (${repInfo.label})` },
            { type: 'output', text: `Balance: $${getMoney().toLocaleString()} | Crypto: ${getCrypto().toLocaleString()} NTC\n` },
          ]);
        });
      }
    } else if (lower.startsWith('exchange ')) {
      const amountStr = actualCmd.substring(9).trim();
      const amount = parseInt(amountStr);
      if (isNaN(amount) || amount <= 0) {
        setLogs(p => [...p, { type: 'error', text: 'Usage: exchange [amount]\n' }]);
      } else {
        const result = exchangeCrypto(amount);
        if (result.caught) {
          setGameState('gameover');
          return;
        }
        runAsyncSequence([
          { text: `[EXCHANGE] Initiating transfer of ${amount.toLocaleString()} NTC...`, delay: 600 },
          { text: `[EXCHANGE] Tumbling coins through mixer...`, delay: 1000 },
          { text: `[EXCHANGE] Routing through offshore accounts...`, delay: 800 },
          { text: ``, delay: 200 },
          { text: result.success ? `✓ ${result.message}` : `⚠ ${result.message}`, delay: 0 },
        ], () => {
          setLogs(p => [...p,
            { type: 'output', text: `Balance: $${getMoney().toLocaleString()} | Crypto: ${getCrypto().toLocaleString()} NTC\n` },
          ]);
        });
      }
    } else if (lower === 'wallet' || lower === 'balance') {
      const rep = getReputationLabel();
      setLogs(p => [...p,
        { type: 'output', text: '── WALLET ──' },
        { type: 'output', text: `  Fiat Balance: $${getMoney().toLocaleString()}` },
        { type: 'output', text: `  Crypto (NTC): ${getCrypto().toLocaleString()} NTC` },
        { type: 'output', text: `  Reputation  : ${getReputation()} (${rep.label})` },
        { type: 'output', text: '' },
        { type: 'output', text: '  Actions:' },
        { type: 'output', text: '    exchange [amt]   — Convert NTC to USD (Risk of AML if amt > 50k in 60s)' },
        { type: 'output', text: '    sell [n]         — Sell from inventory (if any)' },
        { type: 'output', text: '    report [n]       — Report from inventory (if any)\n' },
      ]);
    } else if (lower === 'reputation' || lower === 'rep') {
      const rep = getReputation();
      const info = getReputationLabel();
      const barLen = 30;
      const pos = Math.round(((rep + 100) / 200) * barLen);
      const bar = '─'.repeat(pos) + '◆' + '─'.repeat(barLen - pos);
      setLogs(p => [...p,
        { type: 'output', text: '── REPUTATION ──' },
        { type: 'output', text: `  Status: ${info.label}` },
        { type: 'output', text: `  Score: ${rep}` },
        { type: 'output', text: '' },
        { type: 'output', text: `  BLACK HAT [${bar}] WHITE HAT` },
        { type: 'output', text: '' },
        { type: 'output', text: '  ⬅ sell [n]   = -10 rep, high $$$, risk of trace' },
        { type: 'output', text: '  ➡ report [n] = +8 rep, small chance of bounty\n' },
      ]);
    } else if (lower.startsWith('stealth')) {
      const parts = actualCmd.trim().split(' ');
      if (parts.length === 1 || parts[1] === 'status') {
        const t = getTools();
        setLogs(p => [...p,
          { type: 'output', text: '── STEALTH TOOLS ──' },
          { type: 'output', text: `  [${t.stealthMode ? 'ON ' : 'OFF'}] mode  — Stealth Mode (required for scan)` },
          { type: 'output', text: `  [${t.fakeIp ? 'ON ' : 'OFF'}] ip    — IP Spoofing (required for exploit)` },
          { type: 'output', text: `  [${t.vpn ? 'ON ' : 'OFF'}] vpn   — VPN Tunnel` },
          { type: 'output', text: `  [${t.proxyChain ? 'ON ' : 'OFF'}] proxy — Proxy Chain` },
          { type: 'output', text: `  [${t.macSpoof ? 'ON ' : 'OFF'}] mac   — MAC Spoofing` },
          { type: 'output', text: '' },
          { type: 'output', text: 'Usage: stealth toggle [tool-name]' },
          { type: 'output', text: 'Example: stealth toggle ip\n' }
        ]);
      } else if (parts[1] === 'toggle' && parts[2]) {
        const toolName = parts[2].toLowerCase();
        const map: Record<string, string> = {
          'mode': 'stealthMode', 'ip': 'fakeIp', 'vpn': 'vpn',
          'proxy': 'proxyChain', 'mac': 'macSpoof'
        };
        const key = map[toolName] as keyof ReturnType<typeof getTools>;
        if (!key) {
          setLogs(p => [...p, { type: 'error', text: `Unknown tool: ${toolName}. Valid tools: mode, ip, vpn, proxy, mac\n` }]);
        } else {
          toggleTool(key);
          const t = getTools();
          setLogs(p => [...p, { type: 'output', text: `Stealth tool '${toolName}' is now ${t[key] ? 'ON' : 'OFF'}.\n` }]);
          if (toolName === 'ip' && t[key]) {
            setLogs(p => [...p, { type: 'output', text: `Spoofed IP assigned: ${getFakeIp()}\n` }]);
          }
        }
      } else {
        setLogs(p => [...p, { type: 'error', text: 'Usage: stealth [status|toggle] [tool]\n' }]);
      }
    } else if (lower === 'shop') {
      const owned = getOwnedTools();
      const speedPrice = getUpgradeSpeedPrice();
      const speedPriceStr = speedPrice < 0 ? 'MAX' : `$${speedPrice.toLocaleString()}`;
      setLogs(p => [...p,
        { type: 'output', text: '╔══════════════════════════════════════════════════════╗' },
        { type: 'output', text: '║                 DARKNET AUTO-SHOP                    ║' },
        { type: 'output', text: '╚══════════════════════════════════════════════════════╝' },
        { type: 'output', text: `  Your Balance: ${getCrypto().toLocaleString()} NTC | $${getMoney().toLocaleString()}` },
        { type: 'output', text: '' },
        { type: 'output', text: '  [ID]    [TOOL]                [PRICE]    [STATUS]' },
        { type: 'output', text: `  vpn     Zero-Log VPN          12,000 NTC ${owned.vpn ? '✓ INSTALLED' : '○ AVAILABLE'}` },
        { type: 'output', text: `  proxy   Elite Proxy Chain     25,000 NTC ${owned.proxyChain ? '✓ INSTALLED' : '○ AVAILABLE'}` },
        { type: 'output', text: `  mac     Hardware MAC Spoofer   8,500 NTC ${owned.macSpoof ? '✓ INSTALLED' : '○ AVAILABLE'}` },
        { type: 'output', text: `  speed   ISP Speed Upgrade     ${speedPriceStr.padEnd(10)} ${getInternetSpeed() >= 100 ? 'MAXED (100mbps)' : getInternetSpeed() + ' mbps'}` },
        { type: 'output', text: '' },
        { type: 'output', text: '  To buy and auto-install: purchase [id]' },
        { type: 'output', text: '  Example: purchase proxy\n' }
      ]);
    } else if (lower.startsWith('purchase ')) {
      const itemId = lower.substring(9).trim();
      
      if (itemId === 'speed') {
        const res = upgradeInternetSpeed();
        if (res.success) {
          setLogs(p => [...p, { type: 'output', text: `[✓] ${res.message}\n` }]);
        } else {
          setLogs(p => [...p, { type: 'error', text: `${res.message}\n` }]);
        }
        return;
      }

      const shopItems: Record<string, { key: keyof ReturnType<typeof getTools>, price: number, name: string }> = {
        'vpn': { key: 'vpn', price: 12000, name: 'Zero-Log VPN' },
        'proxy': { key: 'proxyChain', price: 25000, name: 'Elite Proxy Chain' },
        'mac': { key: 'macSpoof', price: 8500, name: 'Hardware MAC Spoofer' }
      };

      const item = shopItems[itemId];
      if (!item) {
        setLogs(p => [...p, { type: 'error', text: `Item ID '${itemId}' not found in shop.\n` }]);
      } else {
        const owned = getOwnedTools();
        if (owned[item.key]) {
          setLogs(p => [...p, { type: 'error', text: `You already own ${item.name}.\n` }]);
        } else if (getCrypto() < item.price) {
          setLogs(p => [...p, { type: 'error', text: `Insufficient funds. ${item.name} costs ${item.price.toLocaleString()} NTC. You have ${getCrypto().toLocaleString()} NTC.\n` }]);
        } else {
          if (spendCrypto(item.price)) {
            unlockTool(item.key);
            toggleTool(item.key);
            
            // Random license key generation
            const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
            const key = Array.from({length: 4}, () => Array.from({length: 4}, () => chars[Math.floor(Math.random() * chars.length)]).join('')).join('-');
            
            runAsyncSequence([
              { text: `[SHOP] Processing payment of ${item.price.toLocaleString()} NTC...`, delay: 800 },
              { text: `[SHOP] Payment confirmed. Downloading ${item.name} package...`, delay: 1000 },
              { text: `[SHOP] Unpacking files...`, delay: 600 },
              { text: `[SHOP] Executing auto-installer script...`, delay: 700 },
              { text: `[INSTALLER] Please enter license key to activate product.`, delay: 800 },
              { text: `[INSTALLER] Found valid key from DarkNet invoice: ${key}`, delay: 900 },
              { text: `[INSTALLER] Verifying key...`, delay: 1000 },
              { text: `[INSTALLER] ✓ Key activated successfully!`, delay: 500 },
              { text: ``, delay: 200 },
              { text: `[✓] ${item.name} has been installed and is now ON!`, delay: 0 }
            ]);
          } else {
            setLogs(p => [...p, { type: 'error', text: `Transaction failed.\n` }]);
          }
        }
      }
    } else if (actualCmd) {
      setLogs(prev => [...prev, { type: 'error', text: `Command not found: ${actualCmd}\n` }]);
    }
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleCommand(input);
      setInput('');
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (commandHistory.length === 0) return;
      const newIdx = historyIndex === -1 ? commandHistory.length - 1 : Math.max(0, historyIndex - 1);
      setHistoryIndex(newIdx);
      setInput(commandHistory[newIdx]);
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (historyIndex === -1) return;
      const newIdx = historyIndex + 1;
      if (newIdx >= commandHistory.length) { setHistoryIndex(-1); setInput(''); }
      else { setHistoryIndex(newIdx); setInput(commandHistory[newIdx]); }
    } else if (e.key === 'Tab') {
      e.preventDefault();
      const parts = input.split(' ');
      const cmds = ['help','tutorial','clear','whoami','cat','pwd','mkdir','touch','rm','find','echo',
        'date','uname','hostname','ifconfig','ping','nmap','ps','kill','history','uptime','df','free',
        'neofetch','wget','curl','chmod','cp','mv','tree','head','tail','grep','ssh','man','ls','cd',
        'sudo','install','connect','disconnect','exit','share'];
      if (parts.length <= 1) {
        const matches = cmds.filter(c => c.startsWith(parts[0].toLowerCase()) && c !== parts[0].toLowerCase());
        if (matches.length === 1) setInput(matches[0] + ' ');
        else if (matches.length > 1) setLogs(p => [...p, { type: 'output', text: matches.join('  ') }]);
      } else {
        const node = getCurrentDirNode();
        if (node?.children) {
          const last = parts[parts.length - 1].toLowerCase();
          const matches = node.children.filter(c => c.name.toLowerCase().startsWith(last));
          if (matches.length === 1) { parts[parts.length - 1] = matches[0].name; setInput(parts.join(' ')); }
          else if (matches.length > 1) setLogs(p => [...p, { type: 'output', text: matches.map(m => m.name).join('  ') }]);
        }
      }
    }
  };

  if (gameState === 'warning') {
    return (
      <div 
        className="w-screen h-screen flex flex-col items-center justify-center bg-black text-white p-6 cursor-pointer select-none"
        onClick={() => setGameState('menu')}
      >
        <p className="text-center text-xl md:text-3xl font-bold tracking-widest mb-6 text-red-500">
          ⚠️ PERINGATAN EDUKASI ⚠️
        </p>
        <div className="max-w-3xl text-center space-y-6 text-sm md:text-lg text-gray-300 leading-relaxed">
          <p>
            Game ini dibuat <strong>hanya untuk tujuan edukasi</strong>. Segala skenario peretasan, target, dan data yang ada di sini adalah <em>murni fiktif atau dibuat-buat</em>. Hacking tanpa izin di dunia nyata adalah tindak kejahatan siber yang serius.
          </p>
          <p className="text-[#00ff88] italic">
            "Jangan sia-siakan hidup untuk kegiatan ilegal. Sayangi keluarga dan nikmati hidup dengan tenang dan damai. Walau memiliki hasil yang kurang, jalani saja dengan usaha yang benar dan halal."
          </p>
        </div>
        <p className="mt-12 text-xs md:text-sm text-gray-500 animate-pulse uppercase tracking-[0.2em]">
          [ Klik Dimana Saja Untuk Melanjutkan ]
        </p>
      </div>
    );
  }

  if (gameState === 'gameover') {
    return (
      <div className="min-h-screen bg-black text-red-500 font-mono flex flex-col items-center justify-center p-8 select-none relative overflow-hidden">
        <div className="absolute inset-0 bg-red-900/20 animate-pulse pointer-events-none" />
        <h1 className="text-5xl md:text-7xl font-bold mb-6 text-center glitch" style={{ textShadow: '0 0 20px red' }}>
          GAME OVER
        </h1>
        <div className="text-xl md:text-2xl mb-8 text-center max-w-2xl text-red-400 bg-red-950/50 p-6 rounded border border-red-500/30 shadow-[0_0_15px_rgba(255,0,0,0.2)]">
          <p className="mb-2 uppercase tracking-widest text-sm text-red-300">INCIDENT REPORT</p>
          <p>{gameOverReason}</p>
        </div>
        <button 
          onClick={() => window.location.reload()}
          className="px-8 py-3 bg-red-950 border border-red-500 text-red-400 font-bold hover:bg-red-900 hover:text-white transition-colors uppercase tracking-widest z-10"
        >
          Reboot System
        </button>
      </div>
    );
  }

  if (viewMode === 'desktop') {
    return <DesktopView onSwitchToTerminal={() => setViewMode('terminal')} />;
  }

  return (
    <div 
      className="w-screen h-screen flex flex-col p-2 sm:p-4 overflow-hidden select-none"
      style={{ background: '#0a0a0a', color: '#aaffaa', fontFamily: "'Courier New', Courier, monospace" }}
      onClick={() => {
        if (!isProcessing) inputRef.current?.focus();
      }}
    >
      <div 
        className="absolute inset-0 pointer-events-none opacity-[0.04] z-0"
        style={{
          backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, #00ff00 2px, #00ff00 4px)',
        }}
      />
      
      {/* Container for logs and input, responsive for mobile landscape */}
      <div className="flex-1 overflow-y-auto pb-4 z-10 flex flex-col custom-scrollbar w-full max-w-5xl mx-auto text-xs sm:text-sm md:text-base">
        {logs.map((log, i) => (
          <div key={i} className={`whitespace-pre-wrap leading-relaxed ${log.type === 'error' ? 'text-[#ff4444]' : ''} ${log.type === 'input' ? 'font-bold text-[#00ffcc]' : ''}`}>
            {log.text}
          </div>
        ))}
        
        <div className="flex flex-wrap sm:flex-nowrap items-center mt-2 font-bold" style={{ color: '#00ffcc', opacity: isProcessing ? 0.5 : 1 }}>
          <span className="mr-2 whitespace-nowrap">
            {connectedIp ? `user@${connectedIp}:/${currentPath.join('/')}$` : `user@nightos:~$`}
          </span>
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={onKeyDown}
            disabled={isProcessing}
            className="flex-1 bg-transparent outline-none border-none shadow-none min-w-[100px]"
            style={{ color: '#00ffcc', caretColor: '#00ffcc' }}
            autoFocus
            autoComplete="off"
            spellCheck="false"
          />
          <button 
            disabled={isProcessing}
            onClick={() => {
              handleCommand(input);
              setInput('');
              inputRef.current?.focus();
            }}
            className="ml-2 px-3 py-1 text-xs border border-[#00ffcc]/50 text-[#00ffcc] rounded hover:bg-[#00ffcc] hover:text-black transition-colors whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed"
          >
            ENTER
          </button>
        </div>
        <div ref={bottomRef} className="h-4 sm:h-10 shrink-0" />
      </div>

      {/* Floating Desktop Switch Button */}
      <button
        onClick={() => setViewMode('desktop')}
        className="fixed bottom-3 right-3 z-50 flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-mono transition-all duration-300 hover:scale-105"
        style={{
          background: 'rgba(0,20,10,0.9)',
          border: '1px solid rgba(0,255,136,0.25)',
          color: '#00ff88',
          boxShadow: '0 0 15px rgba(0,255,136,0.1)',
          backdropFilter: 'blur(8px)',
        }}
      >
        <span style={{ fontSize: 14 }}>🖥️</span>
        <span>Desktop</span>
      </button>
      
      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        @media (min-width: 640px) { .custom-scrollbar::-webkit-scrollbar { width: 6px; } }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #004400; border-radius: 4px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #00ff00; }
        
        /* Disable iOS input zoom */
        input[type="text"] {
          font-size: 16px; 
        }
        @media (min-width: 768px) {
          input[type="text"] {
            font-size: inherit;
          }
        }
      `}</style>
    </div>
  );
}
