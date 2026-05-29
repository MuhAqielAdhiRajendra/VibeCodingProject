import { useState, useEffect } from 'react';
import { getCrypto, getMoney, exchangeCrypto, subscribe, getExchangeRate, getTimeUntilNextFluctuation } from '../game/gameStore';

export default function DarkNetApp({ onClose }: { onClose: () => void }) {
  const [cryptoBal, setCryptoBal] = useState(0);
  const [fiatBal, setFiatBal] = useState(0);
  const [exchangeAmount, setExchangeAmount] = useState('');
  const [message, setMessage] = useState<{ text: string, type: 'success' | 'error' } | null>(null);
  
  const [rateInfo, setRateInfo] = useState(getExchangeRate());
  const [timeRemaining, setTimeRemaining] = useState(getTimeUntilNextFluctuation());

  useEffect(() => {
    const update = () => {
      setCryptoBal(getCrypto());
      setFiatBal(getMoney());
      setRateInfo(getExchangeRate());
    };
    update();
    
    const unsubscribeStore = subscribe(update);

    const timer = setInterval(() => {
      setTimeRemaining(getTimeUntilNextFluctuation());
      setRateInfo(getExchangeRate());
    }, 1000);

    return () => {
      unsubscribeStore();
      clearInterval(timer);
    };
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

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  const getTrendBadge = (trend: string) => {
    switch (trend) {
      case 'up': return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-green-950 text-[#00ff88] border border-green-500/30 animate-pulse">▲ BULLISH</span>;
      case 'down': return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-yellow-950 text-[#ffaa00] border border-yellow-500/30">▼ BEARISH</span>;
      case 'crash': return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-red-950 text-[#ff0055] border border-red-500/50 animate-bounce">☠️ CRASHED</span>;
      default: return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-gray-900 text-gray-400 border border-gray-800">● STABLE</span>;
    }
  };

  const inputAmt = parseInt(exchangeAmount) || 0;
  const estimatedPayout = Math.floor(inputAmt * rateInfo.rate);

  return (
    <div className="fixed inset-0 z-50 flex items-center landscape:items-start md:items-center justify-center overflow-y-auto p-2 landscape:py-8 landscape:px-4" style={{ background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(5px)' }}>
      <div className="relative flex flex-col rounded-xl overflow-hidden w-[95vw] md:w-[500px] h-[95vh] landscape:h-[450px] md:h-[580px]" style={{
        background: '#0d0d0d', border: '1px solid #333', boxShadow: '0 0 50px rgba(0,0,0,0.5)'
      }}>
        {/* Top Bar */}
        <div className="flex items-center justify-between px-4 py-3 shrink-0" style={{ background: '#111', borderBottom: '1px solid #222' }}>
          <div className="flex items-center gap-2">
            <span className="text-lg">🕸️</span>
            <span className="text-sm font-mono font-bold text-gray-300">DARKNET <span className="text-[#00ccff]">EXCHANGE</span></span>
          </div>
          <button onClick={onClose} className="text-lg hover:text-red-500 transition-colors ml-4 text-gray-500">✕</button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto relative flex flex-col items-center justify-start p-6">
          {message && (
            <div className={`absolute top-0 left-0 right-0 p-3 text-xs font-mono text-center z-10 animate-fade-in ${message.type === 'error' ? 'bg-red-900/90 text-red-200' : 'bg-green-900/90 text-green-200'}`}>
              {message.text}
            </div>
          )}

          <div className="w-full max-w-md flex flex-col items-center mt-2">
            <div className="text-5xl mb-3">📈</div>
            <h2 className="text-white font-mono text-lg mb-1 text-center">NTC / USD Market</h2>
            <p className="text-gray-500 font-mono text-[10px] text-center mb-4">
              Exchange NightCoin (NTC) to clean USD at real-time rates. Prices fluctuate every 2 minutes. Buy low, sell high, and watch out for crashes! <br/>
              <span className="text-red-400 font-semibold block mt-2">⚠ WARNING: Triggers AML audit if &gt;50,000 NTC is exchanged within 60s.</span>
            </p>

            {/* Market Info Pane */}
            <div className="grid grid-cols-2 gap-3 w-full mb-4 font-mono">
              <div className="p-3 bg-[#111] rounded border border-[#222] flex flex-col gap-1 items-center justify-center">
                <span className="text-[10px] text-gray-500 uppercase">CURRENT RATE</span>
                <span className="text-lg font-bold text-white">1 NTC = ${rateInfo.rate}</span>
                {getTrendBadge(rateInfo.trend)}
              </div>
              <div className="p-3 bg-[#111] rounded border border-[#222] flex flex-col gap-1 items-center justify-center">
                <span className="text-[10px] text-gray-500 uppercase">NEXT UPDATE</span>
                <span className="text-lg font-bold text-[#00ccff]">{formatTime(timeRemaining)}</span>
                <span className="text-[9px] text-gray-600">Volatile Fluctuations</span>
              </div>
            </div>

            {/* Input */}
            <div className="w-full relative mb-4">
              <input 
                type="number" 
                value={exchangeAmount}
                onChange={e => setExchangeAmount(e.target.value)}
                placeholder="Enter NTC amount..."
                className="w-full bg-black border border-[#333] text-[#00ccff] font-mono p-4 rounded outline-none focus:border-[#00ccff] transition-colors text-center text-lg"
              />
              <button onClick={() => setExchangeAmount(cryptoBal.toString())} className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-gray-500 hover:text-white font-mono bg-[#222] px-2 py-1 rounded">MAX</button>
            </div>

            {/* Estimate info */}
            {inputAmt > 0 && (
              <div className="w-full mb-4 text-center font-mono text-xs text-[#00ff88] bg-green-950/20 py-2 border border-green-500/25 rounded">
                Estimated Payout: <span className="font-bold">${estimatedPayout.toLocaleString()} USD</span>
              </div>
            )}

            {/* Balances */}
            <div className="flex items-center justify-between w-full mb-2 text-xs font-mono bg-[#111] p-2.5 rounded border border-[#222]">
              <span className="text-gray-400">NTC Balance:</span>
              <span className="text-[#00ccff] font-bold">{cryptoBal.toLocaleString()} NTC</span>
            </div>
            
            <div className="flex items-center justify-between w-full mb-5 text-xs font-mono bg-[#111] p-2.5 rounded border border-[#222]">
              <span className="text-gray-400">USD Balance:</span>
              <span className="text-[#ffcc00] font-bold">${fiatBal.toLocaleString()}</span>
            </div>

            <button 
              onClick={handleExchange}
              disabled={!exchangeAmount || parseInt(exchangeAmount) <= 0 || parseInt(exchangeAmount) > cryptoBal}
              className="w-full bg-[#00ccff]/20 hover:bg-[#00ccff]/30 disabled:bg-[#222] disabled:text-gray-600 text-[#00ccff] border border-[#00ccff]/50 disabled:border-[#333] py-3.5 rounded font-mono text-sm transition-colors font-bold uppercase tracking-wider"
            >
              PROCESS EXCHANGE
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

