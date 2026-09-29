import React from 'react';
import { Card, Suit } from '../types';

interface FournierCardProps {
  card?: Card;
  hidden?: boolean;
  selected?: boolean;
  selectable?: boolean;
  onClick?: () => void;
  size?: 'sm' | 'md' | 'lg' | 'hand';
  className?: string;
}

export const FournierCard: React.FC<FournierCardProps> = ({
  card,
  hidden = false,
  selected = false,
  selectable = false,
  onClick,
  size = 'md',
  className = '',
}) => {
  const sizeClasses = {
    sm: 'w-12 h-18 text-[10px]',
    md: 'w-20 h-28 text-xs',
    lg: 'w-24 h-34 text-sm',
    hand: 'w-24 h-36 sm:w-28 sm:h-42 md:w-32 md:h-48 text-sm sm:text-base',
  }[size];

  // Card Back (Reverso tradicional de Naipes Fournier rojo con orla geométrica y rombos)
  if (hidden || !card) {
    return (
      <div
        className={`
          ${sizeClasses}
          relative rounded-xl border-2 border-stone-900 bg-white p-1 shadow-md
          flex items-center justify-center select-none overflow-hidden transition-transform
          ${className}
        `}
      >
        <div className="w-full h-full rounded-lg border-2 border-red-700 bg-red-800 relative overflow-hidden flex items-center justify-center">
          {/* Authentic red crosshatch and diamond pattern */}
          <div
            className="absolute inset-0 opacity-40"
            style={{
              backgroundImage: `repeating-linear-gradient(45deg, #7f1d1d 0, #7f1d1d 2px, transparent 0, transparent 8px),
                                repeating-linear-gradient(-45deg, #7f1d1d 0, #7f1d1d 2px, transparent 0, transparent 8px)`,
            }}
          />
          {/* Inner medallion */}
          <div className="relative z-10 w-10 h-10 rounded-full border-2 border-amber-300 bg-red-950 flex flex-col items-center justify-center shadow">
            <span className="font-serif font-black text-[10px] text-amber-300 tracking-tighter">
              MUS
            </span>
            <span className="text-[7px] font-mono font-bold text-amber-400">1996</span>
          </div>
        </div>
      </div>
    );
  }

  const { suit, number } = card;
  const isHandSize = size === 'hand' || size === 'lg';

  // Pintas ("faros") tradicionales en la orla española Fournier:
  // Oros: 0 cortes (marco continuo cerrado)
  // Copas: 1 corte (interrupción arriba y abajo)
  // Espadas: 2 cortes (dos interrupciones arriba y abajo)
  // Bastos: 3 cortes (tres interrupciones arriba y abajo)
  const renderPintas = () => {
    if (suit === 'copas') {
      return (
        <>
          <div className="absolute -top-[2px] left-1/2 -translate-x-1/2 w-2.5 h-[3px] bg-[#fffef9] z-10" />
          <div className="absolute -bottom-[2px] left-1/2 -translate-x-1/2 w-2.5 h-[3px] bg-[#fffef9] z-10" />
        </>
      );
    }
    if (suit === 'espadas') {
      return (
        <>
          <div className="absolute -top-[2px] left-1/3 -translate-x-1/2 w-2 h-[3px] bg-[#fffef9] z-10" />
          <div className="absolute -top-[2px] left-2/3 -translate-x-1/2 w-2 h-[3px] bg-[#fffef9] z-10" />
          <div className="absolute -bottom-[2px] left-1/3 -translate-x-1/2 w-2 h-[3px] bg-[#fffef9] z-10" />
          <div className="absolute -bottom-[2px] left-2/3 -translate-x-1/2 w-2 h-[3px] bg-[#fffef9] z-10" />
        </>
      );
    }
    if (suit === 'bastos') {
      return (
        <>
          <div className="absolute -top-[2px] left-1/4 -translate-x-1/2 w-1.5 h-[3px] bg-[#fffef9] z-10" />
          <div className="absolute -top-[2px] left-1/2 -translate-x-1/2 w-1.5 h-[3px] bg-[#fffef9] z-10" />
          <div className="absolute -top-[2px] left-3/4 -translate-x-1/2 w-1.5 h-[3px] bg-[#fffef9] z-10" />
          <div className="absolute -bottom-[2px] left-1/4 -translate-x-1/2 w-1.5 h-[3px] bg-[#fffef9] z-10" />
          <div className="absolute -bottom-[2px] left-1/2 -translate-x-1/2 w-1.5 h-[3px] bg-[#fffef9] z-10" />
          <div className="absolute -bottom-[2px] left-3/4 -translate-x-1/2 w-1.5 h-[3px] bg-[#fffef9] z-10" />
        </>
      );
    }
    return null;
  };

  // Spanish Suit Icons (Oros, Copas, Espadas, Bastos)
  const renderSuitIcon = (isLarge = false) => {
    const dim = isLarge
      ? isHandSize
        ? 'w-10 h-10 sm:w-12 sm:h-12'
        : 'w-7 h-7'
      : isHandSize
      ? 'w-4 h-4'
      : 'w-3 h-3';

    if (suit === 'oros') {
      return (
        <svg viewBox="0 0 48 48" className={`${dim} flex-shrink-0 drop-shadow`} fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="24" cy="24" r="22" fill="url(#oro_base)" stroke="#78350f" strokeWidth="2.5" />
          <circle cx="24" cy="24" r="17" stroke="#b45309" strokeWidth="1.5" strokeDasharray="2 1.5" />
          <circle cx="24" cy="24" r="11" fill="#fef08a" stroke="#92400e" strokeWidth="1.5" />
          <path d="M24 14L26 21L33 21L27.5 25L29.5 32L24 28L18.5 32L20.5 25L15 21L22 21Z" fill="#d97706" stroke="#78350f" strokeWidth="0.8" />
          <circle cx="24" cy="24" r="3.5" fill="#b45309" />
          <defs>
            <linearGradient id="oro_base" x1="6" y1="6" x2="42" y2="42" gradientUnits="userSpaceOnUse">
              <stop stopColor="#fef08a" />
              <stop offset="0.4" stopColor="#fbbf24" />
              <stop offset="0.8" stopColor="#d97706" />
              <stop offset="1" stopColor="#92400e" />
            </linearGradient>
          </defs>
        </svg>
      );
    }

    if (suit === 'copas') {
      return (
        <svg viewBox="0 0 48 48" className={`${dim} flex-shrink-0 drop-shadow`} fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M12 12C12 12 16 10 24 10C32 10 36 12 36 12L34 23C34 29 29 33 24 33C19 33 14 29 14 23L12 12Z" fill="url(#copa_body)" stroke="#450a0a" strokeWidth="2" />
          <path d="M16 14C16 14 19 12.5 24 12.5C29 12.5 32 14 32 14C32 18 30 24 24 24C18 24 16 18 16 14Z" fill="url(#copa_vin)" />
          <rect x="22" y="32" width="4" height="7" fill="#b45309" stroke="#450a0a" strokeWidth="1.5" />
          <ellipse cx="24" cy="35" rx="4" ry="2" fill="#facc15" stroke="#78350f" strokeWidth="1" />
          <path d="M14 43C14 39 19 38 24 38C29 38 34 39 34 43H14Z" fill="url(#copa_foot)" stroke="#450a0a" strokeWidth="2" />
          <defs>
            <linearGradient id="copa_body" x1="12" y1="10" x2="36" y2="33" gradientUnits="userSpaceOnUse">
              <stop stopColor="#fde047" />
              <stop offset="0.5" stopColor="#ca8a04" />
              <stop offset="1" stopColor="#854d0e" />
            </linearGradient>
            <linearGradient id="copa_vin" x1="16" y1="12" x2="32" y2="24" gradientUnits="userSpaceOnUse">
              <stop stopColor="#f43f5e" />
              <stop offset="0.6" stopColor="#991b1b" />
              <stop offset="1" stopColor="#4c0519" />
            </linearGradient>
            <linearGradient id="copa_foot" x1="14" y1="38" x2="34" y2="43" gradientUnits="userSpaceOnUse">
              <stop stopColor="#fde047" />
              <stop offset="1" stopColor="#a16207" />
            </linearGradient>
          </defs>
        </svg>
      );
    }

    if (suit === 'espadas') {
      return (
        <svg viewBox="0 0 48 48" className={`${dim} flex-shrink-0 drop-shadow`} fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M23 4L24 2L25 4L26 31H22L23 4Z" fill="url(#esp_blade)" stroke="#1e293b" strokeWidth="1.5" />
          <line x1="24" y1="5" x2="24" y2="28" stroke="#3b82f6" strokeWidth="1" />
          <path d="M12 32C16 30 32 30 36 32C37 33 35 35 32 35C28 35 20 35 16 35C13 35 11 33 12 32Z" fill="#fbbf24" stroke="#78350f" strokeWidth="1.5" />
          <circle cx="12" cy="33" r="2" fill="#d97706" />
          <circle cx="36" cy="33" r="2" fill="#d97706" />
          <rect x="22.5" y="35" width="3" height="7" rx="1" fill="#7f1d1d" stroke="#1e1e1e" strokeWidth="1" />
          <line x1="22.5" y1="37" x2="25.5" y2="37" stroke="#fbbf24" strokeWidth="0.8" />
          <line x1="22.5" y1="39" x2="25.5" y2="39" stroke="#fbbf24" strokeWidth="0.8" />
          <circle cx="24" cy="44" r="3" fill="#f59e0b" stroke="#78350f" strokeWidth="1.5" />
          <defs>
            <linearGradient id="esp_blade" x1="22" y1="2" x2="26" y2="31" gradientUnits="userSpaceOnUse">
              <stop stopColor="#f8fafc" />
              <stop offset="0.3" stopColor="#e2e8f0" />
              <stop offset="0.7" stopColor="#94a3b8" />
              <stop offset="1" stopColor="#475569" />
            </linearGradient>
          </defs>
        </svg>
      );
    }

    // Bastos
    return (
      <svg viewBox="0 0 48 48" className={`${dim} flex-shrink-0 drop-shadow`} fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M21 44L20 22C19 16 18 10 20 6C21 3 27 3 28 6C30 10 29 16 28 22L27 44H21Z" fill="url(#bas_wood)" stroke="#1c1917" strokeWidth="2" />
        <ellipse cx="23" cy="14" rx="2" ry="3" fill="#451a03" stroke="#292524" strokeWidth="1" />
        <ellipse cx="26" cy="27" rx="2.5" ry="3.5" fill="#451a03" stroke="#292524" strokeWidth="1" />
        <ellipse cx="22" cy="38" rx="2" ry="2.5" fill="#451a03" stroke="#292524" strokeWidth="1" />
        <path d="M18 12C14 10 13 6 15 5C17 6 18 9 18 12Z" fill="#22c55e" stroke="#14532d" strokeWidth="1" />
        <path d="M30 20C34 18 35 14 33 13C31 14 30 17 30 20Z" fill="#16a34a" stroke="#14532d" strokeWidth="1" />
        <path d="M19 30C15 29 14 26 16 25C17 26 19 28 19 30Z" fill="#22c55e" stroke="#14532d" strokeWidth="1" />
        <path d="M29 36C33 35 34 32 32 31C30 32 29 34 29 36Z" fill="#16a34a" stroke="#14532d" strokeWidth="1" />
        <defs>
          <linearGradient id="bas_wood" x1="18" y1="4" x2="30" y2="44" gradientUnits="userSpaceOnUse">
            <stop stopColor="#a16207" />
            <stop offset="0.3" stopColor="#78350f" />
            <stop offset="0.7" stopColor="#451a03" />
            <stop offset="1" stopColor="#292524" />
          </linearGradient>
        </defs>
      </svg>
    );
  };

  // Color schemes for suits
  const suitTheme = {
    oros: {
      name: 'OROS',
      badgeBg: 'bg-amber-100 text-amber-900 border-amber-500',
      cornerNum: 'text-amber-950',
      accentColor: 'border-amber-600',
      bannerBg: 'bg-amber-500 text-stone-950',
      suitColor: '#b45309',
    },
    copas: {
      name: 'COPAS',
      badgeBg: 'bg-rose-100 text-rose-900 border-rose-500',
      cornerNum: 'text-rose-950',
      accentColor: 'border-rose-600',
      bannerBg: 'bg-red-600 text-white',
      suitColor: '#be123c',
    },
    espadas: {
      name: 'ESPADAS',
      badgeBg: 'bg-blue-100 text-blue-900 border-blue-500',
      cornerNum: 'text-slate-950',
      accentColor: 'border-blue-700',
      bannerBg: 'bg-blue-700 text-white',
      suitColor: '#1d4ed8',
    },
    bastos: {
      name: 'BASTOS',
      badgeBg: 'bg-emerald-100 text-emerald-900 border-emerald-600',
      cornerNum: 'text-emerald-950',
      accentColor: 'border-emerald-700',
      bannerBg: 'bg-emerald-700 text-white',
      suitColor: '#15803d',
    },
  }[suit];

  // AUTHENTIC SPANISH FOURNIER COURT FIGURES (FIGURAS DE LA BARAJA ESPAÑOLA)
  // 10: SOTA (Page / Infante)
  // 11: CABALLO (Knight on Horse)
  // 12: REY (Crowned King)
  const renderCourtFigureIllustration = () => {
    // 10: SOTA (Standing Renaissance Page with hat, slashed doublet, hose, holding suit item)
    if (number === 10) {
      return (
        <svg viewBox="0 0 100 130" className="w-full h-full max-h-36 object-contain" fill="none" xmlns="http://www.w3.org/2000/svg">
          {/* Feathered Beret Hat */}
          <path d="M35 15C32 10 45 6 60 9C68 11 72 16 68 20C62 23 40 22 35 15Z" fill={suit === 'oros' ? '#b45309' : suit === 'copas' ? '#991b1b' : suit === 'espadas' ? '#1e3a8a' : '#14532d'} stroke="#1c1917" strokeWidth="1.5" />
          {/* White / Gold Feather Plume */}
          <path d="M62 8C68 2 76 4 78 8C76 10 70 12 65 11Z" fill="#fef08a" stroke="#ca8a04" strokeWidth="1" />
          
          {/* Face & Hair */}
          <circle cx="50" cy="24" r="9" fill="#fde68a" stroke="#1c1917" strokeWidth="1.5" />
          {/* Renaissance Wavy Hair Curls */}
          <path d="M42 22C40 26 42 30 44 32M58 22C60 26 58 30 56 32" stroke="#78350f" strokeWidth="2" strokeLinecap="round" />
          {/* Eyes, Nose, Mouth */}
          <circle cx="47" cy="24" r="1" fill="#1c1917" />
          <circle cx="53" cy="24" r="1" fill="#1c1917" />
          <path d="M50 25V27" stroke="#78350f" strokeWidth="1" />
          <path d="M48 29Q50 31 52 29" stroke="#b91c1c" strokeWidth="1.2" fill="none" />
          {/* White Ruff Collar */}
          <ellipse cx="50" cy="33" rx="11" ry="3" fill="#ffffff" stroke="#1c1917" strokeWidth="1.2" />

          {/* Slashed Renaissance Doublet (Jubón) */}
          <path d="M38 35L33 60L50 63L67 60L62 35H38Z" fill={suit === 'copas' ? '#dc2626' : suit === 'espadas' ? '#2563eb' : suit === 'bastos' ? '#16a34a' : '#d97706'} stroke="#1c1917" strokeWidth="1.5" />
          {/* Puffed Sleeves */}
          <ellipse cx="34" cy="42" rx="6" ry="8" fill="#fbbf24" stroke="#1c1917" strokeWidth="1.2" />
          <ellipse cx="66" cy="42" rx="6" ry="8" fill="#fbbf24" stroke="#1c1917" strokeWidth="1.2" />
          {/* Slashed Pattern Stripes on Tunic */}
          <line x1="46" y1="36" x2="44" y2="58" stroke="#ffffff" strokeWidth="1.5" strokeDasharray="3 2" />
          <line x1="54" y1="36" x2="56" y2="58" stroke="#ffffff" strokeWidth="1.5" strokeDasharray="3 2" />
          {/* Gold Belt & Buckle */}
          <rect x="36" y="58" width="28" height="5" fill="#facc15" stroke="#78350f" strokeWidth="1" />
          <rect x="47" y="57" width="6" height="7" fill="#fbbf24" stroke="#1c1917" strokeWidth="1.2" />

          {/* Calzas (Hose / Tights) */}
          <path d="M40 63L38 102L45 104L48 64H40Z" fill={suit === 'copas' ? '#15803d' : '#fef08a'} stroke="#1c1917" strokeWidth="1.5" />
          <path d="M52 64L55 104L62 102L60 63H52Z" fill={suit === 'copas' ? '#15803d' : '#fef08a'} stroke="#1c1917" strokeWidth="1.5" />
          {/* Renaissance Pointed Shoes */}
          <path d="M36 102C32 104 35 108 45 108H46L44 102H36Z" fill="#1c1917" />
          <path d="M64 102C68 104 65 108 55 108H54L56 102H64Z" fill="#1c1917" />

          {/* Suit item held by the Sota */}
          {suit === 'oros' && (
            <g transform="translate(14, 25) scale(0.65)">
              <circle cx="24" cy="24" r="18" fill="url(#oro_base)" stroke="#78350f" strokeWidth="2" />
              <path d="M24 14L26 21L33 21L27.5 25L29.5 32L24 28L18.5 32L20.5 25L15 21L22 21Z" fill="#d97706" />
            </g>
          )}
          {suit === 'copas' && (
            <g transform="translate(15, 26) scale(0.65)">
              <path d="M12 12C12 12 16 10 24 10C32 10 36 12 36 12L34 23C34 29 29 33 24 33C19 33 14 29 14 23L12 12Z" fill="url(#copa_body)" stroke="#450a0a" strokeWidth="2" />
              <path d="M14 43C14 39 19 38 24 38C29 38 34 39 34 43H14Z" fill="url(#copa_foot)" stroke="#450a0a" strokeWidth="2" />
            </g>
          )}
          {suit === 'espadas' && (
            <g transform="translate(68, 12) rotate(15) scale(0.8)">
              <path d="M23 4L24 2L25 4L26 42H22L23 4Z" fill="url(#esp_blade)" stroke="#1e293b" strokeWidth="1.5" />
              <path d="M14 42H34V46H14Z" fill="#fbbf24" stroke="#78350f" strokeWidth="1" />
            </g>
          )}
          {suit === 'bastos' && (
            <g transform="translate(12, 10) scale(0.75)">
              <path d="M21 54L20 22C19 16 18 10 20 6C21 3 27 3 28 6C30 10 29 16 28 22L27 54H21Z" fill="url(#bas_wood)" stroke="#1c1917" strokeWidth="1.5" />
              <path d="M18 12C14 10 13 6 15 5C17 6 18 9 18 12Z" fill="#22c55e" stroke="#14532d" strokeWidth="1" />
            </g>
          )}
          {/* Ground shadow */}
          <ellipse cx="50" cy="112" rx="28" ry="4" fill="#000000" opacity="0.15" />
        </svg>
      );
    }

    // 11: CABALLO (Knight on Horseback)
    if (number === 11) {
      return (
        <svg viewBox="0 0 100 130" className="w-full h-full max-h-36 object-contain" fill="none" xmlns="http://www.w3.org/2000/svg">
          {/* Ground shadow */}
          <ellipse cx="50" cy="116" rx="34" ry="5" fill="#000000" opacity="0.15" />

          {/* Horse Body (Torso, haunches, neck) */}
          <path d="M30 65C20 60 16 70 18 85C20 95 32 98 45 94C58 92 72 90 82 82C88 75 85 64 78 62C65 60 45 62 30 65Z" fill={suit === 'espadas' ? '#e2e8f0' : suit === 'bastos' ? '#78350f' : '#f5f5f4'} stroke="#1c1917" strokeWidth="2" />
          {/* Horse Arched Neck & Head */}
          <path d="M68 64C72 50 78 38 85 30C88 26 92 27 94 32C95 38 90 46 88 52L82 72" fill={suit === 'espadas' ? '#e2e8f0' : suit === 'bastos' ? '#78350f' : '#f5f5f4'} stroke="#1c1917" strokeWidth="2" />
          {/* Horse Muzzle & Eye */}
          <path d="M85 30L95 28C98 30 96 36 91 38L85 30Z" fill={suit === 'espadas' ? '#cbd5e1' : '#57300a'} stroke="#1c1917" strokeWidth="1.2" />
          <circle cx="89" cy="32" r="1.5" fill="#1c1917" />
          {/* Horse Ears */}
          <path d="M84 27L86 21L88 26Z" fill="#1c1917" />
          <path d="M88 27L90 22L92 26Z" fill="#1c1917" />
          {/* Horse Mane */}
          <path d="M74 34Q70 38 72 44Q68 48 70 54Q66 58 68 64" stroke="#b45309" strokeWidth="3" strokeLinecap="round" />
          {/* Horse Tail */}
          <path d="M18 78C10 82 8 98 12 110C14 112 16 102 18 92" fill={suit === 'bastos' ? '#451a03' : '#cbd5e1'} stroke="#1c1917" strokeWidth="1.5" />

          {/* Horse Legs (Prancing) */}
          {/* Front Raised Hooves */}
          <path d="M78 80L84 96L88 95L82 78" fill="#f5f5f4" stroke="#1c1917" strokeWidth="1.5" />
          <path d="M82 80L92 90L95 88L85 78" fill="#e5e5e5" stroke="#1c1917" strokeWidth="1.5" />
          <rect x="83" y="94" width="6" height="4" rx="1" fill="#1c1917" />
          <rect x="91" y="87" width="5" height="4" rx="1" fill="#1c1917" />
          {/* Hind Standing Hooves */}
          <path d="M26 90L24 112L30 112L34 92" fill="#f5f5f4" stroke="#1c1917" strokeWidth="1.5" />
          <path d="M38 92L42 114L48 114L46 92" fill="#e5e5e5" stroke="#1c1917" strokeWidth="1.5" />
          <rect x="23" y="110" width="7" height="4" rx="1" fill="#1c1917" />
          <rect x="42" y="112" width="7" height="4" rx="1" fill="#1c1917" />

          {/* Ornate Saddle & Blanket (Gualdrapa) */}
          <path d="M40 64C40 64 48 60 58 62L62 76C55 80 44 80 38 76L40 64Z" fill={suitTheme.suitColor} stroke="#fbbf24" strokeWidth="1.5" />
          {/* Stirrup Strap */}
          <line x1="48" y1="72" x2="46" y2="88" stroke="#78350f" strokeWidth="1.5" />
          <rect x="44" y="87" width="5" height="4" fill="#fbbf24" stroke="#1c1917" strokeWidth="1" />

          {/* The Knight Rider */}
          {/* Knight Leg in Stirrup */}
          <path d="M44 56C42 66 45 78 47 88L52 87C50 78 48 66 50 56Z" fill="#1e3a8a" stroke="#1c1917" strokeWidth="1.5" />
          {/* Knight Torso & Cuirass */}
          <path d="M42 36L38 56L54 56L56 36H42Z" fill={suit === 'espadas' ? '#94a3b8' : '#b45309'} stroke="#1c1917" strokeWidth="1.5" />
          {/* Knight Head & Helmet with Crest */}
          <circle cx="48" cy="27" r="7" fill="#fde68a" stroke="#1c1917" strokeWidth="1.5" />
          <path d="M44 23C42 16 52 14 56 20C52 24 46 25 44 23Z" fill="#fbbf24" stroke="#1c1917" strokeWidth="1.2" />
          {/* Helmet Feather Plume */}
          <path d="M50 16C54 8 62 10 64 16C58 17 53 18 50 16Z" fill="#ef4444" stroke="#991b1b" strokeWidth="1" />
          {/* Flowing Knight Mantle */}
          <path d="M38 40C25 42 22 52 24 64C30 58 35 56 38 52" fill="#dc2626" stroke="#1c1917" strokeWidth="1.2" />

          {/* Weapon / Suit item brandished by Knight */}
          {suit === 'oros' && (
            <g transform="translate(65, 8) scale(0.6)">
              <circle cx="24" cy="24" r="18" fill="url(#oro_base)" stroke="#78350f" strokeWidth="2" />
              <path d="M24 14L26 21L33 21L27.5 25L29.5 32L24 28L18.5 32L20.5 25L15 21L22 21Z" fill="#d97706" />
            </g>
          )}
          {suit === 'copas' && (
            <g transform="translate(56, 4) scale(0.6)">
              <path d="M12 12C12 12 16 10 24 10C32 10 36 12 36 12L34 23C34 29 29 33 24 33C19 33 14 29 14 23L12 12Z" fill="url(#copa_body)" stroke="#450a0a" strokeWidth="2" />
              <path d="M14 43C14 39 19 38 24 38C29 38 34 39 34 43H14Z" fill="url(#copa_foot)" stroke="#450a0a" strokeWidth="2" />
            </g>
          )}
          {suit === 'espadas' && (
            <g transform="translate(52, 2) rotate(-25) scale(0.8)">
              <path d="M23 4L24 2L25 4L26 36H22L23 4Z" fill="url(#esp_blade)" stroke="#1e293b" strokeWidth="1.5" />
              <path d="M14 36H34V40H14Z" fill="#fbbf24" stroke="#78350f" strokeWidth="1.2" />
            </g>
          )}
          {suit === 'bastos' && (
            <g transform="translate(56, 4) rotate(20) scale(0.7)">
              <path d="M21 44L20 22C19 16 18 10 20 6C21 3 27 3 28 6C30 10 29 16 28 22L27 44H21Z" fill="url(#bas_wood)" stroke="#1c1917" strokeWidth="1.5" />
            </g>
          )}
        </svg>
      );
    }

    // 12: REY (Crowned Spanish Monarch with royal beard, robe with ermine fur, scepter and suit item)
    return (
      <svg viewBox="0 0 100 130" className="w-full h-full max-h-36 object-contain" fill="none" xmlns="http://www.w3.org/2000/svg">
        {/* Golden Royal Crown with Fleurons and Jewels */}
        <path d="M36 18L33 10L42 14L50 8L58 14L67 10L64 18H36Z" fill="#fbbf24" stroke="#78350f" strokeWidth="1.5" />
        <circle cx="50" cy="8" r="2" fill="#ef4444" />
        <circle cx="33" cy="10" r="1.5" fill="#3b82f6" />
        <circle cx="67" cy="10" r="1.5" fill="#3b82f6" />
        {/* Crown Red Velvet Cap Base */}
        <path d="M38 18H62V21H38V18Z" fill="#991b1b" stroke="#78350f" strokeWidth="1" />

        {/* King Face */}
        <circle cx="50" cy="28" r="9" fill="#fde68a" stroke="#1c1917" strokeWidth="1.5" />
        {/* Royal Full Beard & Mustache */}
        <path d="M42 28C42 40 46 44 50 44C54 44 58 40 58 28C56 32 53 34 50 34C47 34 44 32 42 28Z" fill="#78350f" stroke="#451a03" strokeWidth="1.2" />
        <path d="M45 29Q50 32 55 29" stroke="#451a03" strokeWidth="1.5" fill="none" />
        {/* Eyes & Nose */}
        <circle cx="47" cy="27" r="1" fill="#1c1917" />
        <circle cx="53" cy="27" r="1" fill="#1c1917" />
        <path d="M50 27V30" stroke="#78350f" strokeWidth="1" />

        {/* Magnificent Royal Mantle (Manto con Armiño) */}
        <path d="M28 36C22 55 18 85 20 110L80 110C82 85 78 55 72 36H28Z" fill={suit === 'oros' ? '#b91c1c' : suit === 'copas' ? '#1e3a8a' : suit === 'espadas' ? '#7f1d1d' : '#14532d'} stroke="#1c1917" strokeWidth="2" />
        {/* Ermine Collar & Trim (Blanco con motas negras) */}
        <path d="M32 36C32 46 42 50 50 50C58 50 68 46 68 36L62 34C58 42 54 44 50 44C46 44 42 42 38 34L32 36Z" fill="#ffffff" stroke="#1c1917" strokeWidth="1.2" />
        {/* Ermine black tail spots */}
        <path d="M44 45L45 47M50 46L50 48M56 45L55 47M40 39L41 41M60 39L59 41" stroke="#1c1917" strokeWidth="1.2" strokeLinecap="round" />

        {/* Inner Embroidered Royal Tunic */}
        <path d="M42 52L40 108H60L58 52H42Z" fill="#fbbf24" stroke="#78350f" strokeWidth="1.5" />
        {/* Golden Central Embroidery */}
        <line x1="50" y1="52" x2="50" y2="108" stroke="#b45309" strokeWidth="2" strokeDasharray="3 3" />
        {/* Royal Gold Chain Collar */}
        <ellipse cx="50" cy="54" rx="7" ry="2" fill="none" stroke="#ca8a04" strokeWidth="2" />

        {/* Golden Scepter in Left Hand */}
        <g transform="translate(68, 45)">
          <line x1="0" y1="0" x2="0" y2="40" stroke="#fbbf24" strokeWidth="2.5" />
          <circle cx="0" cy="0" r="3.5" fill="#f59e0b" stroke="#78350f" strokeWidth="1" />
          <path d="M-2 -3L0 -6L2 -3Z" fill="#ef4444" />
        </g>

        {/* Suit item held prominently by King in Right Hand */}
        {suit === 'oros' && (
          <g transform="translate(10, 40) scale(0.75)">
            <circle cx="24" cy="24" r="20" fill="url(#oro_base)" stroke="#78350f" strokeWidth="2" />
            <path d="M24 14L26 21L33 21L27.5 25L29.5 32L24 28L18.5 32L20.5 25L15 21L22 21Z" fill="#d97706" />
          </g>
        )}
        {suit === 'copas' && (
          <g transform="translate(10, 42) scale(0.75)">
            <path d="M12 12C12 12 16 10 24 10C32 10 36 12 36 12L34 23C34 29 29 33 24 33C19 33 14 29 14 23L12 12Z" fill="url(#copa_body)" stroke="#450a0a" strokeWidth="2" />
            <path d="M14 43C14 39 19 38 24 38C29 38 34 39 34 43H14Z" fill="url(#copa_foot)" stroke="#450a0a" strokeWidth="2" />
          </g>
        )}
        {suit === 'espadas' && (
          <g transform="translate(18, 30) scale(0.85)">
            <path d="M23 4L24 2L25 4L26 48H22L23 4Z" fill="url(#esp_blade)" stroke="#1e293b" strokeWidth="1.5" />
            <path d="M14 48H34V52H14Z" fill="#fbbf24" stroke="#78350f" strokeWidth="1.2" />
          </g>
        )}
        {suit === 'bastos' && (
          <g transform="translate(12, 34) scale(0.8)">
            <path d="M21 54L20 22C19 16 18 10 20 6C21 3 27 3 28 6C30 10 29 16 28 22L27 54H21Z" fill="url(#bas_wood)" stroke="#1c1917" strokeWidth="1.5" />
          </g>
        )}

        {/* Royal Hem Footing */}
        <ellipse cx="50" cy="114" rx="30" ry="4" fill="#000000" opacity="0.2" />
      </svg>
    );
  };

  // Court Figure Card Container
  const renderCourtFigure = () => {
    let figureTitle = 'SOTA';
    let figureDesc = 'Infante 10';

    if (number === 10) {
      figureTitle = 'SOTA';
      figureDesc = 'Infante';
    } else if (number === 11) {
      figureTitle = 'CABALLO';
      figureDesc = 'Caballero';
    } else if (number === 12) {
      figureTitle = 'REY';
      figureDesc = 'Monarca';
    }

    return (
      <div className="flex-1 w-full flex flex-col items-center justify-between p-0.5 sm:p-1 overflow-hidden">
        {/* Authentic Spanish Court Figure Artwork */}
        <div className="w-full flex-1 flex flex-col items-center justify-center relative my-0.5">
          {renderCourtFigureIllustration()}
        </div>

        {/* Figure Name Ribbon at bottom of frame */}
        <div className="w-full text-center pb-0.5">
          <span className="text-[7px] sm:text-[9px] font-mono font-black uppercase tracking-wider px-2 py-0.2 rounded-full bg-stone-900 text-amber-300 border border-stone-700 shadow-xs inline-block">
            {figureTitle} ({number})
          </span>
        </div>
      </div>
    );
  };

  // Layout for numbered cards (1..7)
  const renderPipsLayout = () => {
    if (number >= 10) return renderCourtFigure();

    if (number === 1) {
      return (
        <div className="flex-1 flex flex-col items-center justify-center py-1">
          <div className="scale-125 sm:scale-150 transform hover:scale-160 transition-transform">
            {renderSuitIcon(true)}
          </div>
          <div className="mt-1 px-2 py-0.5 rounded-full bg-stone-900 text-amber-300 font-serif font-black text-[8px] sm:text-[10px] tracking-widest shadow border border-amber-600/40">
            AS DE {suitTheme.name}
          </div>
        </div>
      );
    }

    if (number === 2) {
      return (
        <div className="flex-1 flex flex-col justify-around items-center py-1">
          {renderSuitIcon(false)}
          {renderSuitIcon(false)}
        </div>
      );
    }

    if (number === 3) {
      return (
        <div className="flex-1 flex flex-col justify-around items-center py-1">
          {renderSuitIcon(false)}
          {renderSuitIcon(false)}
          {renderSuitIcon(false)}
        </div>
      );
    }

    if (number === 4) {
      return (
        <div className="flex-1 grid grid-cols-2 gap-1.5 place-items-center p-1.5">
          {renderSuitIcon(false)}
          {renderSuitIcon(false)}
          {renderSuitIcon(false)}
          {renderSuitIcon(false)}
        </div>
      );
    }

    if (number === 5) {
      return (
        <div className="flex-1 grid grid-cols-2 gap-1 place-items-center p-1 relative">
          {renderSuitIcon(false)}
          {renderSuitIcon(false)}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            {renderSuitIcon(false)}
          </div>
          {renderSuitIcon(false)}
          {renderSuitIcon(false)}
        </div>
      );
    }

    if (number === 6) {
      return (
        <div className="flex-1 grid grid-cols-2 gap-1.5 place-items-center py-1">
          {renderSuitIcon(false)}
          {renderSuitIcon(false)}
          {renderSuitIcon(false)}
          {renderSuitIcon(false)}
          {renderSuitIcon(false)}
          {renderSuitIcon(false)}
        </div>
      );
    }

    if (number === 7) {
      return (
        <div className="flex-1 grid grid-cols-2 gap-1 place-items-center py-0.5 relative">
          {renderSuitIcon(false)}
          {renderSuitIcon(false)}
          {renderSuitIcon(false)}
          <div className="col-span-2 flex justify-center -my-1">
            {renderSuitIcon(false)}
          </div>
          {renderSuitIcon(false)}
          {renderSuitIcon(false)}
        </div>
      );
    }

    return null;
  };

  return (
    <div
      onClick={selectable ? onClick : undefined}
      className={`
        ${sizeClasses}
        relative rounded-xl border-[2.5px] border-stone-900 bg-[#fffef9] p-1 sm:p-1.5 shadow-lg
        flex flex-col justify-between select-none overflow-hidden transition-all duration-200
        ${selectable ? 'cursor-pointer hover:-translate-y-2 hover:shadow-2xl' : 'cursor-default'}
        ${selected ? '-translate-y-5 ring-4 ring-amber-400 border-amber-600 shadow-2xl scale-105' : ''}
        ${className}
      `}
    >
      {/* Traditional inner black frame with Pintas */}
      <div className="absolute inset-1 border border-stone-800 rounded pointer-events-none">
        {renderPintas()}
      </div>

      {/* Top Left Corner: Large Number & Suit Pip with label */}
      <div className="relative z-10 flex items-center justify-between leading-none px-0.5">
        <div className="flex items-center gap-1">
          <span className={`font-serif font-black text-sm sm:text-base md:text-lg ${suitTheme.cornerNum} drop-shadow-xs`}>
            {number}
          </span>
          <div className="scale-85 sm:scale-100">{renderSuitIcon(false)}</div>
        </div>

        {/* Suit name tag in corner so palos are immediately unmistakable */}
        <span className={`text-[7px] sm:text-[8px] font-mono font-black uppercase px-1 py-0.2 rounded border ${suitTheme.badgeBg}`}>
          {suitTheme.name}
        </span>
      </div>

      {/* Center Card Body */}
      <div className="relative z-10 flex-1 flex flex-col items-center justify-center my-0.5 overflow-hidden">
        {renderPipsLayout()}
      </div>

      {/* Bottom Right Corner: Inverted Number & Suit Pip */}
      <div className="relative z-10 flex items-center justify-between leading-none rotate-180 px-0.5">
        <div className="flex items-center gap-1">
          <span className={`font-serif font-black text-sm sm:text-base md:text-lg ${suitTheme.cornerNum}`}>
            {number}
          </span>
          <div className="scale-85 sm:scale-100">{renderSuitIcon(false)}</div>
        </div>
        <span className={`text-[7px] sm:text-[8px] font-mono font-black uppercase px-1 py-0.2 rounded border ${suitTheme.badgeBg}`}>
          {suitTheme.name}
        </span>
      </div>

      {/* Mus 8-Reyes Indicator (3=Rey, 2=As, 1=As, 12=Rey) */}
      {(number === 3 || number === 2 || number === 1 || number === 12) && (
        <div
          className={`absolute top-1 right-1 text-[7px] sm:text-[8px] font-mono font-black px-1.5 py-0.2 rounded shadow border z-20 ${
            number === 3 || number === 12
              ? 'bg-amber-400 text-stone-950 border-amber-700'
              : 'bg-emerald-600 text-white border-emerald-800'
          }`}
          title={number === 3 || number === 12 ? 'Cuenta como REY (10 puntos en juego)' : 'Cuenta como AS (1 punto en juego)'}
        >
          {number === 3 ? '★ REY' : number === 2 ? '★ AS' : number === 1 ? 'AS' : 'REY'}
        </div>
      )}

      {/* Discard selection overlay */}
      {selected && (
        <div className="absolute inset-0 bg-amber-500/20 rounded-xl flex items-center justify-center z-30 pointer-events-none">
          <span className="bg-red-600 text-white text-[9px] sm:text-xs font-black uppercase tracking-wider px-2 py-0.5 rounded shadow-lg border border-red-800 animate-pulse">
            Descartar
          </span>
        </div>
      )}
    </div>
  );
};
