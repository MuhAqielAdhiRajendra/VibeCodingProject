import { infectedDevices, type FileNode } from './infectedDevicesData';

export interface Log {
  type: 'input' | 'output' | 'error';
  text: string;
}

export interface GameState {
  connectedIp: string | null;
  currentPath: string[];
  isHacktoolInstalled: boolean;
  hasSudoAccess: boolean;
  commandHistory: string[];
}

export interface AsyncStep { text: string; delay: number; }

export interface CommandResult {
  logs: Log[];
  clearLogs?: boolean;
  stateUpdates?: Partial<GameState>;
  asyncSequence?: { steps: AsyncStep[]; finalStateUpdates?: Partial<GameState>; };
}

export function getCurrentDevice(state: GameState) {
  if (!state.connectedIp) return null;
  return infectedDevices.find(d => d.ip === state.connectedIp) ?? null;
}

export function getCurrentDirNode(state: GameState): FileNode | null {
  const device = getCurrentDevice(state);
  if (!device) return null;
  let current: FileNode = device.fs;
  for (const p of state.currentPath) {
    const next = current.children?.find(c => c.name === p && c.type === 'dir');
    if (next) current = next; else break;
  }
  return current;
}

export function findInTree(node: FileNode, pattern: string, path: string): string[] {
  const results: string[] = [];
  const lp = pattern.toLowerCase();
  if (node.name.toLowerCase().includes(lp)) results.push(path + node.name);
  if (node.children) {
    for (const c of node.children) {
      results.push(...findInTree(c, pattern, path + node.name + '/'));
    }
  }
  return results;
}

export function buildTree(node: FileNode, prefix: string, isLast: boolean): string[] {
  const lines: string[] = [];
  const connector = isLast ? '└── ' : '├── ';
  const color = node.type === 'dir' ? node.name + '/' : node.name;
  lines.push(prefix + connector + color);
  if (node.children) {
    const newPrefix = prefix + (isLast ? '    ' : '│   ');
    node.children.forEach((c, i) => {
      lines.push(...buildTree(c, newPrefix, i === node.children!.length - 1));
    });
  }
  return lines;
}

export function out(text: string): Log { return { type: 'output', text }; }
export function err(text: string): Log { return { type: 'error', text }; }

export function getCompletions(input: string, state: GameState): string[] {
  const parts = input.split(' ');
  const cmds = ['help','tutorial','clear','whoami','cat','pwd','mkdir','touch','rm','find','echo',
    'date','uname','hostname','ifconfig','ping','nmap','ps','kill','history','uptime','df','free',
    'neofetch','wget','curl','chmod','cp','mv','tree','head','tail','grep','ssh','man','ls','cd',
    'sudo','install','connect','disconnect','exit','share'];
  if (parts.length <= 1) {
    const p = parts[0].toLowerCase();
    return cmds.filter(c => c.startsWith(p) && c !== p);
  }
  // Complete file/dir names
  const node = getCurrentDirNode(state);
  if (!node?.children) return [];
  const last = parts[parts.length - 1].toLowerCase();
  return node.children.filter(c => c.name.toLowerCase().startsWith(last)).map(c => c.name);
}
