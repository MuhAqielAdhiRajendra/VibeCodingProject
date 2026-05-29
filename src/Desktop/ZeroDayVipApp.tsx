import { useState, useEffect, useRef } from 'react';
import {
  getCrypto,
  getReputation,
  getCompletedVipMissions,
  getFailedVipMissions,
  completeVipMission,
  failVipMission,
  penalizeVipTrust,
  subscribe
} from '../game/gameStore';

interface ZeroDayVipAppProps {
  onClose: () => void;
}

interface Puzzle {
  id: string;
  sender: string;
  avatar: string;
  title: string;
  desc: string;
  lang: 'Python' | 'C' | 'C++';
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

const PUZZLES: Puzzle[] = [
  {
    id: 'vip_1',
    sender: 'c0de_runner',
    avatar: '🕵️',
    title: 'Broken File Logger',
    desc: "I'm writing an automated log harvester to capture credentials, but it keeps throwing errors because I forgot how to open a file in append mode. Help me complete the file opening statement.",
    lang: 'Python',
    filename: 'logger.py',
    difficulty: 'EASY',
    payout: 2500,
    repImpact: 5,
    preCode: `# Save harvested credentials to a file\ndef save_credentials(creds):\n    # something wrong at here\n    with `,
    postCode: `("harvested.txt", "a") as file:\n        file.write(creds + "\\n")`,
    clueComment: '# something wrong at here',
    correctAnswer: 'open',
    hint: "Python's built-in function to open files.",
    compileCmd: 'python logger.py'
  },
  {
    id: 'vip_2',
    sender: 'shadow_spider',
    avatar: '👾',
    title: 'Network Scan Range',
    desc: 'My custom multi-port ping scanner is skipping ports because I don\'t know how to define a sequence loop from port 1 to 1024. Fill in the sequence function.',
    lang: 'Python',
    filename: 'scanner.py',
    difficulty: 'EASY',
    payout: 3000,
    repImpact: 5,
    preCode: `# Scan ports from 1 to 1024\n# something wrong at here\nfor port in `,
    postCode: `(1, 1025):\n    status = scan_port(port)`,
    clueComment: '# something wrong at here',
    correctAnswer: 'range',
    hint: 'Generates a sequence of numbers from start to stop-1.',
    compileCmd: 'python scanner.py'
  },
  {
    id: 'vip_3',
    sender: 'buffer_overflow',
    avatar: '💀',
    title: 'Memory Allocator',
    desc: 'I am writing a network buffer shellcode runner, but it keeps failing during heap allocation because I forgot the C function name to request dynamic memory. What function should I call?',
    lang: 'C',
    filename: 'payload.c',
    difficulty: 'MEDIUM',
    payout: 8000,
    repImpact: 8,
    preCode: `// Allocate memory for the shellcode buffer safely\n#include <stdlib.h>\nvoid setup_payload() {\n    // something wrong at here\n    char *buf = (char *)`,
    postCode: `(512 * sizeof(char));\n    if (buf == NULL) return;\n}`,
    clueComment: '// something wrong at here',
    correctAnswer: 'malloc',
    hint: 'Standard C function to allocate memory blocks dynamically.',
    compileCmd: 'gcc payload.c -o payload'
  },
  {
    id: 'vip_4',
    sender: 'socket_master',
    avatar: '📡',
    title: 'C Socket Descriptor',
    desc: 'I need to create an IPv4 TCP socket connection block for my reverse shell listener in pure C, but I forgot the primary API call to get a socket file descriptor. Help me.',
    lang: 'C',
    filename: 'listener.c',
    difficulty: 'MEDIUM',
    payout: 10000,
    repImpact: 8,
    preCode: `// Create an IPv4 TCP socket\n#include <sys/socket.h>\nint create_socket() {\n    // something wrong at here\n    int sock_fd = `,
    postCode: `(AF_INET, SOCK_STREAM, 0);\n    return sock_fd;\n}`,
    clueComment: '// something wrong at here',
    correctAnswer: 'socket',
    hint: 'System call to create an endpoint for communication.',
    compileCmd: 'gcc listener.c -o listener'
  },
  {
    id: 'vip_5',
    sender: 'cpp_hacker',
    avatar: '🎭',
    title: 'C++ Stream Writer',
    desc: 'I am building a keylogger output system in C++ using file streams, but I don\'t remember the correct insertion operator symbol to write variables into the file stream object. Help me.',
    lang: 'C++',
    filename: 'logger.cpp',
    difficulty: 'HARD',
    payout: 16000,
    repImpact: 12,
    preCode: `// Write logs to file stream\n#include <iostream>\n#include <fstream>\nvoid log_ip(std::string client_ip) {\n    std::ofstream logfile("logs.txt", std::ios::app);\n    // something wrong at here\n    logfile `,
    postCode: ` "IP captured: " << client_ip << std::endl;\n}`,
    clueComment: '// something wrong at here',
    correctAnswer: '<<',
    hint: 'C++ stream insertion operator to output data.',
    compileCmd: 'g++ logger.cpp -o logger'
  },
  {
    id: 'vip_6',
    sender: 'template_ghost',
    avatar: '👁️',
    title: 'Dynamic Vector Push',
    desc: 'I need to append connected client IP strings dynamically to a standard template library (STL) vector container in C++, but I forgot the class method name to push items to the back.',
    lang: 'C++',
    filename: 'stack.cpp',
    difficulty: 'EXPERT',
    payout: 35000,
    repImpact: 18,
    preCode: `// Store multiple client connections dynamically in vector\n#include <vector>\n#include <string>\nvoid add_connection(std::string ip) {\n    std::vector<std::string> clients;\n    // something wrong at here\n    clients.`,
    postCode: `(ip);\n}`,
    clueComment: '// something wrong at here',
    correctAnswer: 'push_back',
    hint: 'Vector method in C++ to insert an element at the end.',
    compileCmd: 'g++ stack.cpp -o stack'
  }
];

export default function ZeroDayVipApp({ onClose }: ZeroDayVipAppProps) {
  const completedMissions = getCompletedVipMissions();
  const failedMissions = getFailedVipMissions();

  const isMissionDone = (id: string) => completedMissions.includes(id) || failedMissions.includes(id);

  // Group puzzles by difficulty categories
  const easyMissions = PUZZLES.filter(p => p.difficulty === 'EASY');
  const mediumMissions = PUZZLES.filter(p => p.difficulty === 'MEDIUM');
  const hardMissions = PUZZLES.filter(p => p.difficulty === 'HARD' || p.difficulty === 'EXPERT');

  // Find the first active (undone) mission in each category
  const activeEasy = easyMissions.find(p => !isMissionDone(p.id));
  const activeMedium = mediumMissions.find(p => !isMissionDone(p.id));
  const activeHard = hardMissions.find(p => !isMissionDone(p.id));

  // Collect active available missions
  const activeMissions: Puzzle[] = [];
  if (activeEasy) activeMissions.push(activeEasy);
  if (activeMedium) activeMissions.push(activeMedium);
  if (activeHard) activeMissions.push(activeHard);

  // Collect all done missions (completed or failed)
  const doneMissions = PUZZLES.filter(p => isMissionDone(p.id));

  // The full visible list shows active available first, then completed/failed at the bottom
  const visibleMissions = [...activeMissions, ...doneMissions];

  const [selectedMissionId, setSelectedMissionId] = useState<string>(() => {
    return activeMissions[0]?.id || PUZZLES[0].id;
  });
  const [codeInputValue, setCodeInputValue] = useState('');
  const [terminalInput, setTerminalInput] = useState('');
  const [terminalLogs, setTerminalLogs] = useState<string[]>([]);
  const [attempts, setAttempts] = useState(3);
  const [gameState, setGameState] = useState<'details' | 'minigame' | 'success' | 'failure'>('details');
  const [currentScore, setCurrentScore] = useState({ crypto: getCrypto(), rep: getReputation() });
  const [showContractOverlay, setShowContractOverlay] = useState(false);

  const terminalEndRef = useRef<HTMLDivElement>(null);

  // Sync balances on notify
  useEffect(() => {
    return subscribe(() => {
      setCurrentScore({ crypto: getCrypto(), rep: getReputation() });
    });
  }, []);

  const selectedMission = PUZZLES.find(p => p.id === selectedMissionId) || PUZZLES[0];

  useEffect(() => {
    // Reset mission screen variables when switching missions
    setCodeInputValue('');
    setTerminalInput('');
    setTerminalLogs([
      `Secure communication channel established with ${selectedMission.sender}.`,
      `Ready to compiler-test files. Usage:`,
      `  - Type "${selectedMission.compileCmd}" in console to dry-run compile.`
    ]);
    setAttempts(3);
    setGameState('details');
  }, [selectedMissionId, selectedMission.sender, selectedMission.compileCmd]);

  useEffect(() => {
    // Auto-scroll mini console logs
    terminalEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [terminalLogs]);

  const addTerminalLog = (log: string) => {
    setTerminalLogs(prev => [...prev, log]);
  };

  const returnToDashboard = () => {
    setGameState('details');
    // Find the next undone mission in the visible list to select automatically
    const nextActive = visibleMissions.find(p => !completedMissions.includes(p.id) && !failedMissions.includes(p.id));
    if (nextActive) {
      setSelectedMissionId(nextActive.id);
    }
  };

  const getDifficultyStyle = (difficulty: string) => {
    switch (difficulty) {
      case 'EASY': return { color: '#00ff88', bg: 'rgba(0, 255, 136, 0.08)', border: '1px solid rgba(0, 255, 136, 0.2)' };
      case 'MEDIUM': return { color: '#ffaa00', bg: 'rgba(255, 170, 0, 0.08)', border: '1px solid rgba(255, 170, 0, 0.2)' };
      case 'HARD': return { color: '#ff5500', bg: 'rgba(255, 85, 0, 0.08)', border: '1px solid rgba(255, 85, 0, 0.2)' };
      case 'EXPERT': return { color: '#ff0055', bg: 'rgba(255, 0, 85, 0.08)', border: '1px solid rgba(255, 0, 85, 0.2)' };
      default: return { color: '#888888', bg: 'rgba(128, 128, 128, 0.08)', border: '1px solid rgba(128, 128, 128, 0.2)' };
    }
  };

  const handleRunCommand = (e: React.FormEvent) => {
    e.preventDefault();
    const cmd = terminalInput.trim();
    if (!cmd) return;

    addTerminalLog(`vip-terminal:~$ ${cmd}`);
    setTerminalInput('');

    const targetCmd = selectedMission.compileCmd.toLowerCase();
    const lowerCmd = cmd.toLowerCase();

    // Check compilation command syntax matches (case-insensitive checks)
    if (lowerCmd !== targetCmd) {
      if (selectedMission.lang === 'Python' && !lowerCmd.startsWith('python ')) {
        addTerminalLog(`bash: command not found: ${cmd.split(' ')[0]}. Did you mean 'python <file>.py'?`);
      } else if (selectedMission.lang === 'C' && !lowerCmd.startsWith('gcc ')) {
        addTerminalLog(`bash: command not found: ${cmd.split(' ')[0]}. Did you mean 'gcc <file>.c -o <binary>'?`);
      } else if (selectedMission.lang === 'C++' && !lowerCmd.startsWith('g++ ')) {
        addTerminalLog(`bash: command not found: ${cmd.split(' ')[0]}. Did you mean 'g++ <file>.cpp -o <binary>'?`);
      } else {
        addTerminalLog(`bash: incorrect compiler arguments. File name or build output name does not match project configuration.`);
        addTerminalLog(`Expected command: "${selectedMission.compileCmd}"`);
      }
      return;
    }

    // Command syntax matches, evaluate the typed code input!
    addTerminalLog(`[SYSTEM] Starting compilation/dry-run diagnostics for ${selectedMission.filename}...`);
    
    setTimeout(() => {
      const sanitizedAns = codeInputValue.trim();
      const expectedAns = selectedMission.correctAnswer;

      if (sanitizedAns === expectedAns) {
        addTerminalLog(`[+] ${selectedMission.filename}: COMPILATION SUCCESSFUL.`);
        addTerminalLog(`[+] Static analysis passed. Symbol table validated.`);
        addTerminalLog(`[+] Ready to deploy payload safely.`);
      } else {
        // Compiler error with length mismatch clue!
        const gotLen = sanitizedAns.length;
        const expectedLen = expectedAns.length;
        
        addTerminalLog(`[-] ERROR: ${selectedMission.filename}: Compilation failed!`);
        addTerminalLog(`[-] Syntax Error: Invalid token '${sanitizedAns || 'NULL'}' on missing statement.`);
        addTerminalLog(`[-] Clue -> Expected symbol length: ${expectedLen} characters. Your symbol length: ${gotLen} characters.`);
        addTerminalLog(`[-] Check manual/help if stuck. Adjust the code editor and compile again.`);
      }
    }, 800);
  };

  const handleDeployPayload = () => {
    const isCorrect = codeInputValue.trim() === selectedMission.correctAnswer;

    if (isCorrect) {
      // Award!
      completeVipMission(selectedMission.id, selectedMission.payout, selectedMission.repImpact);
      setGameState('success');
    } else {
      // Penalty!
      const nextAttempts = attempts - 1;
      setAttempts(nextAttempts);
      
      penalizeVipTrust(10); // trust impact (reputation drops by 10 points on failed deploy)

      if (nextAttempts <= 0) {
        failVipMission(selectedMission.id);
        setGameState('failure');
      } else {
        addTerminalLog(`[❌] DEPLOYMENT CRITICAL FAILED! Firewall blocked payload.`);
        addTerminalLog(`[❌] Trust reduced! Buyer trust rating damaged (-10 Reputation).`);
        addTerminalLog(`[❌] Remaining attempts: ${nextAttempts}/3.`);
      }
    }
  };

  const isCompleted = completedMissions.includes(selectedMission.id);
  const isFailed = failedMissions.includes(selectedMission.id);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4" style={{ background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(6px)' }}>
      <div className="relative flex flex-col rounded-xl overflow-hidden w-[95vw] md:w-[960px] h-[95vh] landscape:h-[450px] md:h-[700px] md:landscape:h-[700px] font-mono shadow-[0_0_50px_rgba(153,0,255,0.15)]" style={{
        background: 'linear-gradient(180deg, #0f0a1c 0%, #06040d 100%)',
        border: '1px solid rgba(153, 0, 255, 0.25)',
      }}>
        {/* Header bar */}
        <div className="flex items-center justify-between px-4 py-3 shrink-0" style={{
          background: 'rgba(153, 0, 255, 0.05)',
          borderBottom: '1px solid rgba(153, 0, 255, 0.15)'
        }}>
          <div className="flex items-center gap-2">
            <span className="text-xl animate-pulse">☠️</span>
            <div>
              <span className="text-xs font-bold tracking-widest text-[#d946ef]">ZERO-DAY VIP UNDERGROUND</span>
              <span className="text-[9px] text-[#9900ff] ml-3 hidden sm:inline-block">REP: {currentScore.rep} | WALLET: {currentScore.crypto.toLocaleString()} NTC</span>
            </div>
          </div>
          <button onClick={onClose} className="text-sm px-2 text-[#d946ef] hover:text-white transition-colors">✕</button>
        </div>

        {/* Inner container */}
        <div className="flex flex-col md:flex-row flex-1 min-h-0">
          
          {/* Left panel: Mission list */}
          <div className={
            gameState === 'details'
              ? "h-1/2 md:h-full w-full md:w-[280px] shrink-0 border-b md:border-b-0 md:border-r border-[#9900ff]/10 flex flex-col min-h-0 bg-[#07050e]/50"
              : "hidden md:flex md:h-full md:w-[280px] shrink-0 border-r border-[#9900ff]/10 flex-col min-h-0 bg-[#07050e]/50 pointer-events-none opacity-40"
          }>
            <div className="p-3 border-b border-[#9900ff]/10 bg-[#9900ff]/5">
              <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">AVAILABLE CONTRACTS</span>
            </div>
            <div className="flex-1 overflow-y-auto p-2 space-y-2 select-none" style={{ scrollbarWidth: 'thin' }}>
              {visibleMissions.map((puzzle) => {
                const completed = completedMissions.includes(puzzle.id);
                const failed = failedMissions.includes(puzzle.id);
                const active = puzzle.id === selectedMissionId;
                const difficultyStyle = getDifficultyStyle(puzzle.difficulty);

                return (
                  <div
                    key={puzzle.id}
                    onClick={() => setSelectedMissionId(puzzle.id)}
                    className="p-3 rounded-lg cursor-pointer transition-all duration-300 flex flex-col gap-1"
                    style={{
                      background: active ? 'rgba(153, 0, 255, 0.1)' : 'rgba(255,255,255,0.01)',
                      border: `1px solid ${active ? 'rgba(153, 0, 255, 0.3)' : 'rgba(255,255,255,0.04)'}`,
                    }}
                  >
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-bold text-gray-300">{puzzle.title}</span>
                      <span className="text-[8px] px-1.5 py-0.5 rounded font-bold" style={{
                        background: difficultyStyle.bg,
                        color: difficultyStyle.color,
                        border: difficultyStyle.border
                      }}>{puzzle.difficulty}</span>
                    </div>
                    <div className="flex justify-between items-center text-[10px]">
                      <span className="text-[#9900ff]">{puzzle.sender}</span>
                      <span className="text-[#00ffaa] font-bold">{puzzle.payout.toLocaleString()} NTC</span>
                    </div>
                    
                    {/* Status Badge */}
                    {completed && (
                      <div className="text-[8px] mt-1 text-[#00ff88] font-bold uppercase tracking-wider flex items-center gap-1">
                        <span>✓</span> <span>COMPLETED</span>
                      </div>
                    )}
                    {failed && (
                      <div className="text-[8px] mt-1 text-red-500 font-bold uppercase tracking-wider flex items-center gap-1">
                        <span>✕</span> <span>FAILED</span>
                      </div>
                    )}
                    {!completed && !failed && (
                      <div className="text-[8px] mt-1 text-gray-500 font-bold uppercase tracking-wider">
                        ● AVAILABLE
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right panel: Details & Active Minigame */}
          <div className={
            gameState === 'details'
              ? "h-1/2 md:h-full flex-1 w-full flex flex-col min-h-0 bg-[#0b0716]/60"
              : "h-full md:h-full flex-1 w-full flex flex-col min-h-0 bg-[#0b0716]/60"
          }>
            {gameState === 'details' && (
              <div className="flex-1 overflow-y-auto p-4 sm:p-6 flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-2.5 mb-3 sm:mb-4 border-b border-[#9900ff]/10 pb-3 sm:pb-4">
                    <span className="text-4xl p-2 rounded bg-purple-950/40 border border-purple-500/25">{selectedMission.avatar}</span>
                    <div>
                      <h2 className="text-lg font-bold text-white">{selectedMission.title}</h2>
                      <div className="text-[10px] text-[#9900ff] mt-0.5">CONTRACTOR: <span className="text-gray-300">{selectedMission.sender}</span></div>
                    </div>
                  </div>

                  <div className="space-y-4 text-xs md:text-sm text-gray-300 leading-relaxed max-w-3xl">
                    <p className="italic bg-purple-950/20 p-3.5 border-l-2 border-purple-500 rounded text-gray-400">
                      "{selectedMission.desc}"
                    </p>
                    <div className="grid grid-cols-2 gap-2 mt-4 sm:mt-6 sm:gap-4 max-w-md">
                      <div className="p-2.5 rounded bg-black/30 border border-[#9900ff]/10">
                        <span className="text-[10px] text-gray-500 block">COMPILER REQUIREMENT</span>
                        <span className="text-xs font-bold text-gray-300 uppercase">{selectedMission.lang}</span>
                      </div>
                      <div className="p-2.5 rounded bg-black/30 border border-[#9900ff]/10">
                        <span className="text-[10px] text-gray-500 block">PAYOUT REWARD</span>
                        <span className="text-xs font-bold text-[#00ff88]">{selectedMission.payout.toLocaleString()} NTC</span>
                      </div>
                      <div className="p-2.5 rounded bg-black/30 border border-[#9900ff]/10">
                        <span className="text-[10px] text-gray-500 block">REPUTATION COST</span>
                        <span className="text-xs font-bold text-red-400">-{selectedMission.repImpact} Reputation</span>
                      </div>
                      <div className="p-2.5 rounded bg-black/30 border border-[#9900ff]/10">
                        <span className="text-[10px] text-gray-500 block">SUBMISSION FILE</span>
                        <span className="text-xs font-bold text-[#d946ef]">{selectedMission.filename}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-4 sm:mt-8 pt-3 sm:pt-4 border-t border-[#9900ff]/10 flex justify-end gap-3.5">
                  {isCompleted ? (
                    <div className="px-6 py-2.5 bg-green-950/30 border border-green-500/30 text-[#00ff88] font-bold rounded text-xs uppercase tracking-widest cursor-default">
                      Contract Fully Met
                    </div>
                  ) : isFailed ? (
                    <div className="px-6 py-2.5 bg-red-950/30 border border-red-500/30 text-red-400 font-bold rounded text-xs uppercase tracking-widest cursor-default">
                      Contract Terminated / Failed
                    </div>
                  ) : (
                    <button
                      onClick={() => setGameState('minigame')}
                      className="px-6 py-2.5 bg-purple-950 border border-purple-500 text-purple-300 font-bold rounded text-xs hover:bg-[#9900ff] hover:text-white transition-colors uppercase tracking-widest active:scale-95"
                    >
                      Accept Contract
                    </button>
                  )}
                </div>
              </div>
            )}

            {gameState === 'minigame' && (
              <div className="flex-1 flex flex-col min-h-0 p-4">
                {/* Puzzle Header info */}
                <div className="flex items-center justify-between shrink-0 mb-3 text-[10px] text-gray-400 border-b border-[#9900ff]/10 pb-2">
                  <div className="flex items-center gap-4">
                    <span>EDITING: <strong className="text-[#d946ef]">{selectedMission.filename}</strong></span>
                    <span>ATTEMPTS: <strong className="text-red-400">{attempts}/3</strong></span>
                  </div>
                  <span className="text-[#9900ff]">HINT: {selectedMission.hint}</span>
                </div>

                {/* Editor window */}
                <div className="flex-1 flex flex-col min-h-0 bg-black/60 border border-[#9900ff]/15 rounded-lg overflow-hidden relative">
                  
                  {/* File tab bar */}
                  <div className="px-4 py-2 bg-[#090610] text-[10px] text-[#9900ff] font-bold border-b border-[#9900ff]/10 flex items-center justify-between shrink-0 select-none">
                    <span>📂 VIP_SOURCE_CODE // {selectedMission.filename}</span>
                    <span className="text-[9px] text-[#00ff88] animate-pulse">● CLONE ACTIVE</span>
                  </div>

                  {/* Code Editor */}
                  <div className="flex-1 overflow-y-auto p-4 font-mono text-xs leading-relaxed text-gray-300 custom-scrollbar" style={{ scrollbarWidth: 'thin' }}>
                    {/* Pre-Code section */}
                    <div className="whitespace-pre-wrap select-none text-[#a5c2f4]">
                      {selectedMission.preCode.split('\n').map((line, idx) => (
                        <div key={idx} className="flex">
                          <span className="w-8 text-gray-600 text-right pr-3 select-none text-[10px]">{idx + 1}</span>
                          <span>{line}</span>
                        </div>
                      ))}
                    </div>

                    {/* Interactive Input Spot */}
                    <div className="flex my-1 bg-[#d946ef]/5 border-y border-[#d946ef]/10 py-1">
                      <span className="w-8 text-gray-600 text-right pr-3 select-none text-[10px]">*</span>
                      <div className="flex flex-wrap items-center gap-1.5 pl-1 w-full">
                        <span className="text-gray-500 select-none">{selectedMission.clueComment}</span>
                        <div className="flex items-center w-full sm:w-auto">
                          <span className="text-[#d946ef] font-bold mr-1 shrink-0">=&gt;&gt;</span>
                          <input
                            type="text"
                            value={codeInputValue}
                            onChange={(e) => setCodeInputValue(e.target.value)}
                            placeholder="Type replacement code here..."
                            className="bg-[#120920] border border-[#9900ff]/50 rounded px-2 py-0.5 outline-none font-bold text-white placeholder-gray-600 focus:border-[#d946ef] focus:shadow-[0_0_10px_rgba(217,70,239,0.3)] transition-all w-32"
                            spellCheck="false"
                            autoComplete="off"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Post-Code section */}
                    <div className="whitespace-pre-wrap select-none text-[#a5c2f4]">
                      {selectedMission.postCode.split('\n').map((line, idx) => {
                        const lineNum = selectedMission.preCode.split('\n').length + idx + 2;
                        return (
                          <div key={idx} className="flex">
                            <span className="w-8 text-gray-600 text-right pr-3 select-none text-[10px]">{lineNum}</span>
                            <span>{line}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Simulated Terminal Console */}
                  <div className="h-[110px] sm:h-[150px] md:h-[180px] shrink-0 border-t border-[#9900ff]/20 bg-[#040207] flex flex-col font-mono">
                    <div className="px-3 py-1.5 bg-[#0b0813] text-[9px] text-[#9900ff] font-bold border-b border-[#9900ff]/10 flex justify-between select-none shrink-0">
                      <span>CONSOLE // DRY-RUN DIAGNOSTICS</span>
                      <span className="text-gray-500">Bash v4.4</span>
                    </div>
                    <div className="flex-1 overflow-y-auto p-3 text-[11px] text-gray-400 space-y-1 custom-scrollbar" style={{ scrollbarWidth: 'thin' }}>
                      {terminalLogs.map((log, idx) => {
                        let color = '#ccc';
                        if (log.startsWith('vip-terminal')) color = '#00ffcc';
                        else if (log.startsWith('[+]')) color = '#00ff88';
                        else if (log.startsWith('[-]')) color = '#ff3366';
                        else if (log.startsWith('[SYSTEM]')) color = '#9900ff';
                        return (
                          <div key={idx} style={{ color, whiteSpace: 'pre-wrap' }}>{log}</div>
                        );
                      })}
                      <div ref={terminalEndRef} />
                    </div>
                    <form onSubmit={handleRunCommand} className="flex border-t border-[#9900ff]/10 bg-[#07050e] shrink-0">
                      <span className="px-3 py-2 text-[11px] text-[#00ffcc] select-none font-bold shrink-0">vip-terminal:~$</span>
                      <input
                        type="text"
                        value={terminalInput}
                        onChange={(e) => setTerminalInput(e.target.value)}
                        placeholder={`Type "${selectedMission.compileCmd}" to compile/test code...`}
                        className="flex-1 bg-transparent border-none outline-none py-2 pr-3 text-[11px] text-[#00ffcc] font-bold"
                        spellCheck="false"
                        autoComplete="off"
                      />
                    </form>
                  </div>
                </div>

                {/* Footer buttons */}
                <div className="mt-3 flex justify-between items-center shrink-0">
                  <button
                    onClick={() => setShowContractOverlay(true)}
                    className="px-4 py-2 border border-[#9900ff]/30 text-[#d946ef] hover:text-white rounded text-[10px] uppercase font-bold tracking-widest hover:bg-[#9900ff]/10 transition-colors"
                  >
                    📋 See Contract
                  </button>
                  <button
                    onClick={handleDeployPayload}
                    className="px-6 py-2.5 bg-gradient-to-r from-red-600 to-purple-600 text-white font-bold rounded text-xs hover:from-red-500 hover:to-purple-500 hover:shadow-[0_0_15px_rgba(255,0,85,0.4)] transition-all uppercase tracking-widest active:scale-95"
                  >
                    🚀 Deploy Payload
                  </button>
                </div>
              </div>
            )}

            {gameState === 'success' && (
              <div className="flex-1 flex flex-col items-center justify-center p-6 text-center select-none animate-fade-in">
                <div className="w-16 h-16 rounded-full bg-green-950/40 border border-green-500 flex items-center justify-center text-4xl mb-4 text-[#00ff88] shadow-[0_0_20px_rgba(0,255,136,0.3)]">
                  ✓
                </div>
                <h3 className="text-xl font-bold text-white mb-2 tracking-widest">DEPLOYMENT SUCCESSFUL</h3>
                <p className="text-gray-400 text-xs max-w-md mb-6 leading-relaxed">
                  The target was successfully breached. Senders has verified the payload insertion. Payout transferred to your cryptowallet.
                </p>
                <div className="flex gap-4 mb-8 bg-black/30 p-4 border border-[#9900ff]/10 rounded-lg">
                  <div>
                    <span className="text-[10px] text-gray-500 block uppercase">Reward</span>
                    <span className="text-sm font-bold text-[#00ff88]">+{selectedMission.payout.toLocaleString()} NTC</span>
                  </div>
                  <div className="border-r border-[#9900ff]/10 h-8 self-center" />
                  <div>
                    <span className="text-[10px] text-gray-500 block uppercase">Reputation Impact</span>
                    <span className="text-sm font-bold text-red-400">-{selectedMission.repImpact} Trust</span>
                  </div>
                </div>
                <button
                  onClick={returnToDashboard}
                  className="px-8 py-2.5 bg-purple-950 border border-purple-500 text-purple-300 font-bold rounded text-xs hover:bg-[#9900ff] hover:text-white transition-colors uppercase tracking-widest"
                >
                  Return to Dashboard
                </button>
              </div>
            )}

            {gameState === 'failure' && (
              <div className="flex-1 flex flex-col items-center justify-center p-6 text-center select-none animate-fade-in">
                <div className="w-16 h-16 rounded-full bg-red-950/40 border border-red-500 flex items-center justify-center text-4xl mb-4 text-red-500 shadow-[0_0_20px_rgba(255,0,85,0.3)]">
                  ✕
                </div>
                <h3 className="text-xl font-bold text-white mb-2 tracking-widest">CONTRACT FAILED</h3>
                <p className="text-gray-400 text-xs max-w-md mb-6 leading-relaxed">
                  Firewall trigger limits reached. The transaction buyer has blacklisted your identity due to poor payload quality.
                </p>
                <div className="p-3 mb-8 bg-red-950/20 border border-red-500/20 rounded text-red-400 font-bold text-[10px] uppercase tracking-wider">
                  ⚠️ -10 Reputation Trust Penalty applied
                </div>
                <button
                  onClick={returnToDashboard}
                  className="px-8 py-2.5 bg-purple-950 border border-purple-500 text-purple-300 font-bold rounded text-xs hover:bg-[#9900ff] hover:text-white transition-colors uppercase tracking-widest"
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
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(153, 0, 255, 0.2); border-radius: 4px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(153, 0, 255, 0.5); }
      `}</style>

      {showContractOverlay && (
        <div className="absolute inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-lg p-5 rounded-xl border border-[#9900ff]/30 bg-[#0d0c15] shadow-[0_0_30px_rgba(153,0,255,0.2)] font-mono flex flex-col max-h-[85vh]">
            <div className="flex justify-between items-center border-b border-[#9900ff]/20 pb-3 mb-4 shrink-0">
              <div className="flex items-center gap-2">
                <span className="text-2xl">{selectedMission.avatar}</span>
                <div>
                  <h4 className="text-sm font-bold text-white">{selectedMission.title}</h4>
                  <span className="text-[9px] text-[#9900ff]">Contractor: {selectedMission.sender}</span>
                </div>
              </div>
              <button 
                onClick={() => setShowContractOverlay(false)} 
                className="text-gray-400 hover:text-white text-xs px-2"
              >
                ✕
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto space-y-4 text-xs text-gray-300 leading-relaxed custom-scrollbar">
              <p className="italic bg-purple-950/20 p-3 border-l-2 border-purple-500 rounded text-gray-400">
                "{selectedMission.desc}"
              </p>
              
              <div className="grid grid-cols-2 gap-2.5">
                <div className="p-2 rounded bg-black/40 border border-[#9900ff]/10">
                  <span className="text-[9px] text-gray-500 block">COMPILER REQUIREMENT</span>
                  <span className="text-xs font-bold text-gray-300 uppercase">{selectedMission.lang}</span>
                </div>
                <div className="p-2 rounded bg-black/40 border border-[#9900ff]/10">
                  <span className="text-[9px] text-gray-500 block">PAYOUT REWARD</span>
                  <span className="text-xs font-bold text-[#00ff88]">{selectedMission.payout.toLocaleString()} NTC</span>
                </div>
                <div className="p-2 rounded bg-black/40 border border-[#9900ff]/10">
                  <span className="text-[9px] text-gray-500 block">REPUTATION COST</span>
                  <span className="text-xs font-bold text-red-400">-{selectedMission.repImpact} Reputation</span>
                </div>
                <div className="p-2 rounded bg-black/40 border border-[#9900ff]/10">
                  <span className="text-[9px] text-gray-500 block">SUBMISSION FILE</span>
                  <span className="text-xs font-bold text-[#d946ef]">{selectedMission.filename}</span>
                </div>
              </div>
            </div>

            <div className="mt-5 pt-3 border-t border-[#9900ff]/20 flex justify-end shrink-0">
              <button
                onClick={() => setShowContractOverlay(false)}
                className="px-5 py-2 bg-[#9900ff]/20 border border-[#9900ff]/40 text-purple-300 font-bold rounded text-[10px] hover:bg-[#9900ff]/40 hover:text-white transition-colors uppercase tracking-widest"
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
