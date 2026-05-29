import { useState } from 'react';

interface RolesAppProps {
  onClose: () => void;
}

type TabType = 'overview' | 'whitehat' | 'blackhat' | 'opsec';

export default function RolesApp({ onClose }: RolesAppProps) {
  const [activeTab, setActiveTab] = useState<TabType>('overview');

  return (
    <div className="fixed inset-0 z-50 flex items-center landscape:items-start md:items-center justify-center overflow-y-auto p-2 landscape:py-8 landscape:px-4" style={{ background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(5px)' }}>
      <div className="relative flex flex-col rounded-xl overflow-hidden w-[95vw] md:w-[650px] h-[95vh] landscape:h-[450px] md:h-[600px]" style={{
        background: 'linear-gradient(180deg, #090c10 0%, #05070a 100%)',
        border: '1px solid rgba(0,255,136,0.15)',
        boxShadow: '0 0 60px rgba(0,255,136,0.06)',
      }}>
        {/* Title Bar */}
        <div className="flex items-center justify-between px-4 py-3 shrink-0" style={{ background: 'rgba(0,255,136,0.03)', borderBottom: '1px solid rgba(0,255,136,0.08)' }}>
          <div className="flex items-center gap-2">
            <span className="text-base">🎓</span>
            <span className="text-xs font-mono font-bold" style={{ color: '#00ff88' }}>ROLES & OPSEC GUIDE</span>
            <span className="text-[9px] font-mono text-gray-500 hidden sm:inline">— Hacking Classifications & Mechanics</span>
          </div>
          <button onClick={onClose} className="text-lg px-2 hover:scale-125 transition-transform" style={{ color: '#ff4444' }}>✕</button>
        </div>

        {/* Tab Selector */}
        <div className="flex border-b border-[#00ff88]/10 bg-black/30 shrink-0 font-mono text-[10px] sm:text-xs">
          {(['overview', 'whitehat', 'blackhat', 'opsec'] as TabType[]).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className="flex-1 py-3 text-center border-b-2 font-bold uppercase transition-all"
              style={{
                borderColor: activeTab === tab ? '#00ff88' : 'transparent',
                color: activeTab === tab ? '#00ff88' : '#668866',
                background: activeTab === tab ? 'rgba(0,255,136,0.03)' : 'transparent',
                textShadow: activeTab === tab ? '0 0 8px rgba(0,255,136,0.4)' : 'none',
              }}
            >
              {tab === 'overview' && '📋 Ikhtisar'}
              {tab === 'whitehat' && '🔬 White Hat'}
              {tab === 'blackhat' && '🕸️ Black Hat'}
              {tab === 'opsec' && '🛡️ OpSec & Heat'}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-y-auto p-5 font-mono text-xs sm:text-sm leading-relaxed" style={{ scrollbarWidth: 'thin' }}>
          {activeTab === 'overview' && (
            <div className="space-y-4 animate-fade-in">
              <div className="text-center py-3">
                <span className="text-4xl block mb-2">⚖️</span>
                <h3 className="text-[#00ff88] text-base font-bold uppercase tracking-wider">Pilih Jalan Hacking Anda</h3>
                <p className="text-gray-500 text-[10px] sm:text-xs mt-1">Reputasi Anda menentukan akses ke sindikat bawah tanah atau aliansi keamanan etis.</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* White Hat Card */}
                <div onClick={() => setActiveTab('whitehat')} className="p-4 rounded-lg border border-[#00ccff]/20 bg-[#00ccff]/5 hover:bg-[#00ccff]/10 hover:border-[#00ccff]/40 transition-all cursor-pointer">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xl">🔬</span>
                    <h4 className="font-bold text-[#00ccff] uppercase">White Hat</h4>
                  </div>
                  <p className="text-[11px] text-gray-400">Hacker etis yang membantu keamanan sistem. Melaporkan bug untuk mendapat Bug Bounty tunai dalam Fiat USD ($).</p>
                  <div className="mt-3 text-[9px] font-bold text-[#00ccff] uppercase">Keamanan: Tinggi (Bebas Razia)</div>
                </div>

                {/* Black Hat Card */}
                <div onClick={() => setActiveTab('blackhat')} className="p-4 rounded-lg border border-[#ff0044]/20 bg-[#ff0044]/5 hover:bg-[#ff0044]/10 hover:border-[#ff0044]/40 transition-all cursor-pointer">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xl">🕸️</span>
                    <h4 className="font-bold text-[#ff0044] uppercase">Black Hat</h4>
                  </div>
                  <p className="text-[11px] text-gray-400">Peretas ilegal yang mencuri dan menjual data di pasar gelap. Menghasilkan Crypto (NTC) dalam jumlah masif.</p>
                  <div className="mt-3 text-[9px] font-bold text-[#ff0044] uppercase">Keamanan: Berbahaya (Dipantau Polisi siber)</div>
                </div>
              </div>

              <div className="p-3 bg-white/5 rounded border border-white/10 text-[11px] text-gray-400 leading-normal">
                <span className="text-[#ffaa00] font-bold">ℹ️ Keseimbangan Reputasi:</span> Reputasi Anda dimulai di angka <span className="text-white">0 (Netral)</span>. Menjual data menurunkan reputasi menuju <span className="text-[#ff0044]">-100</span>, sementara melaporkan bug menaikkan reputasi hingga <span className="text-[#00ff88]">+100</span>.
              </div>
            </div>
          )}

          {activeTab === 'whitehat' && (
            <div className="space-y-4 animate-fade-in">
              <div className="flex items-center gap-3 border-b border-[#00ccff]/20 pb-2">
                <span className="text-2xl">🔬</span>
                <div>
                  <h3 className="text-[#00ccff] font-bold text-sm uppercase">White Hat (Ethical Hacker)</h3>
                  <div className="text-[10px] text-gray-500">Mencegah Kebocoran • Bertanggung Jawab</div>
                </div>
              </div>

              <p className="text-gray-300 text-xs sm:text-sm">
                White Hat fokus pada analisis kerentanan sistem demi membantu pemilik platform mengamankan data mereka.
              </p>

              <div className="space-y-2">
                <div className="flex items-start gap-2">
                  <span className="text-[#00ccff]">▶</span>
                  <div>
                    <span className="font-bold text-gray-200">Cara Bermain:</span>
                    <p className="text-[11px] text-gray-400">Scan target melalui Inside, eksploit celah keamanan untuk mengambil sampel data, lalu laporkan dengan command <code className="text-[#00ccff] bg-black/40 px-1 py-0.5 rounded">report [nomor]</code> atau tombol <code className="text-[#00ccff] bg-black/40 px-1 py-0.5 rounded">🛡️ REPORT</code> di Inside.</p>
                  </div>
                </div>

                <div className="flex items-start gap-2">
                  <span className="text-[#00ccff]">▶</span>
                  <div>
                    <span className="font-bold text-gray-200">Imbalan & Keuntungan:</span>
                    <p className="text-[11px] text-gray-400">Meningkatkan reputasi +8 poin. Terdapat kesempatan 30% memenangkan Bug Bounty Fiat USD senilai <span className="text-[#ffcc00] font-bold">$2,000 hingga $10,000</span>.</p>
                  </div>
                </div>

                <div className="flex items-start gap-2">
                  <span className="text-[#00ccff]">▶</span>
                  <div>
                    <span className="font-bold text-gray-200">Akses Eksklusif:</span>
                    <p className="text-[11px] text-gray-400">Ketika reputasi mencapai <span className="text-[#00ccff] font-bold">+30 (Grey/White Hat)</span>, Anda akan mendapatkan lisensi khusus untuk membuka aplikasi <span className="text-cyan-400 font-bold">White-Hat Audit</span> di desktop guna mengambil misi audit resmi berkontrak USD.</p>
                  </div>
                </div>

                <div className="flex items-start gap-2">
                  <span className="text-[#00ccff]">▶</span>
                  <div>
                    <span className="font-bold text-[#00ff88]">Kekebalan Hukum:</span>
                    <p className="text-[11px] text-gray-400">Ketika reputasi Anda di atas +10, Anda dianggap bersih dan kebal terhadap deteksi/game over karena aktivitas melacak atau scan siber.</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'blackhat' && (
            <div className="space-y-4 animate-fade-in">
              <div className="flex items-center gap-3 border-b border-[#ff0044]/20 pb-2">
                <span className="text-2xl">🕸️</span>
                <div>
                  <h3 className="text-[#ff0044] font-bold text-sm uppercase">Black Hat (Cyber Criminal)</h3>
                  <div className="text-[10px] text-gray-500">Eksfiltrasi Data • Pasar Gelap Onion</div>
                </div>
              </div>

              <p className="text-gray-300 text-xs sm:text-sm">
                Black Hat melakukan peretasan ilegal dengan cara menembus pertahanan sistem, memanen database rahasia, lalu menjualnya ke penawar tertinggi di dark web.
              </p>

              <div className="space-y-2">
                <div className="flex items-start gap-2">
                  <span className="text-[#ff0044]">▶</span>
                  <div>
                    <span className="font-bold text-gray-200">Cara Bermain:</span>
                    <p className="text-[11px] text-gray-400">Curi file berharga dari server luar atau jaringan lokal (virus HackTool), lalu jual dengan command <code className="text-[#ff0044] bg-black/40 px-1 py-0.5 rounded">sell [nomor]</code>, tombol <code className="text-[#ff0044] bg-black/40 px-1 py-0.5 rounded">💀 SELL</code> di Inside, atau melalui HackTool.</p>
                  </div>
                </div>

                <div className="flex items-start gap-2">
                  <span className="text-[#ff0044]">▶</span>
                  <div>
                    <span className="font-bold text-gray-200">Imbalan & Keuntungan:</span>
                    <p className="text-[11px] text-gray-400">Mendapatkan Crypto NightCoin (NTC) bernilai tinggi secara instan. NTC dapat ditukar ke Fiat USD di DarkNet Exchange.</p>
                  </div>
                </div>

                <div className="flex items-start gap-2">
                  <span className="text-[#ff0044]">▶</span>
                  <div>
                    <span className="font-bold text-gray-200">Akses Eksklusif:</span>
                    <p className="text-[11px] text-gray-400">Ketika reputasi turun di bawah <span className="text-[#ff0044] font-bold">-30 (Black Hat)</span>, Anda akan diundang ke platform sindikat <span className="text-[#ff0044] font-bold">Zero-Day VIP</span> untuk mengambil misi kriminal tingkat tinggi dari kelompok cyber-crime elit.</p>
                  </div>
                </div>

                <div className="flex items-start gap-2">
                  <span className="text-[#ff0044]">▶</span>
                  <div>
                    <span className="font-bold text-red-400">Risiko Traced (Pelacakan):</span>
                    <p className="text-[11px] text-gray-400">Penjualan data memiliki risiko honeypot (perangkap aparat). Jika transaksi terendus, Anda akan terkena denda USD dan mengakumulasi **Suspect Heat**.</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'opsec' && (
            <div className="space-y-4 animate-fade-in">
              <div className="flex items-center gap-3 border-b border-[#ffaa00]/20 pb-2">
                <span className="text-2xl">🛡️</span>
                <div>
                  <h3 className="text-[#ffaa00] font-bold text-sm uppercase">OpSec & Suspect Heat System</h3>
                  <div className="text-[10px] text-gray-500">Keamanan Operasi • Deteksi Penegak Hukum</div>
                </div>
              </div>

              <p className="text-gray-300 text-xs sm:text-sm">
                Melakukan aksi Black Hat tanpa alat pengaman siber (Stealth Tools) adalah tindakan bunuh diri digital. Pahami sistem pelacakan hukum berikut:
              </p>

              <div className="space-y-3 font-mono text-[11px]">
                {/* Suspect Heat explanation */}
                <div className="p-3 bg-red-950/20 border border-red-500/25 rounded">
                  <span className="text-red-400 font-bold uppercase block mb-1">🔥 Suspect Heat Meter (0 - 100%)</span>
                  Setiap kali transaksi penjualan di pasar gelap terdeteksi honeypot (Traced), suspect heat Anda akan <span className="text-red-400 font-bold">bertambah 25%</span>. 
                  Jika mencapai <span className="text-red-400 font-bold animate-pulse">100%</span>, Anda akan langsung ditangkap oleh polisi siber dan memicu <span className="text-red-400 font-bold">Game Over</span>.
                </div>

                {/* Heat decay rules */}
                <div className="p-3 bg-[#00ff88]/5 border border-[#00ff88]/10 rounded leading-normal">
                  <span className="text-[#00ff88] font-bold uppercase block mb-1">⏳ Kecepatan Pemulihan (Decay Rate)</span>
                  Suspect heat berkurang 1% seiring waktu. Kecepatannya ditentukan oleh seberapa Black Hat reputasi Anda:
                  <ul className="list-disc pl-4 mt-1 space-y-1 text-gray-400">
                    <li><span className="text-white">Reputasi Netral / White Hat</span>: Suspect berkurang <span className="text-[#00ff88]">1% setiap 2 detik</span>.</li>
                    <li><span className="text-[#ff0044]">Reputasi Kriminal (Semakin Kiri)</span>: Pemulihan melambat karena aparat terus memantau Anda. Pada reputasi <span className="text-white">-100</span>, suspect berkurang sangat lama, yaitu <span className="text-red-400 font-bold">1% setiap 12 detik</span>.</li>
                  </ul>
                </div>

                {/* Mitigation */}
                <div className="p-3 bg-blue-950/20 border border-blue-500/25 rounded leading-normal">
                  <span className="text-blue-400 font-bold uppercase block mb-1">🛡️ Tips Mengurangi Risiko Terlacak</span>
                  <ul className="list-decimal pl-4 space-y-1 text-gray-400">
                    <li>Nyalakan 2 alat default Anda (<span className="text-white">Stealth Mode</span> & <span className="text-white">IP Spoofing</span>) untuk memotong peluang terkena honeypot hingga <span className="text-blue-400 font-bold">70%</span>.</li>
                    <li>Membeli alat <span className="text-white">Proxy Chain</span> di SettingsApp akan mengurangi risiko trace dari 35% menjadi <span className="text-[#00ff88] font-bold">8%</span> saja.</li>
                  </ul>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer info panel */}
        <div className="p-4 shrink-0 font-mono text-[10px] text-gray-500 text-center bg-black/20 border-t border-[#00ff88]/10">
          <span>Tekan tombol tab di atas untuk mempelajari setiap klasifikasi peran peretas.</span>
        </div>
      </div>
    </div>
  );
}
