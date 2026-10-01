import React, { useState, useRef, useLayoutEffect, useEffect } from 'react';
import { Player, LancePhase, LanceBetState, TeamScore, Seña, Card } from '../types';
import { GazeTarget, IntelState, SEAT_NAMES, señaShortLabel } from '../gazeSystem';
import { SeatedPlayer } from './SeatedPlayer';
import { CartoonPlayerHands } from './CartoonPlayerHands';
import { CharacterAvatar } from './CharacterAvatar';
import { FournierCard } from './FournierCard';
import { UserProfile } from '../userProfileEngine';
import tabernaLimpiaImg from '../assets/images/taberna_madrid_limpia_1790674574086.jpg';

interface TableProps {
  players: Player[]; // [South(0), East(1), North(2), West(3)]
  manoIndex: number;
  currentLanceName: string;
  phase: LancePhase;
  betState: LanceBetState;
  showAllCards?: boolean;
  onCardClick?: (index: number) => void;
  recentEvent?: string | null;
  scoreTeam0?: TeamScore;
  scoreTeam1?: TeamScore;
  targetPiedras?: number;
  onOpenUserControl?: () => void;
  activeUser?: UserProfile;
  gameSpeed?: 'tranquilo' | 'normal' | 'rapido';
  onChangeGameSpeed?: () => void;
  gazes?: GazeTarget[]; // gaze target per seat
  intel?: IntelState;
  onSetHumanGaze?: (target: GazeTarget) => void;
  validSeñas?: Seña[];
  señasEnabled?: boolean;
  onQuickSeña?: (seña: Seña) => void;
}

type Point = { x: number; y: number };

// Realistic 3D garbanzo / amarraco
const Garbanzo: React.FC<{ amarraco?: boolean; style?: React.CSSProperties }> = ({ amarraco = false, style }) => (
  <div
    style={style}
    className={`absolute rounded-full border border-stone-950/80 shadow-[1px_2px_3px_rgba(0,0,0,0.7)] ${
      amarraco
        ? 'w-4 h-4 sm:w-[18px] sm:h-[18px] bg-[radial-gradient(circle_at_35%_30%,#fde68a,#d97706_55%,#78350f)]'
        : 'w-3 h-3 sm:w-3.5 sm:h-3.5 bg-[radial-gradient(circle_at_35%_30%,#fef3c7,#e0b26a_55%,#8a5a1c)]'
    }`}
    title={amarraco ? 'Amarraco (5 piedras)' : 'Piedra'}
  />
);

// Deterministic scatter so stones don't jump around between renders
const scatter = (i: number, radius: number) => {
  const angle = i * 2.399963; // golden angle
  const r = radius * Math.sqrt((i + 0.5) / 14);
  return { left: `calc(50% + ${(Math.cos(angle) * r).toFixed(1)}px)`, top: `calc(50% + ${(Math.sin(angle) * r).toFixed(1)}px)` };
};

// A pile of stones on the felt (amarracos of 5 + loose piedras)
const StonePile: React.FC<{ count: number; radius?: number; className?: string; title?: string }> = ({
  count,
  radius = 22,
  className = '',
  title,
}) => {
  const amarracos = Math.min(6, Math.floor(count / 5));
  const singles = Math.min(10, count % 5 + (count >= 35 ? 5 : 0));
  const items = [...Array(amarracos).fill(true), ...Array(singles).fill(false)];
  return (
    <div className={`absolute w-14 h-14 -translate-x-1/2 -translate-y-1/2 ${className}`} title={title}>
      {items.map((am, i) => (
        <Garbanzo key={i} amarraco={am} style={{ ...scatter(i, radius), transform: 'translate(-50%,-50%)' }} />
      ))}
    </div>
  );
};

// Cards lying face down in front of a seat, rotated towards that player
const CardFan: React.FC<{ cards: Card[]; rotation: number; showAllCards: boolean }> = ({
  cards,
  rotation,
  showAllCards,
}) => (
  <div className="flex items-center justify-center -space-x-8 sm:-space-x-7" style={{ transform: `rotate(${rotation}deg)` }}>
    {cards.map((card, idx) => (
      <div
        key={card.id || idx}
        style={{ transform: `rotate(${[-9, -3, 3, 9][idx] || 0}deg) translateY(${[3, 0, 0, 3][idx] || 0}px)` }}
      >
        <FournierCard
          card={card}
          hidden={!showAllCards}
          size="sm"
          className="shadow-[0_3px_6px_rgba(0,0,0,0.65)] border border-stone-950"
        />
      </div>
    ))}
  </div>
);

export const Table: React.FC<TableProps> = ({
  players,
  manoIndex,
  currentLanceName,
  phase,
  betState,
  showAllCards = false,
  onCardClick,
  recentEvent,
  scoreTeam0,
  scoreTeam1,
  onOpenUserControl,
  activeUser,
  gameSpeed = 'tranquilo',
  onChangeGameSpeed,
  gazes = [-1, -1, -1, -1],
  intel = [{}, {}],
  onSetHumanGaze,
  validSeñas = [],
  señasEnabled = false,
  onQuickSeña,
}) => {
  // Head positions (relative to the table container) to draw the lines of sight
  const containerRef = useRef<HTMLDivElement | null>(null);
  const headEls = useRef<(HTMLDivElement | null)[]>([null, null, null, null]);
  const [headPoints, setHeadPoints] = useState<(Point | null)[]>([null, null, null, null]);
  const [size, setSize] = useState<{ w: number; h: number }>({ w: 1, h: 1 });
  const [, setResizeTick] = useState(0);

  useEffect(() => {
    const onResize = () => setResizeTick((t) => t + 1);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  useLayoutEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const base = container.getBoundingClientRect();
    const pts = headEls.current.map((el): Point | null => {
      if (!el) return null;
      const r = el.getBoundingClientRect();
      return { x: r.left - base.left + r.width / 2, y: r.top - base.top + r.height / 2 };
    });
    const same =
      pts.every((p, i) => {
        const q = headPoints[i];
        if (!p || !q) return p === q;
        return Math.abs(p.x - q.x) < 2 && Math.abs(p.y - q.y) < 2;
      }) &&
      Math.abs(base.width - size.w) < 2 &&
      Math.abs(base.height - size.h) < 2;
    if (!same) {
      setHeadPoints(pts);
      setSize({ w: base.width, h: base.height });
    }
  });

  const setHeadRef = (seat: number) => (el: HTMLDivElement | null) => {
    headEls.current[seat] = el;
  };

  const intelYourTeam = intel[0] || {};
  const intelRivals = intel[1] || {};
  const humanGaze = gazes[0] ?? -1;

  const isDiscardPhase = phase === 'discarding';
  const pSouth = players[0];
  const pEast = players[1];
  const pNorth = players[2];
  const pWest = players[3];

  // Traditional Spanish tavern night atmosphere
  const [isNight, setIsNight] = useState<boolean>(true);

  // Active dialogue across any player
  const activeSpeakingPlayer = players.find((p) => !!p.currentSpeech);

  const seatProps = (seat: 1 | 2 | 3) => ({
    seatIndex: seat,
    isMano: manoIndex === seat,
    gaze: gazes[seat] ?? -1,
    isWatchedByYou: humanGaze === seat,
    knownByYourTeam: intelYourTeam[seat] || [],
    knowsYourSeñas: seat === 2 ? [] : intelRivals[0] || [],
    onWatch: onSetHumanGaze ? () => onSetHumanGaze(humanGaze === seat ? -1 : seat) : undefined,
    headRef: setHeadRef(seat),
  });

  // Where the deck rests: in front of the mano
  const deckPosition = (
    {
      0: 'left-1/2 bottom-[17%] -translate-x-1/2',
      1: 'right-[22%] top-[62%]',
      2: 'left-1/2 top-[19%] -translate-x-1/2',
      3: 'left-[22%] top-[62%]',
    } as Record<number, string>
  )[manoIndex];

  const potStones = betState.isOrdago ? 14 : betState.currentBet;

  return (
    <div
      ref={containerRef}
      className="relative w-full max-w-5xl mx-auto my-1 rounded-3xl border-4 border-stone-900 shadow-2xl overflow-hidden select-none flex flex-col"
    >
      {/* 1. TAVERN BACKGROUND */}
      <div className="absolute inset-0 z-0 overflow-hidden">
        <img
          src={tabernaLimpiaImg}
          alt="Taberna Tradicional PC Mus"
          referrerPolicy="no-referrer"
          className="w-full h-full object-cover object-top pointer-events-none transition-all duration-700 blur-[1.5px] scale-105"
        />
        <div
          className={`absolute inset-0 pointer-events-none transition-colors duration-500 ${
            isNight
              ? 'bg-gradient-to-t from-stone-950/90 via-amber-950/35 to-black/60'
              : 'bg-gradient-to-t from-stone-950/65 via-black/10 to-black/35'
          }`}
        />
        {/* Warm pool of light from the lamp hanging over the table */}
        <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(ellipse_45%_55%_at_50%_48%,rgba(255,196,110,0.22),transparent_70%)]" />
      </div>

      {/* LINES OF SIGHT: who is looking at whom (red when someone is watching you) */}
      <svg
        className="absolute inset-0 z-[35] pointer-events-none"
        width={size.w}
        height={size.h}
        viewBox={`0 0 ${size.w} ${size.h}`}
      >
        {gazes.map((target, seat) => {
          const from = headPoints[seat];
          if (!from || target === -1) return null;
          const to = headPoints[target];
          if (!to) return null;
          const watchingYou = target === 0;
          const isHuman = seat === 0;
          const color = isHuman ? '#38bdf8' : watchingYou ? '#f43f5e' : seat % 2 === 0 ? '#34d399' : '#fb7185';
          const dx = to.x - from.x;
          const dy = to.y - from.y;
          const len = Math.hypot(dx, dy) || 1;
          const end = { x: to.x - (dx / len) * 34, y: to.y - (dy / len) * 34 };
          const start = { x: from.x + (dx / len) * 30, y: from.y + (dy / len) * 30 };
          return (
            <g key={seat}>
              <line
                x1={start.x}
                y1={start.y}
                x2={end.x}
                y2={end.y}
                stroke={color}
                strokeWidth={watchingYou || isHuman ? 2.5 : 1.5}
                strokeDasharray="6 5"
                strokeOpacity={watchingYou || isHuman ? 0.9 : 0.5}
              >
                <animate attributeName="stroke-dashoffset" from="22" to="0" dur="0.9s" repeatCount="indefinite" />
              </line>
              <circle cx={end.x} cy={end.y} r={3.5} fill={color} fillOpacity={0.9} />
            </g>
          );
        })}
      </svg>

      {/* 2. HUD (outside the table): settings · current lance & bet · AI profile */}
      <div className="relative z-40 flex flex-wrap items-center justify-between gap-1.5 px-2 sm:px-3 pt-2">
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => setIsNight(!isNight)}
            className="px-2.5 py-1 rounded-full bg-stone-950/85 hover:bg-stone-900 border border-amber-500/70 text-amber-200 font-mono text-[10px] sm:text-xs shadow-xl transition cursor-pointer"
            title="Cambiar atmósfera de iluminación"
          >
            {isNight ? '🌙' : '☀️'}
            <span className="hidden sm:inline"> {isNight ? 'Noche' : 'Tarde'}</span>
          </button>
          {onChangeGameSpeed && (
            <button
              type="button"
              onClick={onChangeGameSpeed}
              className="px-2.5 py-1 rounded-full bg-stone-950/90 hover:bg-stone-900 border border-amber-500/80 text-amber-300 font-mono text-[10px] sm:text-xs shadow-xl transition cursor-pointer"
              title="Cambiar velocidad de la partida"
            >
              {gameSpeed === 'tranquilo' ? '🐢' : gameSpeed === 'normal' ? '⚖️' : '⚡'}
              <span className="hidden sm:inline capitalize"> {gameSpeed === 'tranquilo' ? 'Pausado' : gameSpeed}</span>
            </button>
          )}
        </div>

        <div className="flex items-center gap-1.5 order-last sm:order-none w-full sm:w-auto justify-center">
          <div className="bg-blue-950/90 border-2 border-yellow-400 px-3 py-0.5 rounded-xl shadow-lg text-center">
            <span className="text-[8px] uppercase tracking-widest text-amber-200 font-mono font-black mr-1.5">Lance</span>
            <span className="text-xs sm:text-sm uppercase text-white font-serif font-black">{currentLanceName}</span>
          </div>
          {betState.currentBet > 0 && (
            <div className="bg-amber-400 text-stone-950 px-2.5 py-0.5 rounded-full border-2 border-stone-950 font-mono font-black text-[10px] sm:text-xs shadow flex items-center gap-1">
              {betState.isOrdago ? '🔥 ÓRDAGO' : `🪙 ${betState.currentBet} piedras`}
              {betState.accepted && (
                <span className="bg-emerald-700 text-white text-[8px] px-1 rounded uppercase">Quiero</span>
              )}
            </div>
          )}
        </div>

        {onOpenUserControl && (
          <button
            type="button"
            onClick={onOpenUserControl}
            className="px-2.5 py-1 rounded-full bg-stone-950/90 hover:bg-stone-900 border border-amber-500/80 text-amber-300 font-mono text-[10px] sm:text-xs shadow-xl transition cursor-pointer flex items-center gap-1"
            title="Abrir panel de control de usuarios y análisis táctico de la IA"
          >
            🧠<span className="hidden sm:inline">IA:</span>
            <span className="text-white font-bold max-w-[70px] sm:max-w-[110px] truncate">{activeUser?.name || 'Tú'}</span>
          </button>
        )}
      </div>

      {/* 3. DIALOGUE / EVENT TICKER (outside the table, never covering it) */}
      <div className="relative z-40 flex justify-center px-2 pt-1.5 min-h-[30px]">
        {activeSpeakingPlayer && activeSpeakingPlayer.currentSpeech ? (
          <div className="bg-stone-950/95 border-2 border-amber-400 text-amber-100 px-3 py-0.5 rounded-full text-[11px] sm:text-xs font-mono font-bold shadow-2xl flex items-center gap-2 max-w-full pointer-events-none">
            <span className="text-amber-400 font-serif font-black shrink-0">💬 {activeSpeakingPlayer.name}:</span>
            <span className="text-white truncate">"{activeSpeakingPlayer.currentSpeech}"</span>
          </div>
        ) : recentEvent ? (
          <div className="bg-black/65 border border-amber-500/30 text-amber-200/90 px-3 py-0.5 rounded-full text-[10px] sm:text-[11px] font-mono shadow truncate max-w-full">
            {recentEvent}
          </div>
        ) : null}
      </div>

      {/* 4. THE ROOM: West | (North + vertical table) | East */}
      <div className="relative z-20 grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-0.5 sm:gap-2 px-1 sm:px-4 pt-1">
        {/* WEST */}
        <div className="flex justify-end">
          {pWest && <SeatedPlayer player={pWest} seatPosition="west" {...seatProps(3)} />}
        </div>

        {/* CENTER COLUMN */}
        <div className="flex flex-col items-center">
          {pNorth && (
            <div className="relative z-10 -mb-3">
              <SeatedPlayer player={pNorth} seatPosition="north" {...seatProps(2)} />
            </div>
          )}

          {/* VERTICAL MUS TABLE: wooden rail + green baize, slightly tilted for perspective */}
          <div className="relative" style={{ perspective: '900px' }}>
            {/* Floor shadow */}
            <div className="absolute -inset-x-4 -bottom-5 h-16 rounded-[50%] bg-black/60 blur-xl" />
            <div
              className="relative w-[min(44vw,210px)] sm:w-[270px] md:w-[310px] aspect-[3/4] rounded-[48%/40%] p-[10px] sm:p-[14px] shadow-[0_18px_30px_rgba(0,0,0,0.75)]"
              style={{
                transform: 'rotateX(10deg)',
                transformOrigin: '50% 60%',
                background:
                  'repeating-linear-gradient(100deg, rgba(0,0,0,0.12) 0px, rgba(0,0,0,0.12) 2px, transparent 2px, transparent 9px), linear-gradient(160deg, #8a4b1f 0%, #5c2d0e 45%, #3b1b07 100%)',
              }}
            >
              {/* Rail highlight */}
              <div className="absolute inset-[3px] rounded-[48%/40%] border border-amber-300/30 pointer-events-none" />
              {/* Felt */}
              <div
                className="relative w-full h-full rounded-[46%/38%] overflow-hidden shadow-[inset_0_0_28px_rgba(0,0,0,0.75),inset_0_0_4px_rgba(0,0,0,0.9)]"
                style={{
                  background:
                    'radial-gradient(ellipse 70% 55% at 50% 45%, #2f8a52 0%, #1f6a3c 55%, #134a29 100%)',
                }}
              >
                {/* Baize fibre texture */}
                <div
                  className="absolute inset-0 opacity-25 mix-blend-overlay pointer-events-none"
                  style={{
                    backgroundImage:
                      'repeating-linear-gradient(45deg, rgba(255,255,255,0.08) 0 1px, transparent 1px 3px), repeating-linear-gradient(-45deg, rgba(0,0,0,0.12) 0 1px, transparent 1px 3px)',
                  }}
                />
                {/* Lamp reflection */}
                <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(ellipse_40%_30%_at_50%_42%,rgba(255,230,170,0.22),transparent_70%)]" />
                {/* Stitched inner line */}
                <div className="absolute inset-[7%] rounded-[46%/38%] border border-dashed border-emerald-200/15 pointer-events-none" />

                {/* North's cards */}
                {pNorth && (
                  <div className="absolute left-1/2 top-[3%] -translate-x-1/2 scale-[0.8] sm:scale-100 origin-top">
                    <CardFan cards={pNorth.cards} rotation={180} showAllCards={showAllCards} />
                  </div>
                )}
                {/* West's cards */}
                {pWest && (
                  <div className="absolute left-[-6%] sm:left-[-2%] top-1/2 -translate-y-1/2 scale-[0.75] sm:scale-100">
                    <CardFan cards={pWest.cards} rotation={90} showAllCards={showAllCards} />
                  </div>
                )}
                {/* East's cards */}
                {pEast && (
                  <div className="absolute right-[-6%] sm:right-[-2%] top-1/2 -translate-y-1/2 scale-[0.75] sm:scale-100">
                    <CardFan cards={pEast.cards} rotation={-90} showAllCards={showAllCards} />
                  </div>
                )}

                {/* Deck resting in front of the mano */}
                <div className={`absolute ${deckPosition} transition-all duration-700`} title="Baraja Española de 40 naipes">
                  <div className="relative w-7 h-10 sm:w-8 sm:h-12 rotate-[-14deg]">
                    {[3, 2, 1, 0].map((o) => (
                      <div
                        key={o}
                        className="absolute inset-0 rounded-md border border-stone-950 bg-gradient-to-br from-red-800 to-red-950 shadow-[1px_2px_3px_rgba(0,0,0,0.6)]"
                        style={{ transform: `translate(${o * 1}px, ${-o * 1.2}px)` }}
                      >
                        <div className="absolute inset-0.5 rounded border border-amber-400/40" />
                      </div>
                    ))}
                  </div>
                </div>

                {/* Pot: the stones at stake in the current lance */}
                <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2" title={betState.currentBet > 0 ? `En juego: ${betState.isOrdago ? 'Órdago' : betState.currentBet + ' piedras'}` : 'Bote vacío'}>
                  <div className="relative w-11 h-11 sm:w-20 sm:h-20 rounded-full bg-[radial-gradient(circle_at_40%_35%,#7a4a22,#4a2a10_70%)] border-2 border-[#2b1606] shadow-[inset_0_3px_8px_rgba(0,0,0,0.7),0_3px_6px_rgba(0,0,0,0.5)]">
                    <StonePile count={potStones} radius={14} className="left-1/2 top-1/2" />
                    {betState.isOrdago && (
                      <span className="absolute inset-0 flex items-center justify-center text-2xl animate-pulse">🔥</span>
                    )}
                  </div>
                </div>

                {/* Each team's stones, next to its players */}
                <StonePile
                  count={scoreTeam0?.piedras || 0}
                  className="left-[70%] top-[80%]"
                  title={`Piedras de tu pareja: ${scoreTeam0?.piedras || 0}`}
                />
                <StonePile
                  count={scoreTeam1?.piedras || 0}
                  className="left-[30%] top-[22%]"
                  title={`Piedras rivales: ${scoreTeam1?.piedras || 0}`}
                />
              </div>
            </div>
          </div>
        </div>

        {/* EAST */}
        <div className="flex justify-start">
          {pEast && <SeatedPlayer player={pEast} seatPosition="east" {...seatProps(1)} />}
        </div>
      </div>

      {/* 5. SOUTH: your hand rests over the near edge of the table */}
      {pSouth && (
        <div className="relative z-30 -mt-3 sm:-mt-5 flex flex-col items-center">
          <CartoonPlayerHands
            cards={pSouth.cards}
            selectedIndices={pSouth.selectedToDiscard}
            isDiscardPhase={isDiscardPhase}
            onCardClick={onCardClick}
          />
        </div>
      )}

      {/* 6. YOUR SEAT PANEL (below the table): you, your eyes and your señas */}
      {pSouth && (
        <div className="relative z-40 flex flex-col items-center gap-1 px-2 pb-2">
          <div className="flex flex-wrap items-center justify-center gap-1.5 bg-stone-950/90 border border-sky-600/60 rounded-2xl px-2 py-1 shadow-lg max-w-full">
            <div className="relative shrink-0" ref={setHeadRef(0)}>
              <CharacterAvatar
                characterId={activeUser?.avatarId || pSouth.id}
                characterName={activeUser?.name || pSouth.name}
                size="sm"
                isSpeaking={!!pSouth.currentSpeech}
                className="ring-2 ring-stone-900"
              />
              {manoIndex === 0 && (
                <span
                  className="absolute -top-1.5 -left-1.5 w-5 h-5 rounded-full bg-amber-400 text-stone-950 font-mono font-black text-[10px] flex items-center justify-center shadow-lg border-2 border-stone-950"
                  title="Mano de la ronda de Mus"
                >
                  M
                </span>
              )}
            </div>
            {onSetHumanGaze && (
              <>
                <span className="text-[10px] font-mono font-black text-sky-300">👀 Mirar a:</span>
                {([3, 2, 1, -1] as GazeTarget[]).map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => onSetHumanGaze(t)}
                    className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold border transition cursor-pointer ${
                      humanGaze === t
                        ? 'bg-sky-500 text-stone-950 border-sky-300'
                        : 'bg-stone-900 text-stone-300 border-stone-700 hover:border-sky-400'
                    }`}
                  >
                    {t === -1
                      ? '🃏 Mis cartas'
                      : t === 2
                      ? `🤝 ${players[2]?.name || 'Norte'}`
                      : `${t === 3 ? '⬅️' : '➡️'} ${players[t]?.name || SEAT_NAMES[t]}`}
                  </button>
                ))}
              </>
            )}
          </div>

          {onSetHumanGaze &&
            (() => {
              const watchers = [1, 3].filter((s) => gazes[s] === 0);
              const partnerLooking = gazes[2] === 0;
              return (
                <div className="flex flex-wrap items-center justify-center gap-1 bg-stone-950/90 border border-amber-600/60 rounded-2xl px-2 py-1 shadow-lg max-w-full">
                  <span
                    className={`text-[10px] font-mono font-black px-1.5 py-0.5 rounded-full ${
                      partnerLooking ? 'bg-emerald-600 text-white' : 'bg-stone-800 text-stone-400'
                    }`}
                  >
                    {partnerLooking ? '🤝 Tu compañero te mira' : '🤝 Tu compañero no te mira'}
                  </span>
                  <span
                    className={`text-[10px] font-mono font-black px-1.5 py-0.5 rounded-full ${
                      watchers.length ? 'bg-rose-600 text-white animate-pulse' : 'bg-stone-800 text-stone-400'
                    }`}
                  >
                    {watchers.length
                      ? `👁️ Te vigila: ${watchers.map((s) => players[s]?.name).join(' y ')}`
                      : '😎 Ningún rival te mira'}
                  </span>
                  {onQuickSeña &&
                    (señasEnabled && validSeñas.length > 0 ? (
                      validSeñas.map((seña) => (
                        <button
                          key={seña.id}
                          type="button"
                          onClick={() => onQuickSeña(seña)}
                          className="px-2 py-0.5 rounded-lg text-[10px] font-mono font-black bg-amber-500 hover:bg-amber-400 text-stone-950 border border-stone-950 shadow cursor-pointer active:scale-95"
                          title={`${seña.gesture} — ${seña.meaning}`}
                        >
                          🤫 {señaShortLabel(seña.id)}
                        </button>
                      ))
                    ) : (
                      <span className="text-[10px] font-mono text-stone-500 italic">
                        {señasEnabled ? 'Sin jugada para señas' : 'Señas no disponibles ahora'}
                      </span>
                    ))}
                </div>
              );
            })()}

          {((intelYourTeam[0] || []).length > 0 || (intelRivals[0] || []).length > 0) && (
            <div className="flex flex-wrap justify-center gap-1">
              {(intelYourTeam[0] || []).length > 0 && (
                <span className="text-[9px] font-mono font-black px-1.5 py-0.5 rounded-full bg-emerald-900/90 text-emerald-200 border border-emerald-500/60">
                  🤝 Tu compañero sabe: {(intelYourTeam[0] || []).map(señaShortLabel).join(' · ')}
                </span>
              )}
              {(intelRivals[0] || []).length > 0 && (
                <span className="text-[9px] font-mono font-black px-1.5 py-0.5 rounded-full bg-rose-950/90 text-rose-200 border border-rose-500/60">
                  ⚠️ Los rivales saben: {(intelRivals[0] || []).map(señaShortLabel).join(' · ')}
                </span>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
