import { useState, useEffect } from 'react';

function isMobile() {
  return /Android|iPhone|iPad|iPod|Opera Mini|IEMobile|WPDesktop/i.test(navigator.userAgent)
    || window.innerWidth <= 768;
}

export default function LandscapeGuard({ children }: { children: React.ReactNode }) {
  const [showWarning, setShowWarning] = useState(false);

  useEffect(() => {
    const check = () => {
      const portrait = window.innerHeight > window.innerWidth;
      setShowWarning(isMobile() && portrait);
    };
    check();
    window.addEventListener('resize', check);
    window.addEventListener('orientationchange', check);
    return () => {
      window.removeEventListener('resize', check);
      window.removeEventListener('orientationchange', check);
    };
  }, []);

  if (showWarning) {
    return (
      <div style={{
        position: 'fixed', inset: 0, zIndex: 9999,
        background: '#f8f9fa',
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        gap: 24, fontFamily: "'Segoe UI', system-ui, sans-serif",
        userSelect: 'none',
      }}>

        {/* Rotating phone SVG */}
        <div style={{ animation: 'rotatePh 2s ease-in-out infinite' }}>
          <svg width="64" height="64" viewBox="0 0 64 64" fill="none">
            {/* Phone body */}
            <rect x="18" y="8" width="28" height="48" rx="5" stroke="#555" strokeWidth="2.5" fill="none"/>
            <circle cx="32" cy="50" r="2.5" fill="#555"/>
            {/* Rotate arrow */}
            <path d="M44 4 Q56 16 44 28" stroke="#0078D7" strokeWidth="2.5" strokeLinecap="round" fill="none"/>
            <polyline points="44,26 44,30 40,28" stroke="#0078D7" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
          </svg>
        </div>

        {/* Text */}
        <div style={{ textAlign: 'center', padding: '0 32px' }}>
          <div style={{ fontSize: 18, fontWeight: 700, color: '#1a1a1a', marginBottom: 8 }}>
            Putar Layarmu
          </div>
          <div style={{ fontSize: 13, color: '#666', lineHeight: 1.6 }}>
            Gunakan mode <span style={{ color: '#0078D7', fontWeight: 600 }}>Landscape</span> untuk<br/>
            tampilan yang lebih baik.
          </div>
        </div>

        <style>{`
          @keyframes rotatePh {
            0%   { transform: rotate(0deg);   }
            35%  { transform: rotate(-90deg); }
            65%  { transform: rotate(-90deg); }
            100% { transform: rotate(0deg);   }
          }
        `}</style>
      </div>
    );
  }

  return <>{children}</>;
}
