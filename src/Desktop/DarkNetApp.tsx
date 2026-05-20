import { useState, useEffect } from 'react';
import { getCrypto, getMoney, exchangeCrypto, subscribe } from '../game/gameStore';

export default function DarkNetApp({ onClose }: { onClose: () => void }) {
  const [cryptoBal, setCryptoBal] = useState(0);
  const [fiatBal, setFiatBal] = useState(0);
  const [exchangeAmount, setExchangeAmount] = useState('');
  const [message, setMessage] = useState<{ text: string, type: 'success' | 'error' } | null>(null);

  useEffect(() => {
    const update = () => {
      setCryptoBal(getCrypto());
      setFiatBal(getMoney());
    };
    update();
    return subscribe(update);
  }, []);

  const showMsg = (text: string, type: 'success' | 'error') => {
    setMessage({ text, type });
    setTimeout(() => setMessage(null), 5000);
  };

  const handleExchange = () => {
    const amt = parseInt(exchangeAmount);
    if (isNaN(amt) || amt <= 0) {
      showMsg('Invalid amount', 'error');
      return;
    }
    const res = exchangeCrypto(amt);
    if (res.caught) {
      window.location.reload(); // Reload triggers Game Over screen
      return;
    }
    showMsg(res.message, res.success ? 'success' : 'error');
    setExchangeAmount('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 landscape:p-1" style={{ background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(5px)' }}>
      <div className="relative flex flex-col rounded-xl overflow-hidden w-[95vw] md:w-[500px] h-[95vh] md:h-[550px]" style={{
        background: '#0d0d0d', border: '1px solid #333', boxShadow: '0 0 50px rgba(0,0,0,0.5)'
      }}>
        {/* Top Bar */}
        <div className="flex items-center justify-between px-4 py-3 shrink-0" style={{ background: '#111', borderBottom: '1px solid #222' }}>
          <div className="flex items-center gap-2">
            <span className="text-lg">🕸️</span>
            <span className="text-sm font-mono font-bold text-gray-300">DARKNET <span className="text-[#ff4444]">MIXER</span></span>
          </div>
          <button onClick={onClose} className="text-lg hover:text-red-500 transition-colors ml-4 text-gray-500">✕</button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto relative flex flex-col items-center justify-center p-8">
          {message && (
            <div className={`absolute top-0 left-0 right-0 p-3 text-xs font-mono text-center z-10 animate-fade-in ${message.type === 'error' ? 'bg-red-900/90 text-red-200' : 'bg-green-900/90 text-green-200'}`}>
              {message.text}
            </div>
          )}

          <div className="w-full max-w-md flex flex-col items-center mt-4">
            <div className="text-6xl mb-4">🏦</div>
            <h2 className="text-white font-mono text-xl mb-2 text-center">Crypto Laundromat</h2>
            <p className="text-gray-500 font-mono text-xs text-center mb-8">
              Exchange your NightCoin (NTC) into clean untraceable Fiat USD. <br/><br/>
              <span className="text-red-400">⚠ WARNING: Exchanging more than 50,000 NTC in total within a short time (60s) has an 80% chance to trigger AML (Anti-Money Laundering) authorities.</span>
            </p>

            <div className="w-full relative mb-6">
              <input 
                type="number" 
                value={exchangeAmount}
                onChange={e => setExchangeAmount(e.target.value)}
                placeholder="Enter NTC amount..."
                className="w-full bg-black border border-[#333] text-[#00ccff] font-mono p-4 rounded outline-none focus:border-[#00ccff] transition-colors text-center text-lg"
              />
              <button onClick={() => setExchangeAmount(cryptoBal.toString())} className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-gray-500 hover:text-white font-mono bg-[#222] px-2 py-1 rounded">MAX</button>
            </div>

            <div className="flex items-center justify-between w-full mb-2 text-sm font-mono bg-[#111] p-3 rounded border border-[#222]">
              <span className="text-gray-400">NTC Balance:</span>
              <span className="text-[#00ccff] font-bold">{cryptoBal.toLocaleString()} NTC</span>
            </div>
            
            <div className="flex items-center justify-between w-full mb-8 text-sm font-mono bg-[#111] p-3 rounded border border-[#222]">
              <span className="text-gray-400">USD Balance:</span>
              <span className="text-[#ffcc00] font-bold">${fiatBal.toLocaleString()}</span>
            </div>

            <button 
              onClick={handleExchange}
              disabled={!exchangeAmount || parseInt(exchangeAmount) <= 0 || parseInt(exchangeAmount) > cryptoBal}
              className="w-full bg-[#00ccff]/20 hover:bg-[#00ccff]/30 disabled:bg-[#222] disabled:text-gray-600 text-[#00ccff] border border-[#00ccff]/50 disabled:border-[#333] py-4 rounded font-mono text-sm transition-colors font-bold"
            >
              TUMBLE & EXCHANGE
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
