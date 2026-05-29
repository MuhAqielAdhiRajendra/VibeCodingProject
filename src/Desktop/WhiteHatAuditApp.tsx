import { useState, useEffect, useRef } from 'react';
import {
  getMoney,
  getReputation,
  getCompletedAuditMissions,
  getFailedAuditMissions,
  completeAuditMission,
  failAuditMission,
  penalizeAuditRep,
  subscribe
} from '../game/gameStore';

interface WhiteHatAuditAppProps {
  onClose: () => void;
}

interface AuditPuzzle {
  id: string;
  sender: string;
  avatar: string;
  title: string;
  desc: string;
  lang: 'Python' | 'C' | 'JavaScript' | 'PHP';
  filename: string;
  difficulty: 'EASY' | 'MEDIUM' | 'HARD' | 'EXPERT';
  payout: number;
  repImpact: number;
  preCode: string;
  postCode: string;
  clueComment: string;
  correctAnswer: string;
  hint: string;
  compileCmd: string;
}

const AUDITS: AuditPuzzle[] = [
  {
    id: 'audit_1',
    sender: 'secure_firmware_labs',
    avatar: '🔬',
    title: 'Buffer Overflow Check',
    desc: 'We are auditing an old C network interface library. A string copy operation is causing heap/stack corruptions on long inputs. Identify the vulnerable standard C call.',
    lang: 'C',
    filename: 'firmware.c',
    difficulty: 'EASY',
    payout: 3500,
    repImpact: 6,
    preCode: `#include <stdio.h>\n#include <string.h>\n\nvoid handle_packet(char *payload) {\n    char local_buf[64];\n    // VULNERABLE FUNCTION CALL HERE:\n    `,
    postCode: `(local_buf, payload);\n}`,
    clueComment: '// VULNERABLE FUNCTION CALL HERE:',
    correctAnswer: 'strcpy',
    hint: 'A standard string copying function that does not verify buffer lengths.',
    compileCmd: 'cppcheck firmware.c'
  },
  {
    id: 'audit_2',
    sender: 'netops_defense',
    avatar: '🌐',
    title: 'Command Injection Bug',
    desc: 'An internal Python administration tool pings web servers. We suspect input parameter expansion allows execution of arbitrary shell command arguments. Identify the vulnerable execution API.',
    lang: 'Python',
    filename: 'diagnostic.py',
    difficulty: 'EASY',
    payout: 4000,
    repImpact: 6,
    preCode: `import os\n\ndef run_ping(ip_addr):\n    # VULNERABLE SYSTEM CALL HERE:\n    status = `,
    postCode: `("ping -c 1 " + ip_addr)\n    return status`,
    clueComment: '# VULNERABLE SYSTEM CALL HERE:',
    correctAnswer: 'os.system',
    hint: 'Python function to execute a shell command string directly in a subshell.',
    compileCmd: 'bandit diagnostic.py'
  },
  {
    id: 'audit_3',
    sender: 'web_portal_security',
    avatar: '🛡️',
    title: 'DOM Stored XSS',
    desc: 'We are reviewing a comment rendering component in our frontend Javascript app. Untrusted markup is parsed directly, enabling client script injection. Find the dangerous property assignment.',
    lang: 'JavaScript',
    filename: 'comments.js',
    difficulty: 'MEDIUM',
    payout: 8500,
    repImpact: 8,
    preCode: `function displayComment(userMessage) {\n    const element = document.createElement("div");\n    // VULNERABLE DOM PROPERTY HERE:\n    element.`,
    postCode: ` = "<strong>Anonymous:</strong> " + userMessage;\n    document.getElementById("forum").appendChild(element);\n}`,
    clueComment: '// VULNERABLE DOM PROPERTY HERE:',
    correctAnswer: 'innerHTML',
    hint: 'DOM property that reads or sets markup without escaping HTML tags.',
    compileCmd: 'eslint comments.js'
  },
  {
    id: 'audit_4',
    sender: 'ecommerce_backend',
    avatar: '🛒',
    title: 'Unescaped SQL Query',
    desc: 'A PHP customer query routine concatenates incoming query arguments directly. We need to identify the exact database method executing this raw SQL query.',
    lang: 'PHP',
    filename: 'db.php',
    difficulty: 'MEDIUM',
    payout: 11000,
    repImpact: 10,
    preCode: `<?php\nfunction get_product($db_conn, $prod_id) {\n    // VULNERABLE QUERY EXECUTION HERE:\n    $result = $db_conn->`,
    postCode: `("SELECT * FROM items WHERE id = " . $prod_id);\n    return $result->fetch_assoc();\n}`,
    clueComment: '// VULNERABLE QUERY EXECUTION HERE:',
    correctAnswer: 'query',
    hint: 'Standard MySQLi/PDO method executing queries directly, susceptible to SQL Injection.',
    compileCmd: 'phpstan db.php'
  },
  {
    id: 'audit_5',
    sender: 'core_authentication',
    avatar: '🔑',
    title: 'Insecure Object Loader',
    desc: 'An automated user authentication agent loads cached credentials from active cookie files in python. Users can forge pickle data to gain RCE. What load function is used?',
    lang: 'Python',
    filename: 'session.py',
    difficulty: 'HARD',
    payout: 20000,
    repImpact: 12,
    preCode: `import pickle\n\ndef decode_session(cookie_bytes):\n    # VULNERABLE LOADS FUNCTION HERE:\n    user_session = `,
    postCode: `(cookie_bytes)\n    return user_session`,
    clueComment: '# VULNERABLE LOADS FUNCTION HERE:',
    correctAnswer: 'pickle.loads',
    hint: 'Vulnerable method from pickle library that deserializes a python object from bytes.',
    compileCmd: 'bandit session.py'
  },
  {
    id: 'audit_6',
    sender: 'daemon_core_infra',
    avatar: '🤖',
    title: 'Format String Injection',
    desc: 'Our logging module passes variables directly to standard outputs without proper format formatting specs. Identify the print statement vulnerable to memory leaks.',
    lang: 'C',
    filename: 'logger.c',
    difficulty: 'EXPERT',
    payout: 35000,
    repImpact: 15,
    preCode: `#include <stdio.h>\n\nvoid write_syslog(const char *user_msg) {\n    // VULNERABLE OUTPUT FUNCTION HERE:\n    `,
    postCode: `(user_msg);\n}`,
    clueComment: '// VULNERABLE OUTPUT FUNCTION HERE:',
    correctAnswer: 'printf',
    hint: 'Standard C function printing a formatted string. Vulnerable if the string itself holds user input.',
    compileCmd: 'cppcheck logger.c'
  }
];

export default function WhiteHatAuditApp({ onClose }: WhiteHatAuditAppProps) {
  const completedMissions = getCompletedAuditMissions();
  const failedMissions = getFailedAuditMissions();

  const isAuditDone = (id: string) => completedMissions.includes(id) || failedMissions.includes(id);

  // Group puzzles by difficulty levels
  const easyMissions = AUDITS.filter(a => a.difficulty === 'EASY');
  const mediumMissions = AUDITS.filter(a => a.difficulty === 'MEDIUM');
  const hardMissions = AUDITS.filter(a => a.difficulty === 'HARD' || a.difficulty === 'EXPERT');

  // Active (first undone) per level
  const activeEasy = easyMissions.find(a => !isAuditDone(a.id));
  const activeMedium = mediumMissions.find(a => !isAuditDone(a.id));
  const activeHard = hardMissions.find(a => !isAuditDone(a.id));

  // Current active tasks list
  const activeMissions: AuditPuzzle[] = [];
  if (activeEasy) activeMissions.push(activeEasy);
  if (activeMedium) activeMissions.push(activeMedium);
  if (activeHard) activeMissions.push(activeHard);

  const doneMissions = AUDITS.filter(a => isAuditDone(a.id));
  const visibleMissions = [...activeMissions, ...doneMissions];

  const [selectedAuditId, setSelectedAuditId] = useState<string>(() => {
    return activeMissions[0]?.id || AUDITS[0].id;
  });

  const [codeInputValue, setCodeInputValue] = useState('');
  const [terminalInput, setTerminalInput] = useState('');
  const [terminalLogs, setTerminalLogs] = useState<string[]>([]);
  const [attempts, setAttempts] = useState(3);
  const [gameState, setGameState] = useState<'details' | 'minigame' | 'success' | 'failure'>('details');
  const [currentScore, setCurrentScore] = useState({ usd: getMoney(), rep: getReputation() });
  const [showDetailsOverlay, setShowDetailsOverlay] = useState(false);

  const terminalEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    return subscribe(() => {
      setCurrentScore({ usd: getMoney(), rep: getReputation() });
    });
  }, []);

  const selectedAudit = AUDITS.find(a => a.id === selectedAuditId) || AUDITS[0];

  useEffect(() => {
    setCodeInputValue('');
    setTerminalInput('');
    setTerminalLogs([
      `Initial diagnostic security scan console for White-Hat Security auditors.`,
      `Ready to perform code analysis.`,
      `  - Type "${selectedAudit.compileCmd}" to run static analysis tools.`
    ]);
    setAttempts(3);
    setGameState('details');
  }, [selectedAuditId, selectedAudit.compileCmd]);

  useEffect(() => {
    terminalEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [terminalLogs]);

  const addLog = (msg: string) => {
    setTerminalLogs(prev => [...prev, msg]);
  };

  const returnToDashboard = () => {
    setGameState('details');
    const nextActive = visibleMissions.find(a => !completedMissions.includes(a.id) && !failedMissions.includes(a.id));
    if (nextActive) {
      setSelectedAuditId(nextActive.id);
    }
  };

  const getDifficultyStyle = (diff: string) => {
    switch (diff) {
      case 'EASY': return { color: '#2dd4bf', bg: 'rgba(45, 212, 191, 0.08)', border: '1px solid rgba(45, 212, 191, 0.2)' };
      case 'MEDIUM': return { color: '#38bdf8', bg: 'rgba(56, 189, 248, 0.08)', border: '1px solid rgba(56, 189, 248, 0.2)' };
      case 'HARD': return { color: '#fb923c', bg: 'rgba(251, 146, 60, 0.08)', border: '1px solid rgba(251, 146, 60, 0.2)' };
      case 'EXPERT': return { color: '#f43f5e', bg: 'rgba(244, 63, 94, 0.08)', border: '1px solid rgba(244, 63, 94, 0.2)' };
      default: return { color: '#9ca3af', bg: 'rgba(156, 163, 175, 0.08)', border: '1px solid rgba(156, 163, 175, 0.2)' };
    }
  };

  const handleAuditCommand = (e: React.FormEvent) => {
    e.preventDefault();
    const cmd = terminalInput.trim();
    if (!cmd) return;

    addLog(`audit-console:~$ ${cmd}`);
    setTerminalInput('');

    const targetCmd = selectedAudit.compileCmd.toLowerCase();
    const inputCmd = cmd.toLowerCase();

    if (inputCmd !== targetCmd) {
      if (selectedAudit.compileCmd.startsWith('bandit') && !inputCmd.startsWith('bandit')) {
        addLog(`bash: command not found: ${cmd.split(' ')[0]}. Try running 'bandit <file>.py'`);
      } else if (selectedAudit.compileCmd.startsWith('cppcheck') && !inputCmd.startsWith('cppcheck')) {
        addLog(`bash: command not found: ${cmd.split(' ')[0]}. Try running 'cppcheck <file>.c'`);
      } else if (selectedAudit.compileCmd.startsWith('eslint') && !inputCmd.startsWith('eslint')) {
        addLog(`bash: command not found: ${cmd.split(' ')[0]}. Try running 'eslint <file>.js'`);
      } else if (selectedAudit.compileCmd.startsWith('phpstan') && !inputCmd.startsWith('phpstan')) {
        addLog(`bash: command not found: ${cmd.split(' ')[0]}. Try running 'phpstan <file>.php'`);
      } else {
        addLog(`bash: invalid tool syntax. Make sure targeted file name matches.`);
        addLog(`Suggested: "${selectedAudit.compileCmd}"`);
      }
      return;
    }

    addLog(`[DIAGNOSTICS] Spawning audit engine daemon against ${selectedAudit.filename}...`);
    setTimeout(() => {
      const val = codeInputValue.trim();
      const answer = selectedAudit.correctAnswer;

      if (val === answer) {
        addLog(`[+] audit-engine: ANALYSIS SECURE — FLAG LOCATED.`);
        addLog(`[+] CWE database query matches. Issue isolated.`);
        addLog(`[+] Press SUBMIT AUDIT to file bug disclosure report.`);
      } else {
        const valLen = val.length;
        const ansLen = answer.length;
        addLog(`[-] audit-engine: DIAGNOSTICS FAILURE.`);
        addLog(`[-] Syntactical validation failed for input token '${val || 'NULL'}'.`);
        addLog(`[-] Static check clue: Target token length is ${ansLen} characters. Yours is ${valLen} characters.`);
        addLog(`[-] Adjust inputs inside the editor panel and run tool diagnostics again.`);
      }
    }, 800);
  };

  const handleSubmitAudit = () => {
    const isCorrect = codeInputValue.trim() === selectedAudit.correctAnswer;

    if (isCorrect) {
      completeAuditMission(selectedAudit.id, selectedAudit.payout, selectedAudit.repImpact);
      setGameState('success');
    } else {
      const nextAttempts = attempts - 1;
      setAttempts(nextAttempts);

      // Decreases stat towards Black Hat (rep decreases on wrong submit)
      penalizeAuditRep(10); 

      if (nextAttempts <= 0) {
        failAuditMission(selectedAudit.id);
        setGameState('failure');
      } else {
        addLog(`[❌] BUG REPORT REJECTED! Security analyzer flagged invalid vulnerability token.`);
        addLog(`[❌] Reputation decreased! Trust rating damaged (-10 Reputation).`);
        addLog(`[❌] Remaining attempts: ${nextAttempts}/3.`);
      }
    }
  };

  const isCompleted = completedMissions.includes(selectedAudit.id);
  const isFailed = failedMissions.includes(selectedAudit.id);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4" style={{ background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(6px)' }}>
      <div className="relative flex flex-col rounded-xl overflow-hidden w-[95vw] md:w-[960px] h-[95vh] landscape:h-[450px] md:h-[700px] md:landscape:h-[700px] font-mono shadow-[0_0_50px_rgba(6,182,212,0.15)]" style={{
        background: 'linear-gradient(180deg, #07151a 0%, #03080a 100%)',
        border: '1px solid rgba(6, 182, 212, 0.25)',
      }}>
        {/* Header bar */}
        <div className="flex items-center justify-between px-4 py-3 shrink-0" style={{
          background: 'rgba(6, 182, 212, 0.05)',
          borderBottom: '1px solid rgba(6, 182, 212, 0.15)'
        }}>
          <div className="flex items-center gap-2">
            <span className="text-xl animate-pulse text-cyan-400">🔬</span>
            <div>
              <span className="text-xs font-bold tracking-widest text-[#06b6d4]">WHITE-HAT SECURITY AUDITOR</span>
              <span className="text-[9px] text-[#06b6d4] ml-3 hidden sm:inline-block">REP: {currentScore.rep} | USD: ${currentScore.usd.toLocaleString()}</span>
            </div>
          </div>
          <button onClick={onClose} className="text-sm px-2 text-[#06b6d4] hover:text-white transition-colors">✕</button>
        </div>

        {/* Inner panel split */}
        <div className="flex flex-col md:flex-row flex-1 min-h-0">
          
          {/* Left Panel: Audit items list */}
          <div className={
            gameState === 'details'
              ? "h-1/2 md:h-full w-full md:w-[280px] shrink-0 border-b md:border-b-0 md:border-r border-cyan-500/10 flex flex-col min-h-0 bg-[#040c0f]/50"
              : "hidden md:flex md:h-full md:w-[280px] shrink-0 border-r border-cyan-500/10 flex-col min-h-0 bg-[#040c0f]/50 pointer-events-none opacity-40"
          }>
            <div className="p-3 border-b border-cyan-500/10 bg-[#06b6d4]/5">
              <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">ACTIVE CODE AUDITS</span>
            </div>
            <div className="flex-1 overflow-y-auto p-2 space-y-2 select-none" style={{ scrollbarWidth: 'thin' }}>
              {visibleMissions.map((audit) => {
                const completed = completedMissions.includes(audit.id);
                const failed = failedMissions.includes(audit.id);
                const active = audit.id === selectedAuditId;
                const diffStyle = getDifficultyStyle(audit.difficulty);

                return (
                  <div
                    key={audit.id}
                    onClick={() => setSelectedAuditId(audit.id)}
                    className="p-3 rounded-lg cursor-pointer transition-all duration-300 flex flex-col gap-1"
                    style={{
                      background: active ? 'rgba(6, 182, 212, 0.1)' : 'rgba(255,255,255,0.01)',
                      border: `1px solid ${active ? 'rgba(6, 182, 212, 0.3)' : 'rgba(255,255,255,0.04)'}`,
                    }}
                  >
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-bold text-gray-300">{audit.title}</span>
                      <span className="text-[8px] px-1.5 py-0.5 rounded font-bold" style={{
                        background: diffStyle.bg,
                        color: diffStyle.color,
                        border: diffStyle.border
                      }}>{audit.difficulty}</span>
                    </div>
                    <div className="flex justify-between items-center text-[10px]">
                      <span className="text-cyan-500">{audit.sender}</span>
                      <span className="text-emerald-400 font-bold">${audit.payout.toLocaleString()}</span>
                    </div>
                    
                    {/* Status Indicator */}
                    {completed && (
                      <div className="text-[8px] mt-1 text-emerald-400 font-bold uppercase tracking-wider flex items-center gap-1">
                        <span>✓</span> <span>SECURED</span>
                      </div>
                    )}
                    {failed && (
                      <div className="text-[8px] mt-1 text-red-500 font-bold uppercase tracking-wider flex items-center gap-1">
                        <span>✕</span> <span>TERMINATED</span>
                      </div>
                    )}
                    {!completed && !failed && (
                      <div className="text-[8px] mt-1 text-gray-500 font-bold uppercase tracking-wider">
                        ● AUDIT PENDING
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right Panel: Audit specifications & game */}
          <div className={
            gameState === 'details'
              ? "h-1/2 md:h-full flex-1 w-full flex flex-col min-h-0 bg-[#050e12]/60"
              : "h-full md:h-full flex-1 w-full flex flex-col min-h-0 bg-[#050e12]/60"
          }>
            {gameState === 'details' && (
              <div className="flex-1 overflow-y-auto p-4 sm:p-6 flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-2.5 mb-3 sm:mb-4 border-b border-cyan-500/10 pb-3 sm:pb-4">
                    <span className="text-4xl p-2 rounded bg-cyan-950/40 border border-cyan-500/25">{selectedAudit.avatar}</span>
                    <div>
                      <h2 className="text-lg font-bold text-white">{selectedAudit.title}</h2>
                      <div className="text-[10px] text-[#06b6d4] mt-0.5">SPONSOR: <span className="text-gray-300">{selectedAudit.sender}</span></div>
                    </div>
                  </div>

                  <div className="space-y-4 text-xs md:text-sm text-gray-300 leading-relaxed max-w-3xl">
                    <p className="italic bg-cyan-950/20 p-3.5 border-l-2 border-cyan-500 rounded text-gray-400">
                      "{selectedAudit.desc}"
                    </p>
                    <div className="grid grid-cols-2 gap-2 mt-4 sm:mt-6 sm:gap-4 max-w-md">
                      <div className="p-2.5 rounded bg-black/30 border border-cyan-500/10">
                        <span className="text-[10px] text-gray-500 block">SOURCE LANGUAGE</span>
                        <span className="text-xs font-bold text-gray-300 uppercase">{selectedAudit.lang}</span>
                      </div>
                      <div className="p-2.5 rounded bg-black/30 border border-cyan-500/10">
                        <span className="text-[10px] text-gray-500 block">BOUNTY REWARD</span>
                        <span className="text-xs font-bold text-emerald-400">${selectedAudit.payout.toLocaleString()} Clean Money</span>
                      </div>
                      <div className="p-2.5 rounded bg-black/30 border border-cyan-500/10">
                        <span className="text-[10px] text-gray-500 block">REPUTATION AWARD</span>
                        <span className="text-xs font-bold text-emerald-400">+{selectedAudit.repImpact} Reputation</span>
                      </div>
                      <div className="p-2.5 rounded bg-black/30 border border-cyan-500/10">
                        <span className="text-[10px] text-gray-500 block">AUDIT FILE TARGET</span>
                        <span className="text-xs font-bold text-cyan-400">{selectedAudit.filename}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-4 sm:mt-8 pt-3 sm:pt-4 border-t border-cyan-500/10 flex justify-end gap-3.5">
                  {isCompleted ? (
                    <div className="px-6 py-2.5 bg-emerald-950/30 border border-emerald-500/30 text-emerald-400 font-bold rounded text-xs uppercase tracking-widest cursor-default">
                      Security Vulnerability Patched
                    </div>
                  ) : isFailed ? (
                    <div className="px-6 py-2.5 bg-red-950/30 border border-red-500/30 text-red-400 font-bold rounded text-xs uppercase tracking-widest cursor-default">
                      Audit Session Cancelled
                    </div>
                  ) : (
                    <button
                      onClick={() => setGameState('minigame')}
                      className="px-6 py-2.5 bg-cyan-950 border border-cyan-500 text-cyan-300 font-bold rounded text-xs hover:bg-[#06b6d4] hover:text-white transition-colors uppercase tracking-widest active:scale-95"
                    >
                      Start Analysis
                    </button>
                  )}
                </div>
              </div>
            )}

            {gameState === 'minigame' && (
              <div className="flex-1 flex flex-col min-h-0 p-4">
                {/* Code Auditing Header */}
                <div className="flex items-center justify-between shrink-0 mb-3 text-[10px] text-gray-400 border-b border-cyan-500/10 pb-2">
                  <div className="flex items-center gap-4">
                    <span>AUDITING: <strong className="text-cyan-400">{selectedAudit.filename}</strong></span>
                    <span>DISCLOSURES: <strong className="text-red-400">{attempts}/3 attempts</strong></span>
                  </div>
                  <span className="text-cyan-500">HINT: {selectedAudit.hint}</span>
                </div>

                {/* Editor container */}
                <div className="flex-1 flex flex-col min-h-0 bg-black/60 border border-cyan-500/15 rounded-lg overflow-hidden relative">
                  
                  {/* File tab bar */}
                  <div className="px-4 py-2 bg-[#050e12] text-[10px] text-cyan-500 font-bold border-b border-cyan-500/10 flex items-center justify-between shrink-0 select-none">
                    <span>📂 SRC_AUDIT_SANDBOX // {selectedAudit.filename}</span>
                    <span className="text-[9px] text-emerald-400 animate-pulse">● DIALED IN</span>
                  </div>

                  {/* Code Viewer editor */}
                  <div className="flex-1 overflow-y-auto p-4 font-mono text-xs leading-relaxed text-gray-300 custom-scrollbar" style={{ scrollbarWidth: 'thin' }}>
                    {/* Pre-Code */}
                    <div className="whitespace-pre-wrap select-none text-[#93c5fd]">
                      {selectedAudit.preCode.split('\n').map((line, idx) => (
                        <div key={idx} className="flex">
                          <span className="w-8 text-gray-600 text-right pr-3 select-none text-[10px]">{idx + 1}</span>
                          <span>{line}</span>
                        </div>
                      ))}
                    </div>

                    {/* Vulnerable interactive line */}
                    <div className="flex my-1 bg-cyan-950/20 border-y border-cyan-500/20 py-1">
                      <span className="w-8 text-gray-600 text-right pr-3 select-none text-[10px]">*</span>
                      <div className="flex flex-wrap items-center gap-1.5 pl-1 w-full">
                        <span className="text-gray-500 select-none">{selectedAudit.clueComment}</span>
                        <div className="flex items-center w-full sm:w-auto">
                          <span className="text-[#06b6d4] font-bold mr-1 shrink-0">=&gt;&gt;</span>
                          <input
                            type="text"
                            value={codeInputValue}
                            onChange={(e) => setCodeInputValue(e.target.value)}
                            placeholder="Vulnerable token name..."
                            className="bg-[#05161c] border border-cyan-500/50 rounded px-2 py-0.5 outline-none font-bold text-white placeholder-cyan-950 focus:border-[#00f0ff] focus:shadow-[0_0_10px_rgba(6,182,212,0.3)] transition-all w-32"
                            spellCheck="false"
                            autoComplete="off"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Post-Code */}
                    <div className="whitespace-pre-wrap select-none text-[#93c5fd]">
                      {selectedAudit.postCode.split('\n').map((line, idx) => {
                        const lineNum = selectedAudit.preCode.split('\n').length + idx + 2;
                        return (
                          <div key={idx} className="flex">
                            <span className="w-8 text-gray-600 text-right pr-3 select-none text-[10px]">{lineNum}</span>
                            <span>{line}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Diagnostic logs */}
                  <div className="h-[110px] sm:h-[150px] md:h-[180px] shrink-0 border-t border-cyan-500/20 bg-[#020608] flex flex-col font-mono">
                    <div className="px-3 py-1.5 bg-[#040d12] text-[9px] text-[#06b6d4] font-bold border-b border-cyan-500/10 flex justify-between select-none shrink-0">
                      <span>STATIC SCANNER CONSOLE // LINT LOGS</span>
                      <span className="text-gray-500">Engine v2.1</span>
                    </div>
                    <div className="flex-1 overflow-y-auto p-3 text-[11px] text-gray-400 space-y-1 custom-scrollbar" style={{ scrollbarWidth: 'thin' }}>
                      {terminalLogs.map((log, idx) => {
                        let color = '#ccc';
                        if (log.startsWith('audit-console')) color = '#2dd4bf';
                        else if (log.startsWith('[+]')) color = '#00ffaa';
                        else if (log.startsWith('[-]')) color = '#ff5f7e';
                        else if (log.startsWith('[DIAGNOSTICS]')) color = '#06b6d4';
                        return (
                          <div key={idx} style={{ color, whiteSpace: 'pre-wrap' }}>{log}</div>
                        );
                      })}
                      <div ref={terminalEndRef} />
                    </div>
                    <form onSubmit={handleAuditCommand} className="flex border-t border-cyan-500/10 bg-[#030b0e] shrink-0">
                      <span className="px-3 py-2 text-[11px] text-[#2dd4bf] select-none font-bold shrink-0">audit-console:~$</span>
                      <input
                        type="text"
                        value={terminalInput}
                        onChange={(e) => setTerminalInput(e.target.value)}
                        placeholder={`Type "${selectedAudit.compileCmd}" to run static lint checks...`}
                        className="flex-1 bg-transparent border-none outline-none py-2 pr-3 text-[11px] text-[#2dd4bf] font-bold"
                        spellCheck="false"
                        autoComplete="off"
                      />
                    </form>
                  </div>
                </div>

                {/* Footer items */}
                <div className="mt-3 flex justify-between items-center shrink-0">
                  <button
                    onClick={() => setShowDetailsOverlay(true)}
                    className="px-4 py-2 border border-cyan-500/30 text-[#06b6d4] hover:text-white rounded text-[10px] uppercase font-bold tracking-widest hover:bg-cyan-500/10 transition-colors"
                  >
                    📋 See Details
                  </button>
                  <button
                    onClick={handleSubmitAudit}
                    className="px-6 py-2.5 bg-gradient-to-r from-teal-600 to-cyan-600 text-white font-bold rounded text-xs hover:from-teal-500 hover:to-cyan-500 hover:shadow-[0_0_15px_rgba(6,182,212,0.4)] transition-all uppercase tracking-widest active:scale-95"
                  >
                    🚀 Submit Audit
                  </button>
                </div>
              </div>
            )}

            {gameState === 'success' && (
              <div className="flex-1 flex flex-col items-center justify-center p-6 text-center select-none animate-fade-in">
                <div className="w-16 h-16 rounded-full bg-emerald-950/40 border border-emerald-500 flex items-center justify-center text-4xl mb-4 text-[#00ffcc] shadow-[0_0_20px_rgba(45,212,191,0.3)]">
                  ✓
                </div>
                <h3 className="text-xl font-bold text-white mb-2 tracking-widest">BOUNTY DISCLOSURE MET</h3>
                <p className="text-gray-400 text-xs max-w-md mb-6 leading-relaxed">
                  Security vulnerability successfully isolated and reported. Developers have deployed a hotfix patch. Bug bounty reward payout has been transferred to your fiat account.
                </p>
                <div className="flex gap-4 mb-8 bg-black/30 p-4 border border-cyan-500/10 rounded-lg">
                  <div>
                    <span className="text-[10px] text-gray-500 block uppercase">Bounty Pay</span>
                    <span className="text-sm font-bold text-emerald-400">+${selectedAudit.payout.toLocaleString()}</span>
                  </div>
                  <div className="border-r border-cyan-500/10 h-8 self-center" />
                  <div>
                    <span className="text-[10px] text-gray-500 block uppercase">Reputation Impact</span>
                    <span className="text-sm font-bold text-emerald-400">+{selectedAudit.repImpact} Ethical</span>
                  </div>
                </div>
                <button
                  onClick={returnToDashboard}
                  className="px-8 py-2.5 bg-cyan-950 border border-cyan-500 text-cyan-300 font-bold rounded text-xs hover:bg-[#06b6d4] hover:text-white transition-colors uppercase tracking-widest"
                >
                  Return to Dashboard
                </button>
              </div>
            )}

            {gameState === 'failure' && (
              <div className="flex-1 flex flex-col items-center justify-center p-6 text-center select-none animate-fade-in">
                <div className="w-16 h-16 rounded-full bg-red-950/40 border border-red-500 flex items-center justify-center text-4xl mb-4 text-red-500 shadow-[0_0_20px_rgba(239,68,68,0.3)]">
                  ✕
                </div>
                <h3 className="text-xl font-bold text-white mb-2 tracking-widest">AUDIT SESSION FAILED</h3>
                <p className="text-gray-400 text-xs max-w-md mb-6 leading-relaxed">
                  Vulnerability token submissions exceeded diagnostic limits. Sponsor program has locked the session due to inaccurate reporting.
                </p>
                <div className="p-3 mb-8 bg-red-950/20 border border-red-500/20 rounded text-red-400 font-bold text-[10px] uppercase tracking-wider">
                  ⚠️ -10 Reputation Trust Penalty applied
                </div>
                <button
                  onClick={returnToDashboard}
                  className="px-8 py-2.5 bg-cyan-950 border border-cyan-500 text-cyan-300 font-bold rounded text-xs hover:bg-[#06b6d4] hover:text-white transition-colors uppercase tracking-widest"
                >
                  Return to Dashboard
                </button>
              </div>
            )}

          </div>
        </div>
      </div>
      
      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(6, 182, 212, 0.2); border-radius: 4px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(6, 182, 212, 0.5); }
      `}</style>

      {showDetailsOverlay && (
        <div className="absolute inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-lg p-5 rounded-xl border border-cyan-500/30 bg-[#0a1114] shadow-[0_0_30px_rgba(6,182,212,0.2)] font-mono flex flex-col max-h-[85vh]">
            <div className="flex justify-between items-center border-b border-cyan-500/20 pb-3 mb-4 shrink-0">
              <div className="flex items-center gap-2">
                <span className="text-2xl">{selectedAudit.avatar}</span>
                <div>
                  <h4 className="text-sm font-bold text-white">{selectedAudit.title}</h4>
                  <span className="text-[9px] text-[#06b6d4]">Sponsor: {selectedAudit.sender}</span>
                </div>
              </div>
              <button 
                onClick={() => setShowDetailsOverlay(false)} 
                className="text-gray-400 hover:text-white text-xs px-2"
              >
                ✕
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto space-y-4 text-xs text-gray-300 leading-relaxed custom-scrollbar">
              <p className="italic bg-cyan-950/20 p-3 border-l-2 border-cyan-500 rounded text-gray-400">
                "{selectedAudit.desc}"
              </p>
              
              <div className="grid grid-cols-2 gap-2.5">
                <div className="p-2 rounded bg-black/40 border border-cyan-500/10">
                  <span className="text-[9px] text-gray-500 block">SOURCE LANGUAGE</span>
                  <span className="text-xs font-bold text-gray-300 uppercase">{selectedAudit.lang}</span>
                </div>
                <div className="p-2 rounded bg-black/40 border border-cyan-500/10">
                  <span className="text-[9px] text-gray-500 block">BOUNTY REWARD</span>
                  <span className="text-xs font-bold text-emerald-400">${selectedAudit.payout.toLocaleString()}</span>
                </div>
                <div className="p-2 rounded bg-black/40 border border-cyan-500/10">
                  <span className="text-[9px] text-gray-500 block">REPUTATION AWARD</span>
                  <span className="text-xs font-bold text-emerald-400">+{selectedAudit.repImpact} Reputation</span>
                </div>
                <div className="p-2 rounded bg-black/40 border border-cyan-500/10">
                  <span className="text-[9px] text-gray-500 block">AUDIT FILE TARGET</span>
                  <span className="text-xs font-bold text-cyan-400">{selectedAudit.filename}</span>
                </div>
              </div>
            </div>

            <div className="mt-5 pt-3 border-t border-cyan-500/20 flex justify-end shrink-0">
              <button
                onClick={() => setShowDetailsOverlay(false)}
                className="px-5 py-2 bg-cyan-950/20 border border-cyan-500/40 text-cyan-300 font-bold rounded text-[10px] hover:bg-[#06b6d4]/40 hover:text-white transition-colors uppercase tracking-widest"
              >
                Close Details
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
