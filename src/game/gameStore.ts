// Shared game state accessible by both Terminal and Desktop apps

export interface StoredVuln {
  type: string;
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  detail: string;
  exploited: boolean;
}

export interface StoredScan {
  url: string;
  ip: string;
  server: string;
  score: number;
  vulns: StoredVuln[];
  timestamp: number;
}

export interface LootItem {
  id: string;
  source: string;
  type: string;
  content: string;
  timestamp: number;
}

// Module-level state (persists across component renders within session)
let scannedTargets: StoredScan[] = [];
let lootItems: LootItem[] = [];
let listeners: (() => void)[] = [];

// VIP freelance missions tracking
let completedVipMissions: string[] = [];
let failedVipMissions: string[] = [];

// White Hat auditing missions tracking
let completedAuditMissions: string[] = [];
let failedAuditMissions: string[] = [];


// Reputation: -100 (full black hat) to +100 (full white hat), starts at 0
let reputation = 0;
let money = 0; // in USD
let crypto = 0; // in NTC (NightCoin)
let internetSpeed = 1; // in mbps (max 100)

// Stealth Tools
export interface StealthTools {
  stealthMode: boolean;
  fakeIp: boolean;
  vpn: boolean;
  proxyChain: boolean;
  macSpoof: boolean;
}

const FAKE_IPS = [
  '185.220.101.42', '104.244.76.13', '51.15.43.205', '198.98.51.189',
  '23.129.64.201', '45.33.32.156', '91.219.237.244', '176.10.104.240',
  '199.249.230.77', '209.127.17.234', '78.47.18.110', '37.120.167.95',
];

let tools: StealthTools = {
  stealthMode: false, fakeIp: false, vpn: false, proxyChain: false, macSpoof: false,
};
let ownedTools: StealthTools = {
  stealthMode: true, fakeIp: true, vpn: false, proxyChain: false, macSpoof: false,
};
let currentFakeIp = '';

// Strike system for Game Over mechanics
let noStealthStrikes = 0;
let noVpnStrikes = 0;
let noMacStrikes = 0;
let suspect = 0;
let lastDecayTime = Date.now();
export let gameOverReason: string | null = null;

const LOCAL_STORAGE_KEY = 'nightos_game_save';

export function clearSave() {
  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      window.localStorage.removeItem(LOCAL_STORAGE_KEY);
    } catch (e) {
      console.error('Failed to clear save data', e);
    }
  }
  // Reset in-memory values as well
  scannedTargets = [];
  lootItems = [];
  reputation = 0;
  money = 0;
  crypto = 0;
  internetSpeed = 1;
  tools = { stealthMode: false, fakeIp: false, vpn: false, proxyChain: false, macSpoof: false };
  ownedTools = { stealthMode: true, fakeIp: true, vpn: false, proxyChain: false, macSpoof: false };
  currentFakeIp = '';
  noStealthStrikes = 0;
  noVpnStrikes = 0;
  noMacStrikes = 0;
  allOffStrikes = 0;
  suspect = 0;
  gameOverReason = null;
  completedVipMissions = [];
  failedVipMissions = [];
  completedAuditMissions = [];
  failedAuditMissions = [];
  notify();
}

function saveState() {
  if (typeof window === 'undefined' || !window.localStorage) return;
  try {
    const state = {
      scannedTargets,
      lootItems,
      reputation,
      money,
      crypto,
      internetSpeed,
      tools,
      ownedTools,
      currentFakeIp,
      noStealthStrikes,
      noVpnStrikes,
      noMacStrikes,
      allOffStrikes,
      suspect,
      gameOverReason,
      completedVipMissions,
      failedVipMissions,
      completedAuditMissions,
      failedAuditMissions,
    };
    window.localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(state));
  } catch (e) {
    console.error('Failed to save state to localStorage', e);
  }
}

function loadState() {
  if (typeof window === 'undefined' || !window.localStorage) return;
  try {
    const data = window.localStorage.getItem(LOCAL_STORAGE_KEY);
    if (!data) return;
    const state = JSON.parse(data);
    if (!state) return;
    
    gameOverReason = state.gameOverReason || null;

    if (Array.isArray(state.scannedTargets)) scannedTargets = state.scannedTargets;
    if (Array.isArray(state.lootItems)) lootItems = state.lootItems;
    if (typeof state.reputation === 'number') reputation = state.reputation;
    if (typeof state.money === 'number') money = state.money;
    if (typeof state.crypto === 'number') crypto = state.crypto;
    if (typeof state.internetSpeed === 'number') internetSpeed = state.internetSpeed;
    if (state.tools) tools = { ...tools, ...state.tools };
    if (state.ownedTools) ownedTools = { ...ownedTools, ...state.ownedTools };
    if (typeof state.currentFakeIp === 'string') currentFakeIp = state.currentFakeIp;
    if (typeof state.noStealthStrikes === 'number') noStealthStrikes = state.noStealthStrikes;
    if (typeof state.noVpnStrikes === 'number') noVpnStrikes = state.noVpnStrikes;
    if (typeof state.noMacStrikes === 'number') noMacStrikes = state.noMacStrikes;
    if (typeof state.allOffStrikes === 'number') allOffStrikes = state.allOffStrikes;
    if (typeof state.suspect === 'number') suspect = state.suspect;
    if (Array.isArray(state.completedVipMissions)) completedVipMissions = state.completedVipMissions;
    if (Array.isArray(state.failedVipMissions)) failedVipMissions = state.failedVipMissions;
    if (Array.isArray(state.completedAuditMissions)) completedAuditMissions = state.completedAuditMissions;
    if (Array.isArray(state.failedAuditMissions)) failedAuditMissions = state.failedAuditMissions;
  } catch (e) {
    console.error('Failed to load state from localStorage', e);
  }
}

function notify() {
  saveState();
  listeners.forEach(fn => fn());
}

export function subscribe(fn: () => void) {
  listeners.push(fn);
  return () => { listeners = listeners.filter(l => l !== fn); };
}

export function getSuspect() { return suspect; }
export function getGameOverReason() { return gameOverReason; }

export function continueGame() {
  suspect = 0;
  gameOverReason = null;
  noStealthStrikes = 0;
  noVpnStrikes = 0;
  noMacStrikes = 0;
  allOffStrikes = 0;
  notify();
}

export function getTools(): StealthTools { return { ...tools }; }
export function getOwnedTools(): StealthTools { return { ...ownedTools }; }

export function unlockTool(key: keyof StealthTools) {
  ownedTools[key] = true;
  notify();
}

export function toggleTool(key: keyof StealthTools) {
  if (!ownedTools[key]) return; // Cannot toggle unowned tool
  tools[key] = !tools[key];
  if (key === 'fakeIp') {
    currentFakeIp = tools.fakeIp ? FAKE_IPS[Math.floor(Math.random() * FAKE_IPS.length)] : '';
  }
  notify();
}
export function getFakeIp() { return currentFakeIp; }
export function isReadyToScan() { return true; } // Allow scanning even if tools are off
export function isReadyToExploit() { return true; } // Allow exploiting even if tools are off

let allOffStrikes = 0;

export function checkStealthPenalties(action: 'scan' | 'exploit' | 'download'): { caught: boolean; reason?: string } {
  if (reputation > 10) return { caught: false }; // White Hats are immune to game over
  
  const allOff = !tools.stealthMode && !tools.fakeIp && !tools.vpn && !tools.proxyChain && !tools.macSpoof;
  
  if (allOff) {
    allOffStrikes++;
    if (allOffStrikes >= 5) {
       gameOverReason = "Anda tak menggunakan keamanan apapun! Semua terekspos ketika Anda melaksanakan aksi.";
       saveState();
       return { caught: true, reason: gameOverReason };
    }
  }

  if (action === 'scan' && !tools.stealthMode) {
    noStealthStrikes++;
    if (noStealthStrikes >= 5) {
      gameOverReason = "Aktivitas scanning mencurigakan terdeteksi oleh ISP. Koneksi diputus paksa.";
      saveState();
      return { caught: true, reason: gameOverReason };
    }
  }

  if (action === 'exploit' || action === 'download') {
    if (!tools.fakeIp) {
      noVpnStrikes++;
      if (noVpnStrikes >= 4) {
        gameOverReason = "Lokasi Anda terlacak dan Anda ditahan karena tidak melakukan IP Spoofing.";
        saveState();
        return { caught: true, reason: gameOverReason };
      }
    } else if (!tools.vpn) {
      noVpnStrikes++;
      if (noVpnStrikes >= 5) {
        gameOverReason = "Koneksi tidak terenkripsi berhasil disadap oleh penegak hukum.";
        saveState();
        return { caught: true, reason: gameOverReason };
      }
    }
    
    if (!tools.macSpoof) {
      noMacStrikes++;
      if (noMacStrikes >= 6) {
        gameOverReason = "Alamat fisik (MAC) perangkat Anda diblacklist dan berhasil dilacak.";
        saveState();
        return { caught: true, reason: gameOverReason };
      }
    }
  }

  saveState();
  return { caught: false };
}

export function getReputation() { return reputation; }
export function getMoney() { return money; }

export function getCompletedVipMissions() { return completedVipMissions; }
export function getFailedVipMissions() { return failedVipMissions; }

export function getCompletedAuditMissions() { return completedAuditMissions; }
export function getFailedAuditMissions() { return failedAuditMissions; }

export function completeAuditMission(missionId: string, payout: number, repGain: number) {
  if (!completedAuditMissions.includes(missionId)) {
    completedAuditMissions.push(missionId);
    money += payout; // Bug bounties pay in clean fiat USD!
    reputation = Math.min(100, reputation + repGain); // increases reputation (White Hat activity)
    notify();
  }
}

export function failAuditMission(missionId: string) {
  if (!failedAuditMissions.includes(missionId)) {
    failedAuditMissions.push(missionId);
    notify();
  }
}

export function penalizeAuditRep(amount: number) {
  reputation = Math.max(-100, reputation - amount);
  notify();
}

export function completeVipMission(missionId: string, payout: number, repImpact: number) {
  if (!completedVipMissions.includes(missionId)) {
    completedVipMissions.push(missionId);
    crypto += payout;
    reputation = Math.max(-100, reputation - repImpact); // reduces reputation (Black Hat activity)
    notify();
  }
}

export function failVipMission(missionId: string) {
  if (!failedVipMissions.includes(missionId)) {
    failedVipMissions.push(missionId);
    notify();
  }
}

export function penalizeVipTrust(amount: number) {
  reputation = Math.max(-100, reputation - amount);
  notify();
}

export function getInternetSpeed() { return internetSpeed; }
export function getSpeedMultiplier() { return 1 / Math.sqrt(internetSpeed); }

export function getUpgradeSpeedPrice() {
  if (internetSpeed >= 100) return -1;
  const nextSpeed = internetSpeed === 1 ? 5 : internetSpeed + 5;
  return nextSpeed * 200; // e.g. 5mbps = $1000, 100mbps = $20000
}

export function upgradeInternetSpeed(): { success: boolean; message: string } {
  if (internetSpeed >= 100) return { success: false, message: 'Maximum speed reached.' };
  
  const price = getUpgradeSpeedPrice();
  if (money < price) {
    return { success: false, message: `Insufficient funds. Need $${price.toLocaleString()} for upgrade.` };
  }
  
  money -= price;
  internetSpeed = internetSpeed === 1 ? 5 : internetSpeed + 5;
  notify();
  return { success: true, message: `Internet speed upgraded to ${internetSpeed} Mbps!` };
}

export function getReputationLabel(): { label: string; color: string } {
  if (reputation <= -70) return { label: 'NOTORIOUS CRIMINAL', color: '#ff0044' };
  if (reputation <= -40) return { label: 'BLACK HAT', color: '#ff4400' };
  if (reputation <= -10) return { label: 'GREY HAT (Dark)', color: '#ff8800' };
  if (reputation < 10) return { label: 'NEUTRAL', color: '#888888' };
  if (reputation < 40) return { label: 'GREY HAT (Light)', color: '#88aaff' };
  if (reputation < 70) return { label: 'WHITE HAT', color: '#00ccff' };
  return { label: 'ETHICAL HACKER', color: '#00ff88' };
}

// White Hat: report vulnerability to owner
// Small chance (30%) of getting a bug bounty reward
export function reportVuln(lootId: string): { success: boolean; reward: number; message: string } {
  const item = lootItems.find(l => l.id === lootId);
  if (!item) return { success: false, reward: 0, message: 'Loot not found.' };

  lootItems = lootItems.filter(l => l.id !== lootId);
  reputation = Math.min(100, reputation + 8);
  const bountyChance = Math.random();
  let reward = 0;
  let message: string;

  if (bountyChance < 0.30) {
    // Got a bug bounty!
    reward = Math.floor(Math.random() * 8000 + 2000);
    money += reward;
    message = `Bug bounty awarded! ${item.source} paid $${reward.toLocaleString()} for responsible disclosure.`;
  } else if (bountyChance < 0.55) {
    // Got a thank you but no money
    reward = Math.floor(Math.random() * 200 + 50);
    money += reward;
    message = `${item.source} thanked you and sent a small token of $${reward}. Reputation improved.`;
  } else {
    message = `${item.source} acknowledged the report. No monetary reward, but your reputation improved.`;
  }

  notify();
  return { success: true, reward, message };
}

// Black Hat: sell data on dark market
// Consistent high rewards but reputation drops + risk of getting traced
export function sellLoot(lootId: string): { success: boolean; reward: number; message: string; caught: boolean } {
  const item = lootItems.find(l => l.id === lootId);
  if (!item) return { success: false, reward: 0, message: 'Loot not found.', caught: false };

  lootItems = lootItems.filter(l => l.id !== lootId);

  reputation = Math.max(-100, reputation - 10);

  // Risk increases the more black hat you are. Missing proxyChain increases risk significantly.
  let riskBase = tools.proxyChain ? 0.08 : 0.35; 
  
  // Decrease chance of failing to sell when the 2 default tools (stealthMode & fakeIp) are ON
  if (tools.stealthMode && tools.fakeIp) {
    riskBase = riskBase * 0.3; // Reduces trace risk by 70%
  }

  const riskBonus = Math.abs(Math.min(0, reputation)) * 0.002; 
  const caught = Math.random() < (riskBase + riskBonus);

  let reward: number;
  let message: string;

  if (caught) {
    // Got traced! Lose some money as penalty
    const penalty = Math.floor(money * 0.15);
    money = Math.max(0, money - penalty);
    reputation = Math.max(-100, reputation - 5);
    
    // Increment suspect heat
    suspect = Math.min(100, suspect + 25);
    if (suspect >= 100) {
      gameOverReason = "Dicurigai (Suspect) mencapai 100%! Pihak berwenang berhasil melacak aktivitas Anda dan melakukan penangkapan.";
    }

    message = `⚠ TRACED! Buyer was a honeypot. Lost $${penalty.toLocaleString()} covering tracks. Heat level increased.`;
    notify();
    return { success: false, reward: 0, message, caught: true };
  }

  // Calculate reward based on loot type
  const baseRewards: Record<string, number> = {
    database_dump: 5000, credentials: 8000, session_cookies: 3000,
    user_data: 6000, system_files: 4000, admin_access: 10000,
    shell_access: 12000, auth_bypass: 7000, session_hijack: 4500,
    api_schema: 3500, raw_data: 2000,
  };
  const base = baseRewards[item.type] || 2000;
  reward = Math.floor(base + Math.random() * base * 0.5); // This is now in Crypto (NTC)
  crypto += reward;
  message = `Data sold on dark market for ${reward.toLocaleString()} NTC. Buyer: anonymous.`;

  notify();
  return { success: true, reward, message, caught: false };
}

export function getCrypto() { return crypto; }

interface Transaction {
  amount: number;
  timestamp: number;
}
let exchangeHistory: Transaction[] = [];

export function spendCrypto(amount: number): boolean {
  if (amount <= 0 || crypto < amount) return false;
  crypto -= amount;
  notify();
  return true;
}

export function getRateAtTimestamp(ts: number): { rate: number; trend: 'up' | 'down' | 'stable' | 'crash' } {
  const interval = Math.floor(ts / 120000); // 2 minutes in ms
  // Simple LCG pseudo-random seed based on interval
  const x = Math.sin(interval) * 10000;
  const r = x - Math.floor(x);
  
  let rate = 1.0;
  let trend: 'up' | 'down' | 'stable' | 'crash' = 'stable';
  
  if (r < 0.6) {
    const normalR = r / 0.6;
    rate = 0.6 + normalR * 0.8; // [0.6, 1.4]
    trend = rate > 1.1 ? 'up' : (rate < 0.9 ? 'down' : 'stable');
  } else if (r < 0.75) {
    const peakR = (r - 0.6) / 0.15;
    rate = 1.5 + peakR * 1.5; // [1.5, 3.0]
    trend = 'up';
  } else {
    const crashR = (r - 0.75) / 0.25;
    rate = 0.01 + crashR * 0.19; // [0.01, 0.20] (drop banget, ndak laku)
    trend = 'crash';
  }
  
  rate = Math.round(rate * 100) / 100;
  return { rate, trend };
}

export function getExchangeRate(): { rate: number; trend: 'up' | 'down' | 'stable' | 'crash' } {
  return getRateAtTimestamp(Date.now());
}

export function getTimeUntilNextFluctuation(): number {
  const now = Date.now();
  const nextChange = (Math.floor(now / 120000) + 1) * 120000;
  return Math.max(0, Math.ceil((nextChange - now) / 1000));
}

let lastInterval = Math.floor(Date.now() / 120000);
if (typeof window !== 'undefined') {
  setInterval(() => {
    const currentInterval = Math.floor(Date.now() / 120000);
    if (currentInterval !== lastInterval) {
      lastInterval = currentInterval;
      notify();
    }
  }, 5000);

  // Suspect Heat decay loop: check every 1 second
  setInterval(() => {
    if (suspect > 0) {
      // Base decay interval: 2 seconds
      // Slower decay the further "left" (Black Hat / reputation < 0)
      // e.g. at reputation = -100, interval is 2 + 10 = 12 seconds
      const decayIntervalMs = reputation < 0 
        ? (2 + Math.abs(reputation) / 10) * 1000 
        : 2000;

      if (Date.now() - lastDecayTime >= decayIntervalMs) {
        suspect = Math.max(0, suspect - 1);
        lastDecayTime = Date.now();
        notify();
      }
    } else {
      // Keep lastDecayTime fresh so it doesn't decay immediately when first point is added
      lastDecayTime = Date.now();
    }
  }, 1000);
}

export function exchangeCrypto(amount: number) {
  if (amount <= 0 || crypto < amount) {
    return { success: false, message: 'Insufficient NTC balance.', caught: false };
  }
  
  const now = Date.now();
  // Clear history older than 60 seconds
  exchangeHistory = exchangeHistory.filter(t => now - t.timestamp < 60000);
  
  const recentTotal = exchangeHistory.reduce((sum, t) => sum + t.amount, 0);
  const projectedTotal = recentTotal + amount;
  
  // Anti-Money Laundering (AML) Check
  // If amount exchanged within 60s > 50,000, high risk of getting caught.
  if (projectedTotal > 50000) {
    // 80% chance of getting caught if greedy!
    if (Math.random() < 0.8) {
      crypto -= amount; // confiscate the exchanged crypto
      money = 0; // frozen bank account!
      reputation = Math.max(-100, reputation - 20); // huge reputation hit
      gameOverReason = "AML DETECTED: Suspicious transaction volume (Smurfing). Your accounts have been frozen and the authorities have arrested you for money laundering.";
      notify();
      return { success: false, message: gameOverReason, caught: true };
    }
  }
  
  const { rate } = getExchangeRate();
  const payout = Math.floor(amount * rate);
  
  exchangeHistory.push({ amount, timestamp: now });
  crypto -= amount;
  money += payout;
  notify();
  return { 
    success: true, 
    message: `Successfully exchanged ${amount.toLocaleString()} NTC at rate $${rate} into $${payout.toLocaleString()} clean money.`, 
    caught: false 
  };
}

// Scan results
export function addScanResult(scan: StoredScan) {
  const existing = scannedTargets.findIndex(s => s.url === scan.url);
  if (existing >= 0) scannedTargets[existing] = scan;
  else scannedTargets.push(scan);
  notify();
}

export function getScannedTargets(): StoredScan[] {
  return scannedTargets;
}

export function findTarget(url: string): StoredScan | undefined {
  return scannedTargets.find(s => s.url.toLowerCase() === url.toLowerCase());
}

// Exploit
export function markExploited(url: string, vulnType: string): boolean {
  const target = findTarget(url);
  if (!target) return false;
  const vuln = target.vulns.find(v => v.type.toLowerCase().replace(/\s+/g, '-') === vulnType.toLowerCase() && !v.exploited);
  if (!vuln) return false;
  vuln.exploited = true;
  notify();
  return true;
}

// Loot
export function addLoot(item: LootItem) {
  lootItems.push(item);
  notify();
}

export function getLoot(): LootItem[] {
  return lootItems;
}

// Loot generation based on vulnerability type
const LOOT_TEMPLATES: Record<string, { type: string; contents: string[] }> = {
  'api-exposed': {
    type: 'database_dump',
    contents: [
      'Dumped 2,847 user records:\n  - emails, phone numbers, hashed passwords\n  - 142 admin accounts with elevated privileges\n  - keys: sk_live_iwjadindkwhiojiojihnui',
      'Extracted API endpoints:\n  /api/v1/users (GET/POST/DELETE)\n  /api/v1/admin/config (GET — no auth!)\n  /api/internal/debug (stack traces exposed)\n  Total records dumped: 14,203',
    ]
  },
  'sql-injection': {
    type: 'database_dump',
    contents: [
      'SQL Dump — Tables extracted:\n  users (12,847 rows) — emails, passwords (MD5)\n  transactions (45,201 rows) — amounts, accounts\n  admin_sessions (23 active tokens)\n  Sample: admin@site.com / 5f4dcc3b5aa765d61d8327deb882cf99',
      'Database: main_db\n  Table "credentials":\n    admin:$2b$10$vI8aWBnW3fID.ZQ4/zo... (bcrypt)\n    root:password123 (plaintext!)\n  Table "payment_info":\n    4532-XXXX-XXXX-8821 | Exp: 12/25 | CVV: ***',
    ]
  },
  'xss-(stored)': {
    type: 'session_cookies',
    contents: [
      'Stolen session cookies (47 active sessions):\n  PHPSESSID=a3fWa9gV2x8bKpL...\n  auth_token=eyJhbGciOiJIUzI1NiJ9...\n  admin_sid=ADMIN_5f2b7c8d9e1a...\n  Hijackable admin sessions: 3',
      'XSS payload deployed successfully.\n  Captured 89 session tokens in 2 minutes.\n  Notable: CEO account token captured\n  Token: Bearer eyJhbGciOiJSUzI1NiIs...',
    ]
  },
  'exposed-.env-file': {
    type: 'credentials',
    contents: [
      '.env contents:\n  DB_HOST=db.internal.prod\n  DB_USER=root\n  DB_PASS=Sup3rS3cret!@#\n  JWT_SECRET=my-ultra-secure-jwt-secret-2023\n  AWS_ACCESS_KEY=AKIAIOSFODNN7EXAMPLE\n  AWS_SECRET_KEY=wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY\n  STRIPE_SK=sk_live_51H7...',
    ]
  },
  'idor': {
    type: 'user_data',
    contents: [
      'IDOR exploitation — enumerated 500 user profiles:\n  User #1: CEO — john.doe@company.com, SSN: XXX-XX-4523\n  User #2: CFO — jane.smith@company.com, salary: $450,000\n  User #47: IT Admin — has server root credentials in notes\n  Total PII records: 12,493',
    ]
  },
  'directory-traversal': {
    type: 'system_files',
    contents: [
      'Extracted system files:\n  /etc/passwd — 24 user accounts\n  /etc/shadow — password hashes (crackable)\n  /root/.ssh/id_rsa — private SSH key!\n  /var/www/.git/config — repo credentials\n  /proc/self/environ — runtime secrets exposed',
    ]
  },
  'open-admin-panel': {
    type: 'admin_access',
    contents: [
      'Admin panel accessed with admin:admin123\n  Full control granted:\n  - User management (create/delete accounts)\n  - Database backup/restore\n  - Server configuration\n  - Payment gateway settings\n  - Extracted: master API key, backup encryption password',
    ]
  },
  'file-upload-rce': {
    type: 'shell_access',
    contents: [
      'Webshell uploaded: /uploads/shell.php\n  Remote Code Execution confirmed!\n  > whoami\n  www-data\n  > cat /etc/hostname\n  prod-web-01\n  > ls /home/\n  admin  deploy  backup\n  Reverse shell established on port 4444',
    ]
  },
  'jwt-none-algorithm': {
    type: 'auth_bypass',
    contents: [
      'JWT forged with alg:none\n  Original: {"sub":"user123","role":"user"}\n  Forged:   {"sub":"user123","role":"superadmin"}\n  Access granted to all admin endpoints\n  Extracted: user database, financial reports, audit logs',
    ]
  },
  'session-fixation': {
    type: 'session_hijack',
    contents: [
      'Session fixation successful:\n  Pre-set session ID accepted post-login\n  Hijacked 12 user sessions including:\n  - 2 admin accounts\n  - 1 database manager account\n  - Full access to internal dashboard',
    ]
  },
  'graphql-introspection': {
    type: 'api_schema',
    contents: [
      'Full GraphQL schema extracted:\n  Types: 47 | Queries: 23 | Mutations: 31\n  Sensitive fields found:\n    User.ssn, User.creditCard, User.passwordHash\n    Payment.rawAmount, Payment.bankAccount\n    Internal.adminToken, Internal.dbConnectionString\n  Private mutations: deleteAllUsers, grantAdmin, exportDatabase',
    ]
  },
};

export function generateLoot(url: string, vulnType: string): LootItem | null {
  const key = vulnType.toLowerCase();
  const template = LOOT_TEMPLATES[key];
  const fallback = {
    type: 'raw_data',
    contents: [`Exploit successful on ${url}.\nExtracted sensitive data from ${vulnType} vulnerability.\nData saved to loot directory.`],
  };
  const t = template || fallback;
  const content = t.contents[Math.floor(Math.random() * t.contents.length)];
  const id = `loot_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
  return { id, source: url, type: t.type, content, timestamp: Date.now() };
}

// Initial state load
loadState();
