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
    sm: 'w-10 h-15 text-[10px]',
    md: 'w-16 h-24 text-xs',
    lg: 'w-20 h-30 text-sm',
    hand: 'w-22 h-34 sm:w-26 sm:h-40 md:w-28 md:h-44 text-sm sm:text-base',
  }[size];

  // Card Back (Reverso tradicional de Naipes Fournier rojo con orla geométrica)
  if (hidden || !card) {
    return (
      <div
        className={`
          ${sizeClasses}
          relative rounded-lg border-2 border-stone-900 bg-white p-1 shadow-md
          flex items-center justify-center select-none overflow-hidden transition-transform
          ${className}
        `}
      >
        <div className="w-full h-full rounded border-2 border-red-700 bg-red-800 relative overflow-hidden flex items-center justify-center">
          {/* Authentic red crosshatch and diamond pattern */}
          <div
            className="absolute inset-0 opacity-40"
            style={{
              backgroundImage: `repeating-linear-gradient(45deg, #7f1d1d 0, #7f1d1d 2px, transparent 0, transparent 8px),
                                repeating-linear-gradient(-45deg, #7f1d1d 0, #7f1d1d 2px, transparent 0, transparent 8px)`,
            }}
          />
          {/* Inner medallion */}
          <div className="relative z-10 w-8 h-8 rounded-full border-2 border-amber-300 bg-red-900 flex items-center justify-center shadow">
            <span className="font-serif font-black text-[9px] text-amber-300 tracking-tighter">
              MUS
            </span>
          </div>
        </div>
      </div>
    );
  }

  const { suit, number } = card;

  // Number label
  const numStr = `${number}`;

  // Pintas en la orla tradicional española:
  // Oros: sin corte (0)
  // Copas: un corte (1)
  // Espadas: dos cortes (2)
  // Bastos: tres cortes (3)
  const renderPintas = () => {
    if (suit === 'copas') {
      return (
        <>
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1.5 h-0.5 bg-[#fffdfa]" />
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-1.5 h-0.5 bg-[#fffdfa]" />
        </>
      );
    }
    if (suit === 'espadas') {
      return (
        <>
          <div className="absolute top-0 left-1/3 -translate-x-1/2 w-1 h-0.5 bg-[#fffdfa]" />
          <div className="absolute top-0 left-2/3 -translate-x-1/2 w-1 h-0.5 bg-[#fffdfa]" />
          <div className="absolute bottom-0 left-1/3 -translate-x-1/2 w-1 h-0.5 bg-[#fffdfa]" />
          <div className="absolute bottom-0 left-2/3 -translate-x-1/2 w-1 h-0.5 bg-[#fffdfa]" />
        </>
      );
    }
    if (suit === 'bastos') {
      return (
        <>
          <div className="absolute top-0 left-1/4 -translate-x-1/2 w-1 h-0.5 bg-[#fffdfa]" />
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1 h-0.5 bg-[#fffdfa]" />
          <div className="absolute top-0 left-3/4 -translate-x-1/2 w-1 h-0.5 bg-[#fffdfa]" />
          <div className="absolute bottom-0 left-1/4 -translate-x-1/2 w-1 h-0.5 bg-[#fffdfa]" />
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-1 h-0.5 bg-[#fffdfa]" />
          <div className="absolute bottom-0 left-3/4 -translate-x-1/2 w-1 h-0.5 bg-[#fffdfa]" />
        </>
      );
    }
    return null;
  };

  // Render authentic Spanish symbols
  const renderSymbol = (isBig = false) => {
    const scale = isBig ? 'w-8 h-8 sm:w-10 sm:h-10' : 'w-3 h-3 sm:w-4 sm:h-4';

    if (suit === 'oros') {
      return (
        <div
          className={`${scale} rounded-full bg-gradient-to-br from-yellow-300 via-amber-400 to-amber-600 border border-amber-950 flex items-center justify-center shadow-xs`}
        >
          <div className="w-3/4 h-3/4 rounded-full border border-amber-800 flex items-center justify-center bg-amber-400/80">
            <span className="text-[8px] font-black text-amber-950 font-serif leading-none">★</span>
          </div>
        </div>
      );
    }

    if (suit === 'copas') {
      return (
        <div className={`${scale} flex flex-col items-center justify-center`}>
          <div className="w-4/5 h-1/2 bg-gradient-to-b from-amber-400 to-red-600 border border-stone-900 rounded-t-sm shadow-xs flex items-center justify-center">
            <div className="w-1.5 h-1.5 rounded-full bg-red-400" />
          </div>
          <div className="w-1.5 h-2 bg-amber-600 border-x border-stone-900" />
          <div className="w-full h-1.5 bg-gradient-to-r from-amber-500 via-amber-300 to-amber-600 border border-stone-900 rounded-b-xs" />
        </div>
      );
    }

    if (suit === 'espadas') {
      return (
        <div className={`${scale} flex flex-col items-center justify-center relative`}>
          {/* Blade */}
          <div className="w-1 h-3/4 bg-gradient-to-r from-blue-100 via-sky-300 to-blue-400 border border-stone-900 rounded-t-full shadow-xs" />
          {/* Crossguard */}
          <div className="w-full h-1 bg-amber-500 border border-stone-900 rounded-full my-0.5" />
          {/* Pommel */}
          <div className="w-1.5 h-1.5 rounded-full bg-amber-600 border border-stone-900" />
        </div>
      );
    }

    // Bastos
    return (
      <div className={`${scale} flex flex-col items-center justify-center relative`}>
        <div className="w-2 h-4/5 bg-gradient-to-b from-emerald-700 via-amber-900 to-amber-950 border border-stone-900 rounded-full shadow-xs relative">
          <div className="absolute -left-1 top-1 w-1.5 h-1 rounded-full bg-emerald-500 border border-stone-900" />
          <div className="absolute -right-1 bottom-1 w-1.5 h-1 rounded-full bg-emerald-500 border border-stone-900" />
        </div>
      </div>
    );
  };

  // Render Court Figures (10 Sota, 11 Caballo, 12 Rey)
  const renderCourtFigure = () => {
    let title = '';
    let subtitle = '';
    let badgeBg = '';

    if (number === 10) {
      title = 'SOTA';
      subtitle = 'INFANTE';
      badgeBg = 'bg-blue-800 text-blue-100';
    } else if (number === 11) {
      title = 'CABALLO';
      subtitle = 'CABALLERO';
      badgeBg = 'bg-emerald-800 text-emerald-100';
    } else if (number === 12) {
      title = 'REY';
      subtitle = 'MONARCA';
      badgeBg = 'bg-red-800 text-red-100';
    }

    return (
      <div className="flex-1 w-full flex flex-col items-center justify-center p-0.5">
        <div className="w-full h-full border border-stone-400 rounded bg-stone-50 flex flex-col items-center justify-between p-1 relative overflow-hidden">
          {/* Authentic Figure Icon illustration */}
          <div className="text-xl sm:text-2xl mt-0.5">
            {number === 10 && '🤺'}
            {number === 11 && '🐎'}
            {number === 12 && '👑'}
          </div>

          <div className="flex items-center gap-1 my-0.5">
            {renderSymbol(false)}
            <span className={`text-[8px] font-black uppercase px-1 py-0.2 rounded font-mono ${badgeBg}`}>
              {title}
            </span>
          </div>

          <span className="text-[7px] font-bold text-stone-500 font-serif leading-none">
            {subtitle}
          </span>
        </div>
      </div>
    );
  };

  // Render Pips based on traditional Spanish arrangement
  const renderPipsLayout = () => {
    if (number >= 10) {
      return renderCourtFigure();
    }

    if (number === 1) {
      return (
        <div className="flex-1 flex flex-col items-center justify-center">
          <div className="scale-125 sm:scale-150">{renderSymbol(true)}</div>
          <span className="text-[8px] font-serif font-black text-stone-600 mt-1 uppercase tracking-widest">
            AS
          </span>
        </div>
      );
    }

    if (number === 2) {
      return (
        <div className="flex-1 flex flex-col justify-between items-center py-2">
          {renderSymbol(false)}
          {renderSymbol(false)}
        </div>
      );
    }

    if (number === 3) {
      return (
        <div className="flex-1 flex flex-col justify-between items-center py-1.5">
          {renderSymbol(false)}
          {renderSymbol(false)}
          {renderSymbol(false)}
        </div>
      );
    }

    if (number === 4) {
      return (
        <div className="flex-1 grid grid-cols-2 gap-1 place-items-center p-1">
          {renderSymbol(false)}
          {renderSymbol(false)}
          {renderSymbol(false)}
          {renderSymbol(false)}
        </div>
      );
    }

    if (number === 5) {
      return (
        <div className="flex-1 grid grid-cols-2 gap-0.5 place-items-center p-1 relative">
          {renderSymbol(false)}
          {renderSymbol(false)}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            {renderSymbol(false)}
          </div>
          {renderSymbol(false)}
          {renderSymbol(false)}
        </div>
      );
    }

    if (number === 6) {
      return (
        <div className="flex-1 grid grid-cols-2 gap-1 place-items-center py-1">
          {renderSymbol(false)}
          {renderSymbol(false)}
          {renderSymbol(false)}
          {renderSymbol(false)}
          {renderSymbol(false)}
          {renderSymbol(false)}
        </div>
      );
    }

    if (number === 7) {
      return (
        <div className="flex-1 grid grid-cols-2 gap-0.5 place-items-center py-0.5 relative">
          {renderSymbol(false)}
          {renderSymbol(false)}
          {renderSymbol(false)}
          <div className="col-span-2 flex justify-center -my-0.5">
            {renderSymbol(false)}
          </div>
          {renderSymbol(false)}
          {renderSymbol(false)}
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
        relative rounded-lg border-2 border-stone-900 bg-[#fffdfa] p-1 shadow-md
        flex flex-col justify-between select-none overflow-hidden transition-all duration-200
        ${selectable ? 'cursor-pointer hover:-translate-y-2 hover:shadow-xl' : 'cursor-default'}
        ${selected ? '-translate-y-4 ring-4 ring-amber-400 border-amber-600 shadow-2xl scale-105' : ''}
        ${className}
      `}
    >
      {/* Traditional inner black frame with Pintas */}
      <div className="absolute inset-0.5 border border-stone-800 rounded pointer-events-none">
        {renderPintas()}
      </div>

      {/* Top Left corner: Number & small suit */}
      <div className="relative z-10 flex items-center justify-between leading-none">
        <span className="font-serif font-black text-stone-950 text-xs sm:text-sm">
          {numStr}
        </span>
        <div className="scale-75">{renderSymbol(false)}</div>
      </div>

      {/* Center card body with pips or court figure */}
      <div className="relative z-10 flex-1 flex flex-col items-center justify-center my-0.5">
        {renderPipsLayout()}
      </div>

      {/* Bottom Right corner: Inverted Number & small suit */}
      <div className="relative z-10 flex items-center justify-between leading-none rotate-180">
        <span className="font-serif font-black text-stone-950 text-xs sm:text-sm">
          {numStr}
        </span>
        <div className="scale-75">{renderSymbol(false)}</div>
      </div>

      {/* Mus Rank 8-Reyes Indicator (3=Rey, 2=As) */}
      {(number === 3 || number === 2) && (
        <div className="absolute top-1 right-1 bg-amber-400 text-stone-950 text-[7px] sm:text-[8px] font-black px-1 rounded-sm border border-stone-900 shadow-xs z-20">
          {number === 3 ? 'REY' : 'AS'}
        </div>
      )}

      {/* Discard selection overlay */}
      {selected && (
        <div className="absolute inset-0 bg-amber-500/25 rounded-lg flex items-center justify-center z-30 pointer-events-none">
          <span className="bg-red-600 text-white text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded shadow border border-red-800">
            Descarte
          </span>
        </div>
      )}
    </div>
  );
};
