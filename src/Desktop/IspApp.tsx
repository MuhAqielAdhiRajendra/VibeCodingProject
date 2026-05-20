import { useState, useEffect } from 'react';
import { getInternetSpeed, getUpgradeSpeedPrice, upgradeInternetSpeed, subscribe, getMoney } from '../game/gameStore';

export default function IspApp({ onClose }: { onClose: () => void }) {
  const [speed, setSpeed] = useState(1);
  const [money, setMoney] = useState(0);
  const [price, setPrice] = useState(0);
  const [message, setMessage] = useState<{ text: string, type: 'success' | 'error' } | null>(null);

  useEffect(() => {
    const update = () => {
      setSpeed(getInternetSpeed());
      setMoney(getMoney());
      setPrice(getUpgradeSpeedPrice());
    };
    update();
    return subscribe(update);
  }, []);

  const showMsg = (text: string, type: 'success' | 'error') => {
    setMessage({ text, type });
    setTimeout(() => setMessage(null), 3000);
  };

  const handleUpgrade = () => {
    const res = upgradeInternetSpeed();
    showMsg(res.message, res.success ? 'success' : 'error');
  };

  const isMaxed = price < 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 landscape:p-1" style={{ background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(5px)' }}>
      <div className="relative flex flex-col rounded-xl overflow-hidden w-[95vw] md:w-[450px] h-[95vh] md:h-[400px]" style={{
        background: '#0a101d', border: '1px solid #1c2c4d', boxShadow: '0 0 50px rgba(0, 100, 255, 0.2)'
      }}>
        {/* Top Bar */}
        <div className="flex items-center justify-between px-4 py-3 shrink-0" style={{ background: '#0d182b', borderBottom: '1px solid #1c2c4d' }}>
          <div className="flex items-center gap-2">
            <span className="text-lg">📡</span>
            <span className="text-sm font-mono font-bold text-blue-300">ISP MANAGER <span className="text-blue-500">PRO</span></span>
          </div>
          <button onClick={onClose} className="text-lg hover:text-red-500 transition-colors ml-4 text-blue-500/50">✕</button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto relative flex flex-col items-center justify-center p-8">
          {message && (
            <div className={`absolute top-0 left-0 right-0 p-3 text-xs font-mono text-center z-10 animate-fade-in ${message.type === 'error' ? 'bg-red-900/90 text-red-200' : 'bg-blue-900/90 text-blue-200'}`}>
              {message.text}
            </div>
          )}

          <div className="w-full max-w-sm flex flex-col items-center">
            <div className="text-5xl mb-4 text-blue-400">⚡</div>
            <h2 className="text-white font-mono text-xl mb-1 text-center">Connection Speed</h2>
            <p className="text-blue-400 font-mono text-xs text-center mb-6">
              Upgrade your internet line for faster hacking processes.
            </p>

            <div className="flex items-center justify-between w-full mb-2 text-sm font-mono bg-[#060a12] p-4 rounded border border-blue-900/50">
              <span className="text-gray-400">Current Speed:</span>
              <span className="text-blue-400 font-bold text-lg">{speed} Mbps</span>
            </div>
            
            <div className="flex items-center justify-between w-full mb-8 text-sm font-mono bg-[#060a12] p-4 rounded border border-blue-900/50">
              <span className="text-gray-400">Your Bank:</span>
              <span className="text-green-400 font-bold">${money.toLocaleString()}</span>
            </div>

            <button 
              onClick={handleUpgrade}
              disabled={isMaxed || money < price}
              className="w-full bg-blue-600/20 hover:bg-blue-600/40 disabled:bg-[#111] disabled:text-gray-600 text-blue-400 border border-blue-500/50 disabled:border-[#333] py-4 rounded font-mono text-sm transition-colors font-bold"
            >
              {isMaxed ? 'MAXIMUM SPEED REACHED' : `UPGRADE TO ${speed === 1 ? 5 : speed + 5} Mbps ($${price.toLocaleString()})`}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
