import React, { useState, useEffect, useRef } from 'react';
import {
  Card,
  Player,
  TeamScore,
  LancePhase,
  LanceBetState,
  BetHistoryItem,
  GameMode,
  TournamentMatch,
  Seña,
  GameLogEntry,
  NetAction,
} from './types';
import { PC_MUS_CHARACTERS, CharacterInfo, CAMEOS, Cameo, getCharacterLine } from './characters';
import {
  createDeck,
  evaluatePares,
  getHandSum,
  getWinningTeamForLance,
  describeParesHand,
  describeJuegoHand,
} from './musLogic';
import {
  decideMusOrNoMus,
  getAIDiscardIndices,
  decideLanceAction,
} from './aiPlayer';
import { sound } from './sound';
import { voiceEngine } from './voiceEngine';
import { Table } from './components/Table';
import { Tanteador } from './components/Tanteador';
import { Controls } from './components/Controls';
import { CharacterSelect } from './components/CharacterSelect';
import { TournamentBracket } from './components/TournamentBracket';
import { SeñasModal } from './components/SeñasModal';
import { CameoBanner } from './components/CameoBanner';
import { RulesModal } from './components/RulesModal';
import { RetroDosOverlay } from './components/RetroDosOverlay';
import { MultiplayerLobby } from './components/MultiplayerLobby';
import { InteractiveTutorial } from './components/InteractiveTutorial';
import { MultiplayerChatModal } from './components/MultiplayerChatModal';
import { UserControlModal } from './components/UserControlModal';
import { userProfileEngine, UserProfile } from './userProfileEngine';
import { multiplayerService } from './multiplayer/multiplayerService';
import { TableSnapshot, toAbsolute, toLocal, absoluteSeat, localSeat as toLocalSeat } from './multiplayer/netSync';
import { SEÑAS } from './musLogic';
import { MultiplayerRoom } from './types';
import { getMusRank } from './musLogic';
import { RecuentoOverlay } from './components/RecuentoOverlay';
import { computeHandRecountPlan, HandRecountPlan } from './recuentoCalculator';
import {
  GazeTarget,
  IntelState,
  emptyIntel,
  addIntel,
  pickNextGaze,
  randomGazeDuration,
  getValidSeñas,
  partnerOf,
  opponentsOf,
  señaShortLabel,
} from './gazeSystem';

// Fisher–Yates shuffle (discard pile recycling, tournament rival draw)
function shuffleArray<T>(items: T[]): T[] {
  const out = [...items];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

// Phases in which señas can be passed around the table
const SEÑA_PHASES: LancePhase[] = [
  'mus_dialog',
  'discarding',
  'grande',
  'chica',
  'pares_precheck',
  'pares_bet',
  'juego_precheck',
  'juego_bet',
  'punto_bet',
];

export default function App() {
  // Screen views: 'select' | 'bracket' | 'game' | 'multiplayer' | 'tutorial'
  const [view, setView] = useState<'select' | 'bracket' | 'game' | 'multiplayer' | 'tutorial'>('select');
  const [gameMode, setGameMode] = useState<GameMode>('torneo');
  const [targetPiedras, setTargetPiedras] = useState<number>(40);
  const [crtEnabled, setCrtEnabled] = useState<boolean>(false);
  const [rulesOpen, setRulesOpen] = useState<boolean>(false);
  const [señasOpen, setSeñasOpen] = useState<boolean>(false);
  const [userControlOpen, setUserControlOpen] = useState<boolean>(false);
  const [activeUser, setActiveUser] = useState<UserProfile>(userProfileEngine.getActiveUser());

  useEffect(() => {
    const unsub = userProfileEngine.subscribe(() => {
      setActiveUser(userProfileEngine.getActiveUser());
    });
    return () => unsub();
  }, []);

  // Multiplayer state
  const [multiplayerRoom, setMultiplayerRoom] = useState<MultiplayerRoom | null>(null);
  const [localSeatIndex, setLocalSeatIndex] = useState<number>(0);
  // Online roles: the host's browser runs the game; clients mirror it and send their moves
  const [netRole, setNetRole] = useState<'none' | 'host' | 'client'>('none');
  const netRoleRef = useRef<'none' | 'host' | 'client'>('none');
  netRoleRef.current = netRole;
  const mySeatRef = useRef<number>(0); // my absolute seat in the room
  // Engine seats played by people (0 = you; online, also the other humans at the table)
  const [humanSeats, setHumanSeats] = useState<number[]>([0]);
  const humanSeatsRef = useRef<Set<number>>(new Set([0]));
  humanSeatsRef.current = new Set(humanSeats);
  // Seats that have chosen their discards (the deal waits for every human)
  const [discardReady, setDiscardReady] = useState<number[]>([]);
  const discardReadyRef = useRef<number[]>([]);
  discardReadyRef.current = discardReady;
  const [clientSelection, setClientSelection] = useState<number[]>([]);
  const clientSelectionRef = useRef<number[]>([]);
  clientSelectionRef.current = clientSelection;
  const [netNotice, setNetNotice] = useState<string | null>(null);
  const appliedVersionRef = useRef<number>(0);
  const lastActionSeqRef = useRef<number>(0);
  const handNumberRef = useRef<number>(0);
  const [clientBusy, setClientBusy] = useState<boolean>(false);
  // Guest: a move sent and not yet reflected by the host (avoids double moves)
  const pendingMoveRef = useRef<{ phase: LancePhase; turn: number; at: number } | null>(null);
  const discardSentRef = useRef<boolean>(false);
  const [chatModalOpen, setChatModalOpen] = useState<boolean>(false);

  // Tournament progression (3 rounds)
  const [tournamentRound, setTournamentRound] = useState<number>(0);
  const [tournamentMatches, setTournamentMatches] = useState<TournamentMatch[]>([
    { roundName: 'Cuartos de Final', rivals: ['Tío Mateo', 'Cabo Don Luis'], defeated: false, current: true },
    { roundName: 'Semifinales', rivals: ['El Isidoro', 'Doña Norma'], defeated: false, current: false },
    { roundName: 'Gran Final', rivals: ['El Marqués', 'Señorita Rosa'], defeated: false, current: false },
  ]);

  // Active Players & Scores
  const [players, setPlayers] = useState<Player[]>([]);
  const [manoIndex, setManoIndex] = useState<number>(0);
  const [scoreTeam0, setScoreTeam0] = useState<TeamScore>({ piedras: 0, juegosWon: 0 });
  const [scoreTeam1, setScoreTeam1] = useState<TeamScore>({ piedras: 0, juegosWon: 0 });

  // Current Hand State
  const [deck, setDeck] = useState<Card[]>([]);
  const [phase, setPhase] = useState<LancePhase>('dealing');
  const [currentTurn, setCurrentTurn] = useState<number>(0); // 0..3 seat index
  const [showAllCards, setShowAllCards] = useState<boolean>(false);
  const [recentEvent, setRecentEvent] = useState<string | null>('Repartiendo naipes...');
  const [cameo, setCameo] = useState<Cameo | null>(null);
  const [activeCameoType, setActiveCameoType] = useState<string>('ordago');
  const [gameSpeed, setGameSpeed] = useState<'tranquilo' | 'normal' | 'rapido'>('tranquilo');
  const [recountPlan, setRecountPlan] = useState<HandRecountPlan | null>(null);
  const isScoringRef = React.useRef<boolean>(false);
  const handWonRef = React.useRef<boolean>(false);
  const isTransitioningRef = React.useRef<boolean>(false);
  const pendingTimersRef = React.useRef<number[]>([]);
  // Mirrors isTransitioningRef so the UI can lock the buttons during transitions
  const [isTransitioning, setIsTransitioningState] = useState<boolean>(false);
  const transitionEndAtRef = React.useRef<number>(0);
  const setTransitioning = (value: boolean) => {
    isTransitioningRef.current = value;
    if (!value) transitionEndAtRef.current = Date.now();
    setIsTransitioningState(value);
  };

  // Gaze & señas: where each seat is looking and what each team knows about the others' cards
  const [gazes, setGazes] = useState<GazeTarget[]>([-1, -1, -1, -1]);
  const [intel, setIntel] = useState<IntelState>(emptyIntel());
  const gazesRef = useRef<GazeTarget[]>(gazes);
  const intelRef = useRef<IntelState>(intel);
  const playersRef = useRef<Player[]>([]);
  const phaseRef = useRef<LancePhase>('dealing');
  const showAllCardsRef = useRef<boolean>(false);
  const nextGazeChangeRef = useRef<number[]>([0, 0, 0, 0]);
  const señasSentRef = useRef<Set<string>>(new Set());
  // Latest state for code running inside timers (avoids stale closures)
  const lanceBetsRef = useRef<Record<string, LanceBetState>>({});
  const score0Ref = useRef<TeamScore>({ piedras: 0, juegosWon: 0 });
  const score1Ref = useRef<TeamScore>({ piedras: 0, juegosWon: 0 });
  const discardPileRef = useRef<Card[]>([]);
  const handleAITurnRef = useRef<() => void>(() => {});

  const clearAllPendingTimers = () => {
    pendingTimersRef.current.forEach((t) => clearTimeout(t));
    pendingTimersRef.current = [];
  };

  const safeTimeout = (fn: () => void, ms: number) => {
    const timer = window.setTimeout(() => {
      pendingTimersRef.current = pendingTimersRef.current.filter((t) => t !== timer);
      // Once the game is decided, pending lance transitions must not overwrite 'game_over'
      if (handWonRef.current) return;
      try {
        fn();
      } catch (err) {
        // Never leave the table stuck in a transition because of an unexpected error
        console.error('Error en transición de la partida', err);
        setTransitioning(false);
      }
    }, ms);
    pendingTimersRef.current.push(timer);
    return timer;
  };

  const getDelays = () => {
    if (gameSpeed === 'tranquilo') {
      return {
        aiTurn: 2000,
        speechHold: 1800,
        transition: 2200,
        allMusPass: 1600,
      };
    }
    if (gameSpeed === 'normal') {
      return {
        aiTurn: 1300,
        speechHold: 1200,
        transition: 1400,
        allMusPass: 1200,
      };
    }
    return {
      aiTurn: 750,
      speechHold: 700,
      transition: 850,
      allMusPass: 750,
    };
  };

  // Bet State for the active lance
  const [lanceBets, setLanceBets] = useState<Record<string, LanceBetState>>({
    grande: { currentBet: 0, lastBettorTeam: null, lastBettorIndex: null, history: [], isOrdago: false, accepted: false, rejected: false, resolved: false },
    chica: { currentBet: 0, lastBettorTeam: null, lastBettorIndex: null, history: [], isOrdago: false, accepted: false, rejected: false, resolved: false },
    pares: { currentBet: 0, lastBettorTeam: null, lastBettorIndex: null, history: [], isOrdago: false, accepted: false, rejected: false, resolved: false },
    juego: { currentBet: 0, lastBettorTeam: null, lastBettorIndex: null, history: [], isOrdago: false, accepted: false, rejected: false, resolved: false },
    punto: { currentBet: 0, lastBettorTeam: null, lastBettorIndex: null, history: [], isOrdago: false, accepted: false, rejected: false, resolved: false },
  });

  const activeLanceName = React.useMemo(() => {
    switch (phase) {
      case 'dealing':
        return 'REPARTO';
      case 'mus_dialog':
        return 'MUS (¿HAY O NO?)';
      case 'discarding':
        return 'DESCARTES';
      case 'grande':
        return 'A LA GRANDE';
      case 'chica':
        return 'A LA CHICA';
      case 'pares_precheck':
      case 'pares_bet':
        return 'A LOS PARES';
      case 'juego_precheck':
      case 'juego_bet':
        return 'AL JUEGO';
      case 'punto_bet':
        return 'AL PUNTO';
      case 'scoring':
        return 'RECUENTO DE TANTOS';
      case 'round_end':
        return 'FIN DE LA JUGADA';
      case 'game_over':
        return 'FIN DE LA PARTIDA';
      default:
        return 'MUS';
    }
  }, [phase]);

  // Current active bet state object
  const currentBetState = React.useMemo<LanceBetState>(() => {
    if (phase === 'grande') return lanceBets.grande;
    if (phase === 'chica') return lanceBets.chica;
    if (phase === 'pares_bet') return lanceBets.pares;
    if (phase === 'juego_bet') return lanceBets.juego;
    if (phase === 'punto_bet') return lanceBets.punto;
    return { currentBet: 0, lastBettorTeam: null, lastBettorIndex: null, history: [], isOrdago: false, accepted: false, rejected: false, resolved: false };
  }, [phase, lanceBets]);

  // Start a new game with chosen characters
  const handleStartGame = (
    playerChar: CharacterInfo,
    partnerChar: CharacterInfo,
    rivalChars: [CharacterInfo, CharacterInfo],
    mode: GameMode,
    target: number
  ) => {
    setGameMode(mode);
    setNetRole('none');
    netRoleRef.current = 'none';
    setHumanSeats([0]);
    humanSeatsRef.current = new Set([0]);
    setTargetPiedras(target);
    setScoreTeam0({ piedras: 0, juegosWon: 0 });
    setScoreTeam1({ piedras: 0, juegosWon: 0 });

    const newPlayers: Player[] = [
      {
        id: playerChar.id,
        name: activeUser?.name || playerChar.name,
        realName: playerChar.realName,
        quote: playerChar.presentation,
        team: 0,
        seat: 0,
        cards: [],
        selectedToDiscard: [],
        avatarColor: playerChar.visual.bgColor,
        avatarIcon: playerChar.visual.emoji,
        description: playerChar.description,
        aggressiveness: playerChar.aggressiveness,
        bluffRate: playerChar.bluffRate,
      },
      {
        id: rivalChars[0].id,
        name: rivalChars[0].name,
        realName: rivalChars[0].realName,
        quote: rivalChars[0].presentation,
        team: 1,
        seat: 1,
        cards: [],
        selectedToDiscard: [],
        avatarColor: rivalChars[0].visual.bgColor,
        avatarIcon: rivalChars[0].visual.emoji,
        description: rivalChars[0].description,
        aggressiveness: rivalChars[0].aggressiveness,
        bluffRate: rivalChars[0].bluffRate,
      },
      {
        id: partnerChar.id,
        name: partnerChar.name,
        realName: partnerChar.realName,
        quote: partnerChar.presentation,
        team: 0,
        seat: 2,
        cards: [],
        selectedToDiscard: [],
        avatarColor: partnerChar.visual.bgColor,
        avatarIcon: partnerChar.visual.emoji,
        description: partnerChar.description,
        aggressiveness: partnerChar.aggressiveness,
        bluffRate: partnerChar.bluffRate,
      },
      {
        id: rivalChars[1].id,
        name: rivalChars[1].name,
        realName: rivalChars[1].realName,
        quote: rivalChars[1].presentation,
        team: 1,
        seat: 3,
        cards: [],
        selectedToDiscard: [],
        avatarColor: rivalChars[1].visual.bgColor,
        avatarIcon: rivalChars[1].visual.emoji,
        description: rivalChars[1].description,
        aggressiveness: rivalChars[1].aggressiveness,
        bluffRate: rivalChars[1].bluffRate,
      },
    ];

    setPlayers(newPlayers);
    setManoIndex(0);

    if (mode === 'torneo') {
      // Set matches
      setTournamentRound(0);
      const used = new Set([playerChar.id, partnerChar.id, rivalChars[0].id, rivalChars[1].id]);
      const pool = shuffleArray(PC_MUS_CHARACTERS.filter((c) => !used.has(c.id)));
      const pick = (i: number) => (pool[i] || pool[i % Math.max(pool.length, 1)] || rivalChars[i % 2]).name;
      setTournamentMatches([
        { roundName: 'Cuartos de Final', rivals: [rivalChars[0].name, rivalChars[1].name], defeated: false, current: true },
        { roundName: 'Semifinales', rivals: [pick(0), pick(1)], defeated: false, current: false },
        { roundName: 'Gran Final', rivals: [pick(2), pick(3)], defeated: false, current: false },
      ]);
      setView('bracket');
    } else {
      setView('game');
      dealNewHand(newPlayers, 0);
    }
  };

  // Start (or resume) an online game. The engine always puts you at local seat 0:
  // local seat i is the room's absolute seat (i + mySeat) % 4.
  const handleStartMultiplayerGame = (room: MultiplayerRoom, mySeat: number) => {
    const me = multiplayerService.getPlayerId();
    const isHost = room.hostPlayerId === me;
    clearAllPendingTimers();
    setGameMode('multijugador');
    setMultiplayerRoom(room);
    setLocalSeatIndex(mySeat);
    mySeatRef.current = mySeat;
    setTargetPiedras(room.targetPiedras);
    setNetNotice(null);
    appliedVersionRef.current = 0;
    lastActionSeqRef.current = 0;
    setClientSelection([]);
    setDiscardReady([]);

    const newPlayers: Player[] = [0, 1, 2, 3].map((idx) => {
      const s = room.seats[absoluteSeat(idx, mySeat)];
      const char = PC_MUS_CHARACTERS.find((c) => c.id === s.characterId) || PC_MUS_CHARACTERS[idx % PC_MUS_CHARACTERS.length];
      return {
        id: char.id, // portraits & voices come from the character
        name: s.playerName || char.name,
        realName: char.realName,
        quote: char.presentation,
        team: (idx % 2 === 0 ? 0 : 1) as 0 | 1,
        seat: idx as 0 | 1 | 2 | 3,
        cards: [],
        selectedToDiscard: [],
        avatarColor: s.avatarColor || char.visual.bgColor,
        avatarIcon: s.avatarIcon || char.visual.emoji,
        description: char.description,
        aggressiveness: char.aggressiveness,
        bluffRate: char.bluffRate,
      };
    });
    const humans = [0, 1, 2, 3].filter((idx) => {
      const s = room.seats[absoluteSeat(idx, mySeat)];
      return idx === 0 || (s.occupied && !s.isBot);
    });
    setHumanSeats(humans);
    humanSeatsRef.current = new Set(humans);
    setView('game');

    if (isHost) {
      setNetRole('host');
      netRoleRef.current = 'host';
      if (room.state && (room.stateVersion || 0) > 0) {
        // Host came back (page reload): continue the same game from the last snapshot
        loadEngineFromSnapshot(toLocal(room.state as TableSnapshot, mySeat), newPlayers);
        setRecentEvent('Partida online recuperada. ¡Seguimos!');
      } else {
        setScoreTeam0({ piedras: 0, juegosWon: 0 });
        setScoreTeam1({ piedras: 0, juegosWon: 0 });
        score0Ref.current = { piedras: 0, juegosWon: 0 };
        score1Ref.current = { piedras: 0, juegosWon: 0 };
        setPlayers(newPlayers);
        setManoIndex(0);
        dealNewHand(newPlayers, 0);
      }
    } else {
      setNetRole('client');
      netRoleRef.current = 'client';
      handWonRef.current = false;
      isScoringRef.current = false;
      setTransitioning(false);
      setPlayers(newPlayers);
      setPhase('dealing');
      setCurrentTurn(-1);
      setRecountPlan(null);
      setRecentEvent('Conectando con la mesa del anfitrión...');
      if (room.state) applySnapshot(room);
    }
  };

  // Load a snapshot (already in local seats) into this browser's engine
  const loadEngineFromSnapshot = (snap: TableSnapshot, fallbackPlayers?: Player[]) => {
    clearAllPendingTimers();
    const table = snap.players.map((p, i) => ({
      ...(fallbackPlayers?.[i] || p),
      ...p,
      id: fallbackPlayers?.[i]?.id || p.id,
      name: fallbackPlayers?.[i]?.name || p.name,
      currentSpeech: null,
      lastGesture: null,
    }));
    // Rebuild the remaining deck: every card not in somebody's hand
    const inHands = new Set(table.flatMap((p) => p.cards.map((c) => `${c.suit}-${c.number}`)));
    const freshDeck = createDeck().filter((c) => !inHands.has(`${c.suit}-${c.number}`));
    setDeck(freshDeck);
    discardPileRef.current = [];
    playersRef.current = table;
    setPlayers(table);
    setManoIndex(snap.manoIndex);
    // A recount in progress restarts from the last lance decision (points are paid by the recount)
    const resumePhase: LancePhase = snap.phase === 'scoring' ? 'round_end' : snap.phase;
    setPhase(resumePhase);
    setCurrentTurn(snap.currentTurn);
    setShowAllCards(snap.showAllCards);
    setLanceBets(snap.lanceBets);
    lanceBetsRef.current = snap.lanceBets;
    setScoreTeam0(snap.scores[0]);
    setScoreTeam1(snap.scores[1]);
    score0Ref.current = snap.scores[0];
    score1Ref.current = snap.scores[1];
    setRecountPlan(null);
    updateGazes(snap.gazes);
    updateIntel(snap.intel);
    setDiscardReady(snap.discardReady || []);
    setTargetPiedras(snap.targetPiedras);
    handNumberRef.current = snap.handNumber || 0;
    handWonRef.current = resumePhase === 'game_over';
    isScoringRef.current = false;
    setTransitioning(false);
  };

  // Client: show the host's table from my seat
  const applySnapshot = (room: MultiplayerRoom) => {
    if (!room.state || (room.stateVersion || 0) <= appliedVersionRef.current) return;
    appliedVersionRef.current = room.stateVersion || 0;
    const snap = toLocal(room.state as TableSnapshot, mySeatRef.current);
    const prevPlayers = playersRef.current;
    const myGaze = gazesRef.current[0];
    // Voices: say out loud the lines that just appeared
    snap.players.forEach((p, i) => {
      if (p.currentSpeech && p.currentSpeech !== prevPlayers[i]?.currentSpeech) {
        voiceEngine.speakCharacter(p.id, p.currentSpeech);
      }
    });
    if (snap.phase !== 'discarding') {
      setClientSelection([]);
      discardSentRef.current = false;
    } else if (discardSentRef.current && !snap.discardReady.includes(0)) {
      snap.discardReady = [...snap.discardReady, 0];
    }
    const discarding = snap.phase === 'discarding' && !snap.discardReady.includes(0);
    // A move I sent is done once the turn or phase moves on (or after a few seconds)
    const pending = pendingMoveRef.current;
    if (pending && (pending.phase !== snap.phase || pending.turn !== snap.currentTurn || Date.now() - pending.at > 5000)) {
      pendingMoveRef.current = null;
    }
    setPlayers(
      snap.players.map((p, i) => ({
        ...p,
        name: prevPlayers[i]?.name || p.name,
        selectedToDiscard: i === 0 && discarding ? clientSelectionRef.current : [],
      }))
    );
    setManoIndex(snap.manoIndex);
    setCurrentTurn(snap.currentTurn);
    setPhase(snap.phase);
    setShowAllCards(snap.showAllCards);
    setRecentEvent(snap.recentEvent);
    setLanceBets(snap.lanceBets);
    setScoreTeam0(snap.scores[0]);
    setScoreTeam1(snap.scores[1]);
    setRecountPlan(snap.recountPlan);
    const gz = [...snap.gazes] as GazeTarget[];
    gz[0] = myGaze; // my own eyes respond instantly
    updateGazes(gz);
    updateIntel(snap.intel);
    setDiscardReady(snap.discardReady);
    setClientBusy(snap.busy || !!pendingMoveRef.current);
    setTargetPiedras(snap.targetPiedras);
  };

  // Tutorial action: quick start
  const handleTutorialStartGame = (mode: 'partida' | 'torneo' | 'multijugador') => {
    if (mode === 'multijugador') {
      setView('multiplayer');
      return;
    }
    const playerChar = PC_MUS_CHARACTERS[0];
    const partnerChar = PC_MUS_CHARACTERS[1];
    const rival1 = PC_MUS_CHARACTERS[2];
    const rival2 = PC_MUS_CHARACTERS[3];
    handleStartGame(playerChar, partnerChar, [rival1, rival2], mode, 40);
  };

  // Keep multiplayer room state updated (clients also receive the host's table here)
  useEffect(() => {
    if (!multiplayerRoom?.id || view !== 'game') return;
    const unsubscribe = multiplayerService.subscribeToRoom(
      multiplayerRoom.id,
      (updated) => {
        setMultiplayerRoom(updated);
        const me = multiplayerService.getPlayerId();
        if (!updated.seats.some((s) => s.playerId === me)) {
          setNetNotice('Ya no estás sentado en esta mesa.');
          return;
        }
        if (updated.status === 'finished') {
          setNetNotice('La partida online ha terminado: el anfitrión ha abandonado la mesa.');
        } else if (netRoleRef.current === 'client' && !updated.hostOnline) {
          setNetNotice('El anfitrión no responde... esperando a que vuelva.');
        } else {
          setNetNotice(null);
        }
        if (netRoleRef.current === 'client') applySnapshotRef.current(updated);
      },
      (err) => setNetNotice(err.message),
      netRoleRef.current === 'client' ? 600 : 2000
    );
    return () => unsubscribe();
  }, [multiplayerRoom?.id, view, netRole]);

  // ───────── Save & resume (AI Studio reloads the preview page often) ─────────
  const SAVE_KEY = 'pc_mus_saved_game_v1';
  const clearSavedGame = () => {
    try {
      localStorage.removeItem(SAVE_KEY);
    } catch {
      /* storage unavailable */
    }
  };
  // Save the game against the computer whenever the table is in a stable state
  useEffect(() => {
    if (netRole !== 'none' || players.length !== 4) return;
    if (view !== 'game' && view !== 'bracket') return;
    if (view === 'game' && (phase === 'game_over' || handWonRef.current)) {
      if (gameMode !== 'torneo' || phase === 'game_over') clearSavedGame();
      return;
    }
    if (view === 'game' && (isTransitioning || phase === 'scoring' || phase === 'dealing')) return;
    const timer = window.setTimeout(() => {
      try {
        localStorage.setItem(
          SAVE_KEY,
          JSON.stringify({
            v: 1,
            at: Date.now(),
            view,
            gameMode,
            gameSpeed,
            targetPiedras,
            tournamentRound,
            tournamentMatches,
            snapshot: buildSnapshot(),
          })
        );
      } catch {
        /* storage full or blocked: nothing to do */
      }
    }, 250);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [netRole, view, players, phase, currentTurn, manoIndex, lanceBets, scoreTeam0, scoreTeam1, isTransitioning, tournamentRound]);

  // After a page reload, go back to where you were: the online table or the saved game
  useEffect(() => {
    const roomId = multiplayerService.getActiveRoomId();
    if (!roomId) {
      try {
        const raw = localStorage.getItem(SAVE_KEY);
        const saved = raw ? JSON.parse(raw) : null;
        if (!saved || saved.v !== 1 || Date.now() - saved.at > 24 * 60 * 60 * 1000 || !saved.snapshot?.players?.length) {
          return;
        }
        setGameMode(saved.gameMode);
        setGameSpeed(saved.gameSpeed || 'tranquilo');
        setTournamentRound(saved.tournamentRound || 0);
        if (Array.isArray(saved.tournamentMatches)) setTournamentMatches(saved.tournamentMatches);
        if (saved.view === 'bracket') {
          setPlayers(saved.snapshot.players);
          setTargetPiedras(saved.targetPiedras || 40);
          setScoreTeam0(saved.snapshot.scores[0]);
          setScoreTeam1(saved.snapshot.scores[1]);
          setView('bracket');
        } else {
          loadEngineFromSnapshot(saved.snapshot);
          setRecentEvent('🔄 Partida recuperada tras recargar la página. ¡Seguimos donde lo dejaste!');
          setView('game');
        }
      } catch {
        clearSavedGame();
      }
      return;
    }
    multiplayerService
      .getRoom(roomId)
      .then((room) => {
        const mine = room.seats.find((s) => s.playerId === multiplayerService.getPlayerId());
        if (room.status === 'playing' && mine) handleStartMultiplayerGame(room, mine.seatIndex);
        else multiplayerService.setActiveRoomId(null);
      })
      .catch(() => multiplayerService.setActiveRoomId(null));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const applySnapshotRef = useRef(applySnapshot);
  applySnapshotRef.current = applySnapshot;

  // Host: publish the table every time it changes
  const buildSnapshot = (): TableSnapshot => ({
    players: playersRef.current.map((p) => ({ ...p })),
    manoIndex,
    currentTurn,
    phase,
    showAllCards,
    recentEvent,
    lanceBets,
    scores: [scoreTeam0, scoreTeam1],
    recountPlan,
    gazes,
    intel,
    discardReady,
    busy: isTransitioning,
    targetPiedras,
    handNumber: handNumberRef.current,
  });
  useEffect(() => {
    if (netRole !== 'host' || !multiplayerRoom?.id || view !== 'game' || players.length !== 4) return;
    const roomId = multiplayerRoom.id;
    const timer = window.setTimeout(() => {
      multiplayerService
        .publishState(roomId, toAbsolute(buildSnapshot(), mySeatRef.current))
        .catch((err) => setNetNotice((err as Error).message));
    }, 120);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [netRole, view, multiplayerRoom?.id, players, phase, currentTurn, manoIndex, lanceBets, scoreTeam0, scoreTeam1, showAllCards, recentEvent, recountPlan, gazes, intel, discardReady, isTransitioning]);

  // Host: receive the moves of the other people at the table
  useEffect(() => {
    if (netRole !== 'host' || !multiplayerRoom?.id || view !== 'game') return;
    const roomId = multiplayerRoom.id;
    let stopped = false;
    let timer: number | undefined;
    const tick = async () => {
      try {
        const { actions } = await multiplayerService.pullActions(roomId, lastActionSeqRef.current);
        for (const a of actions) {
          if (stopped) return;
          lastActionSeqRef.current = Math.max(lastActionSeqRef.current, a.seq);
          try {
            applyRemoteActionRef.current(a);
          } catch (err) {
            console.error('Acción remota no válida', err);
          }
          // One game move per cycle, so the next one is checked against the updated table
          if (a.kind !== 'gaze') break;
        }
      } catch {
        /* network hiccup: try again */
      }
      if (!stopped) timer = window.setTimeout(tick, 350);
    };
    tick();
    return () => {
      stopped = true;
      if (timer) clearTimeout(timer);
    };
  }, [netRole, view, multiplayerRoom?.id]);

  // Deals a fresh 4-card hand to each player
  const dealNewHand = (currentPlayers: Player[], mano: number) => {
    sound.playCard();
    const newDeck = createDeck();
    const dealtPlayers = currentPlayers.map((p, idx) => {
      const cards = newDeck.splice(0, 4);
      return {
        ...p,
        cards,
        selectedToDiscard: [],
        currentSpeech: null,
        lastGesture: null,
        saidMus: null,
        hasPares: evaluatePares(cards).level > 0,
        declaredPares: null,
        hasJuego: getHandSum(cards) >= 31,
        declaredJuego: null,
        juegoValue: getHandSum(cards),
      };
    });

    setDeck(newDeck);
    discardPileRef.current = [];
    handNumberRef.current += 1;
    setDiscardReady([]);
    setPlayers(dealtPlayers);
    resetSeñasForNewCards();
    setShowAllCards(false);
    setManoIndex(mano);
    setCurrentTurn(mano);
    setPhase('mus_dialog');
    setRecentEvent(`Mano: ${dealtPlayers[mano].name}. Se inicia consulta de Mus.`);
    isScoringRef.current = false;
    handWonRef.current = false;
    setTransitioning(false);
    setRecountPlan(null);
    clearAllPendingTimers();

    // Reset lance bets
    setLanceBets({
      grande: { currentBet: 0, lastBettorTeam: null, lastBettorIndex: null, history: [], isOrdago: false, accepted: false, rejected: false, resolved: false },
      chica: { currentBet: 0, lastBettorTeam: null, lastBettorIndex: null, history: [], isOrdago: false, accepted: false, rejected: false, resolved: false },
      pares: { currentBet: 0, lastBettorTeam: null, lastBettorIndex: null, history: [], isOrdago: false, accepted: false, rejected: false, resolved: false },
      juego: { currentBet: 0, lastBettorTeam: null, lastBettorIndex: null, history: [], isOrdago: false, accepted: false, rejected: false, resolved: false },
      punto: { currentBet: 0, lastBettorTeam: null, lastBettorIndex: null, history: [], isOrdago: false, accepted: false, rejected: false, resolved: false },
    });
  };

  const isPrecheckPhase = phase === 'pares_precheck' || phase === 'juego_precheck';
  // The app certifies the human's pares/juego (nobody can lie), and skips seat 0 in a
  // pares/juego lance when it has nothing to bet with.
  const currentIsHuman = humanSeats.includes(currentTurn);
  const humanNeedsAutomation =
    currentIsHuman &&
    (isPrecheckPhase ||
      (phase === 'pares_bet' && !players[currentTurn]?.declaredPares) ||
      (phase === 'juego_bet' && !players[currentTurn]?.declaredJuego));

  // AI Turn automation ticker.
  // Instead of a single timeout (which was lost if it fired during a transition and the game
  // froze), it polls until the turn can be played, and always calls the latest handler.
  useEffect(() => {
    if (view !== 'game' || players.length === 0) return;
    if (netRole === 'client') return; // the host's browser runs the game
    const isTurnPhase = [
      'mus_dialog',
      'grande',
      'chica',
      'pares_precheck',
      'pares_bet',
      'juego_precheck',
      'juego_bet',
      'punto_bet',
    ].includes(phase);
    if (!isTurnPhase || currentTurn < 0) return;
    // A person's turn is automated only to certify their declaration or to skip a lance they can't bet in
    if (currentIsHuman && !humanNeedsAutomation) return;

    const startedAt = Date.now();
    const delay = currentIsHuman && !isPrecheckPhase ? 300 : getDelays().aiTurn;
    let acted = false;
    const interval = window.setInterval(() => {
      if (acted) return;
      if (isTransitioningRef.current || isScoringRef.current || handWonRef.current) return;
      const now = Date.now();
      // Wait the "thinking" delay, and let React render the state that ended a transition
      if (now - startedAt < delay || now - transitionEndAtRef.current < 350) return;
      acted = true;
      try {
        handleAITurnRef.current();
      } catch (err) {
        console.error('Error en el turno de la IA', err);
        acted = false; // retry on the next tick instead of freezing
      }
    }, 150);
    return () => clearInterval(interval);
  }, [currentTurn, phase, view, gameSpeed, players.length, currentIsHuman, humanNeedsAutomation, netRole]);

  // Keep refs in sync so the gaze ticker always reads the latest table state
  gazesRef.current = gazes;
  intelRef.current = intel;
  playersRef.current = players;
  phaseRef.current = phase;
  showAllCardsRef.current = showAllCards;
  lanceBetsRef.current = lanceBets;
  score0Ref.current = scoreTeam0;
  score1Ref.current = scoreTeam1;

  const updateGazes = (next: GazeTarget[]) => {
    gazesRef.current = next;
    setGazes(next);
  };

  const updateIntel = (next: IntelState) => {
    intelRef.current = next;
    setIntel(next);
  };

  const resetSeñasForNewCards = () => {
    señasSentRef.current = new Set();
    updateIntel(emptyIntel());
  };

  // Briefly show a seña gesture above a seated player (only when your team saw it)
  const flashGesture = (seat: number, gesture: string) => {
    setPlayers((prev) => prev.map((p, i) => (i === seat ? { ...p, lastGesture: gesture } : p)));
    window.setTimeout(() => {
      setPlayers((prev) =>
        prev.map((p, i) => (i === seat && p.lastGesture === gesture ? { ...p, lastGesture: null } : p))
      );
    }, 2200);
  };

  const sayBriefly = (seat: number, text: string, ms = 2400) => {
    setPlayers((prev) => prev.map((p, i) => (i === seat ? { ...p, currentSpeech: text } : p)));
    window.setTimeout(() => {
      setPlayers((prev) =>
        prev.map((p, i) => (i === seat && p.currentSpeech === text ? { ...p, currentSpeech: null } : p))
      );
    }, ms);
  };

  const getSeenSeñaQuote = (seat: number) => {
    const char = PC_MUS_CHARACTERS.find((c) => c.id === playersRef.current[seat]?.id);
    const lines = char?.dialogs.señaSeen || [];
    return lines[Math.floor(Math.random() * lines.length)] || '¡Te he visto la seña!';
  };

  // An AI player passes a seña to its partner. Whoever is looking at the sender at that moment sees it.
  const performAISeña = (seat: number, seña: Seña) => {
    const table = playersRef.current;
    const sender = table[seat];
    if (!sender) return;
    const currentGazes = gazesRef.current;
    const team = sender.team;
    const watchers = opponentsOf(seat).filter((o) => currentGazes[o] === seat);
    señasSentRef.current.add(`${seat}:${seña.id}`);

    let nextIntel = addIntel(intelRef.current, team, seat, seña.id);
    if (watchers.length) {
      nextIntel = addIntel(nextIntel, team === 0 ? 1 : 0, seat, seña.id);
    }
    updateIntel(nextIntel);

    const label = señaShortLabel(seña.id);
    if (team === 0) {
      // Your partner (North) signals you: you were looking at them, so you see it
      flashGesture(seat, seña.gesture);
      sound.playSeña();
      if (watchers.length) {
        const catcher = watchers[0];
        const quote = getSeenSeñaQuote(catcher);
        sayBriefly(catcher, quote);
        voiceEngine.speakCharacter(table[catcher].id, quote);
        setRecentEvent(
          `🤝 ${sender.name} te pasa seña: ${label}... ¡pero ${watchers.map((w) => table[w].name).join(' y ')} lo ha visto!`
        );
      } else {
        setRecentEvent(`🤝 ${sender.name} te pasa seña a escondidas: «${label}» (${seña.meaning}).`);
      }
      return;
    }

    // Rival seña: only visible to you if you or your partner were watching
    if (watchers.includes(0)) {
      flashGesture(seat, seña.gesture);
      sound.playSeña();
      setRecentEvent(`🕵️ ¡Has cazado la seña de ${sender.name}! ${seña.gesture} → ${seña.meaning}.`);
    } else if (watchers.includes(2)) {
      flashGesture(seat, seña.gesture);
      sound.playSeña();
      sayBriefly(2, '*(He visto la seña del rival...)*');
      setRecentEvent(`🕵️ ${table[2].name} ha cazado la seña de ${sender.name}: «${label}».`);
    }
  };

  // Gaze ticker: AIs turn their necks randomly and pass señas when nobody is watching
  useEffect(() => {
    if (view !== 'game') return;
    const interval = window.setInterval(() => {
      if (netRoleRef.current === 'client') return;
      const table = playersRef.current;
      if (table.length !== 4) return;
      const now = Date.now();

      // 1. Random neck movements
      let changed = false;
      const next = [...gazesRef.current] as GazeTarget[];
      for (let seat = 1; seat < 4; seat++) {
        if (humanSeatsRef.current.has(seat)) continue;
        if (now >= nextGazeChangeRef.current[seat]) {
          next[seat] = pickNextGaze(seat, next[seat]);
          nextGazeChangeRef.current[seat] = now + randomGazeDuration();
          changed = true;
        }
      }
      if (changed) updateGazes(next);

      // 2. AI señas
      if (!SEÑA_PHASES.includes(phaseRef.current) || showAllCardsRef.current) return;
      for (let seat = 1; seat < 4; seat++) {
        if (humanSeatsRef.current.has(seat)) continue;
        const p = table[seat];
        const pending = getValidSeñas(p.cards).filter((s) => !señasSentRef.current.has(`${seat}:${s.id}`));
        if (!pending.length) continue;
        // The partner has to be looking at the sender to receive the seña
        if (gazesRef.current[partnerOf(seat)] !== seat) continue;
        const watched = opponentsOf(seat).some((o) => gazesRef.current[o] === seat);
        // Careful players wait until nobody watches; careless ones sometimes get caught
        const chance = watched ? 0.03 + p.bluffRate * 0.05 : 0.35;
        if (Math.random() < chance) {
          performAISeña(seat, pending[0]);
          break; // one seña per tick keeps it readable
        }
      }
    }, 450);
    return () => clearInterval(interval);
  }, [view]);

  // Execute AI action based on phase
  const handleAITurn = () => {
    if (players.length === 0) return;
    if (isTransitioningRef.current || isScoringRef.current || handWonRef.current) return;
    const aiPlayer = players[currentTurn];
    if (!aiPlayer) return;

    // Pares / Juego declarations (the app certifies every hand, including yours)
    if (phase === 'pares_precheck') {
      if (currentTurn === 0) handleUserPrecheckDeclaration();
      else handleDeclarePares(currentTurn, evaluatePares(aiPlayer.cards).level > 0);
      return;
    }
    if (phase === 'juego_precheck') {
      if (currentTurn === 0) handleUserPrecheckDeclaration();
      else handleDeclareJuego(currentTurn, getHandSum(aiPlayer.cards) >= 31);
      return;
    }

    // Without pares / juego a player cannot bet in that lance: the turn moves on
    if (phase === 'pares_bet' && !aiPlayer.declaredPares) {
      setCurrentTurn(getNextEligibleBettorSeat((currentTurn + 1) % 4, 'pares', players));
      return;
    }
    if (phase === 'juego_bet' && !aiPlayer.declaredJuego) {
      setCurrentTurn(getNextEligibleBettorSeat((currentTurn + 1) % 4, 'juego', players));
      return;
    }

    if (humanSeatsRef.current.has(currentTurn)) return; // people play their own turns

    // Mus question phase
    if (phase === 'mus_dialog') {
      const { wantsMus, speech } = decideMusOrNoMus(aiPlayer);

      // Update player speech
      setPlayers((prev) =>
        prev.map((p, i) => (i === currentTurn ? { ...p, currentSpeech: speech, saidMus: wantsMus } : p))
      );

      if (wantsMus) {
        sound.playCard();
        setRecentEvent(`${aiPlayer.name} dice: «Mus».`);
        voiceEngine.speakCharacter(aiPlayer.id, speech);
        advanceMusTurn(currentTurn);
      } else {
        sound.playEnvido();
        setRecentEvent(`¡${aiPlayer.name} corta el mus! No hay mus.`);
        voiceEngine.speakCharacter(aiPlayer.id, speech);
        // Mus cut! Advance to Grande betting with safe transition
        setTransitioning(true);
        const delays = getDelays();
        safeTimeout(() => {
          setTransitioning(false);
          startLance('grande');
        }, delays.transition);
      }
      return;
    }

    // Betting phase (grande, chica, pares_bet, juego_bet, punto_bet)
    const isBettingLance = ['grande', 'chica', 'pares_bet', 'juego_bet', 'punto_bet'].includes(phase);
    if (!isBettingLance) return;

    const lanceKey =
      phase === 'grande'
        ? 'grande'
        : phase === 'chica'
        ? 'chica'
        : phase === 'pares_bet'
        ? 'pares'
        : phase === 'juego_bet'
        ? 'juego'
        : 'punto';

    const currentLanceBet = lanceBetsRef.current[lanceKey] || lanceBets[lanceKey];

    // Regla de Oro: when the rivals bet and the turn falls on your partner (North), the partner
    // lets you decide whether to accept, as long as you can play this lance.
    if (currentTurn === 2 && currentLanceBet.currentBet > 0 && currentLanceBet.lastBettorTeam === 1) {
      if (isPlayerEligibleForLance(players[0], lanceKey)) {
        const deferSpeech = '¡Compañero, tú decides si queremos o no!';
        setPlayers((prev) => prev.map((p, i) => (i === 2 ? { ...p, currentSpeech: deferSpeech } : p)));
        voiceEngine.speakCharacter(aiPlayer.id, deferSpeech);
        setRecentEvent(`${aiPlayer.name} te cede la palabra: «${deferSpeech}»`);
        setCurrentTurn(0);
        return;
      }
    }

    const teamIntel = intelRef.current[aiPlayer.team];
    const decision = decideLanceAction(
      aiPlayer,
      lanceKey as any,
      currentLanceBet,
      aiPlayer.team === 0 ? scoreTeam0.piedras : scoreTeam1.piedras,
      aiPlayer.team === 0 ? scoreTeam1.piedras : scoreTeam0.piedras,
      {
        partnerSeñas: teamIntel[partnerOf(currentTurn)] || [],
        rivalSeñas: opponentsOf(currentTurn).flatMap((o) => teamIntel[o] || []),
      }
    );

    // Apply speech
    setPlayers((prev) =>
      prev.map((p, i) => (i === currentTurn ? { ...p, currentSpeech: decision.speech } : p))
    );
    voiceEngine.speakCharacter(aiPlayer.id, decision.speech);

    executeBetAction(currentTurn, decision.action, lanceKey);
  };

  handleAITurnRef.current = handleAITurn;

  // Progress Mus turn in circle
  const advanceMusTurn = (fromSeat: number) => {
    const nextSeat = (fromSeat + 1) % 4;
    // If completed full circle back to manoIndex, everyone said Mus!
    if (nextSeat === manoIndex) {
      setRecentEvent('¡Los cuatro jugadores quieren Mus! Se procede a los descartes.');
      setTransitioning(true);
      const delays = getDelays();
      safeTimeout(() => {
        setTransitioning(false);
        setPhase('discarding');
        setCurrentTurn(0); // Give user turn to select discards
      }, delays.allMusPass);
    } else {
      setCurrentTurn(nextSeat);
    }
  };

  // A person has chosen their discards; the new cards are dealt when every human is ready
  const handleSeatDiscard = (seat: number, indices: number[]) => {
    if (phaseRef.current !== 'discarding' || isTransitioningRef.current) return;
    const valid = [...new Set(indices)].filter((i) => i >= 0 && i < 4);
    if (valid.length === 0 || discardReadyRef.current.includes(seat)) return;
    const table = playersRef.current.map((p, i) => (i === seat ? { ...p, selectedToDiscard: valid } : p));
    playersRef.current = table;
    setPlayers(table);
    const ready = [...discardReadyRef.current, seat];
    discardReadyRef.current = ready;
    setDiscardReady(ready);
    const waiting = [...humanSeatsRef.current].filter((h) => !ready.includes(h));
    if (waiting.length > 0) {
      setRecentEvent(`Esperando los descartes de ${waiting.map((h) => table[h]?.name).join(' y ')}...`);
      return;
    }
    handleUserDiscard(table);
  };

  // Discarding cards (everybody at once)
  const handleUserDiscard = (table: Player[] = playersRef.current) => {
    sound.playCard();
    const players = table;

    // Everybody draws from the same remaining deck (before, each player drew from its own copy
    // and cards were duplicated). When it runs out, the previous discards are reshuffled.
    let remainingDeck = [...deck];
    let discardPile = [...discardPileRef.current];
    const updatedPlayers = players.map((p, idx) => {
      const discards = humanSeatsRef.current.has(idx) ? p.selectedToDiscard || [] : getAIDiscardIndices(p.cards);
      const newCards = [...p.cards];

      discards.forEach((dIdx) => {
        if (remainingDeck.length === 0 && discardPile.length > 0) {
          remainingDeck = shuffleArray(discardPile);
          discardPile = [];
        }
        if (remainingDeck.length > 0) {
          newCards[dIdx] = remainingDeck.pop()!;
        }
      });
      discards.forEach((dIdx) => {
        if (newCards[dIdx] !== p.cards[dIdx]) discardPile.push(p.cards[dIdx]);
      });

      return {
        ...p,
        cards: newCards,
        selectedToDiscard: [],
        currentSpeech: null,
        hasPares: evaluatePares(newCards).level > 0,
        declaredPares: null,
        hasJuego: getHandSum(newCards) >= 31,
        declaredJuego: null,
        juegoValue: getHandSum(newCards),
      };
    });

    setDeck(remainingDeck);
    discardPileRef.current = discardPile;
    setDiscardReady([]);
    discardReadyRef.current = [];
    setPlayers(updatedPlayers);
    resetSeñasForNewCards();
    setRecentEvent('Se han repartido los nuevos naipes de descarte. Nueva consulta de Mus.');
    setPhase('mus_dialog');
    setCurrentTurn(manoIndex);
  };

  // Can this player take part in the betting of this lance?
  const isPlayerEligibleForLance = (p: Player | undefined, lance: string) => {
    if (!p) return false;
    if (lance === 'pares') return p.declaredPares === true;
    if (lance === 'juego') return p.declaredJuego === true;
    return true; // grande, chica, punto
  };

  // Next player around the table who can bet in this lance
  const getNextEligibleBettorSeat = (fromSeat: number, lance: string, currentPlayers: Player[]) => {
    for (let step = 0; step < 4; step++) {
      const candidate = (fromSeat + step) % 4;
      if (isPlayerEligibleForLance(currentPlayers[candidate], lance)) return candidate;
    }
    return fromSeat;
  };

  // Who answers a bet: when the rivals bet against you, you always decide (if you can play the
  // lance), otherwise your partner; against the rivals, the next eligible rival.
  const getNextOpposingBettorSeat = (fromSeat: number, actingTeam: 0 | 1, lance: string, currentPlayers: Player[]) => {
    const opposingTeam = actingTeam === 0 ? 1 : 0;
    if (opposingTeam === 0) {
      if (isPlayerEligibleForLance(currentPlayers[0], lance)) return 0;
      if (isPlayerEligibleForLance(currentPlayers[2], lance)) return 2;
      return null;
    }
    for (let step = 1; step <= 4; step++) {
      const candidate = (fromSeat + step) % 4;
      if (currentPlayers[candidate]?.team === opposingTeam && isPlayerEligibleForLance(currentPlayers[candidate], lance)) {
        return candidate;
      }
    }
    return null;
  };

  // Start a betting lance or the pares / juego declaration round
  const startLance = (lance: 'grande' | 'chica' | 'pares' | 'juego' | 'punto') => {
    const players = playersRef.current;
    // Clear speech bubbles
    setPlayers((prev) => prev.map((p) => ({ ...p, currentSpeech: null })));

    if (lance === 'grande') {
      setPhase('grande');
      setCurrentTurn(manoIndex);
      setRecentEvent('Comienza el lance: A LA GRANDE.');
      return;
    }
    if (lance === 'chica') {
      setPhase('chica');
      setCurrentTurn(manoIndex);
      setRecentEvent('Comienza el lance: A LA CHICA.');
      return;
    }
    if (lance === 'pares') {
      setPhase('pares_precheck');
      setCurrentTurn(manoIndex);
      setRecentEvent(`Consulta de Pares: empieza preguntando a ${players[manoIndex]?.name || 'Mano'} (Mano).`);
      return;
    }
    if (lance === 'juego') {
      setPhase('juego_precheck');
      setCurrentTurn(manoIndex);
      setRecentEvent(`Consulta de Juego (>= 31): empieza preguntando a ${players[manoIndex]?.name || 'Mano'} (Mano).`);
      return;
    }
    if (lance === 'punto') {
      setPhase('punto_bet');
      setCurrentTurn(manoIndex);
      setRecentEvent('Nadie tiene Juego: ¡se juega al PUNTO!');
    }
  };

  // The app certifies your pares / juego so nobody can lie («La boca hace ley»)
  const handleUserPrecheckDeclaration = () => {
    const user = playersRef.current[0];
    if (!user) return;
    if (phase === 'pares_precheck') {
      const hasPairs = evaluatePares(user.cards).level > 0;
      const speech = hasPairs ? '¡Pares sí!' : 'Pares no.';
      handleDeclarePares(0, hasPairs, speech);
      setRecentEvent(
        hasPairs
          ? `La app certifica tus naipes: ¡TIENES PARES (${describeParesHand(user.cards).title})! Declaras: «${speech}».`
          : 'La app certifica tus naipes: NO TIENES PARES. Declaras: «Pares no.».'
      );
    } else if (phase === 'juego_precheck') {
      const sum = getHandSum(user.cards);
      const hasJuego = sum >= 31;
      const speech = hasJuego ? '¡Juego sí!' : 'Juego no.';
      handleDeclareJuego(0, hasJuego, speech);
      setRecentEvent(
        hasJuego
          ? `La app certifica tus naipes (suma ${sum}): ¡TIENES JUEGO! Declaras: «${speech}».`
          : `La app certifica tus naipes (suma ${sum}): NO TIENES JUEGO. Declaras: «${speech}».`
      );
    }
  };

  // Shared declaration round for pares and juego
  const handleDeclaration = (kind: 'pares' | 'juego', seat: number, has: boolean, customSpeech?: string) => {
    const table = playersRef.current;
    const p = table[seat];
    if (!p) return;
    const label = kind === 'pares' ? 'Pares' : 'Juego';
    const speech = customSpeech || (has ? `¡${label} sí!` : `${label} no.`);
    const field = kind === 'pares' ? 'declaredPares' : 'declaredJuego';

    if (has) sound.playEnvido();
    else sound.playCard();
    voiceEngine.speakCharacter(p.id, speech);
    setRecentEvent(`${p.name} declara: «${speech}».`);

    const updatedPlayers = table.map((pl, idx) => (idx === seat ? { ...pl, [field]: has, currentSpeech: speech } : pl));
    playersRef.current = updatedPlayers;
    setPlayers((prev) => prev.map((pl, idx) => (idx === seat ? { ...pl, [field]: has, currentSpeech: speech } : pl)));

    const nextSeat = (seat + 1) % 4;
    if (nextSeat !== manoIndex) {
      setCurrentTurn(nextSeat);
      return;
    }

    // Everybody has declared
    const t0Has = updatedPlayers[0][field] === true || updatedPlayers[2][field] === true;
    const t1Has = updatedPlayers[1][field] === true || updatedPlayers[3][field] === true;
    setTransitioning(true);
    const delays = getDelays();

    if (t0Has && t1Has) {
      const firstBettor = getNextEligibleBettorSeat(manoIndex, kind, updatedPlayers);
      setRecentEvent(`⚔️ ¡Ambos equipos tienen ${label}! Se abre el lance. Turno de ${updatedPlayers[firstBettor].name}.`);
      safeTimeout(() => {
        setTransitioning(false);
        setPhase(kind === 'pares' ? 'pares_bet' : 'juego_bet');
        setCurrentTurn(firstBettor);
      }, delays.transition);
      return;
    }

    if (kind === 'pares') {
      setRecentEvent(
        !t0Has && !t1Has
          ? '❌ Ningún equipo tiene Pares. Se pasa al lance de Juego.'
          : `✅ Solo ${t0Has ? 'el Equipo Jugador tiene' : 'los Rivales tienen'} Pares (se cobrarán en el recuento). Se pasa a Juego.`
      );
      safeTimeout(() => {
        setTransitioning(false);
        startLance('juego');
      }, delays.transition);
      return;
    }

    if (!t0Has && !t1Has) {
      setRecentEvent('❌ Nadie tiene Juego (nadie llega a 31). ¡Se abre el lance al PUNTO!');
      safeTimeout(() => {
        setTransitioning(false);
        startLance('punto');
      }, delays.transition);
      return;
    }
    setRecentEvent(
      `✅ Solo ${t0Has ? 'el Equipo Jugador tiene' : 'los Rivales tienen'} Juego (se cobrará en el recuento). Fin de lances.`
    );
    safeTimeout(() => {
      setTransitioning(false);
      resolveHand();
    }, delays.transition);
  };

  const handleDeclarePares = (seat: number, hasPairs: boolean, customSpeech?: string) =>
    handleDeclaration('pares', seat, hasPairs, customSpeech);
  const handleDeclareJuego = (seat: number, hasJuego: boolean, customSpeech?: string) =>
    handleDeclaration('juego', seat, hasJuego, customSpeech);

  // Handle betting action from user or AI
  const executeBetAction = (
    seat: number,
    action: string, // 'paso' | 'envido' | 'envido:N' | 'mas' | 'mas:N' | 'ordago' | 'quiero' | 'no_quiero'
    lanceKey: string
  ) => {
    const table = playersRef.current.length ? playersRef.current : players;
    // Hand the turn to whoever must answer a bet, or close the lance if nobody can
    const passBetToOpponents = (fromSeat: number, team: 0 | 1, onYouMessage: string, otherMessage: string) => {
      const nextSeat = getNextOpposingBettorSeat(fromSeat, team, lanceKey, table);
      if (nextSeat === null) {
        setTransitioning(true);
        safeTimeout(() => {
          setTransitioning(false);
          advanceToNextLance(lanceKey);
        }, getDelays().transition);
        return;
      }
      setRecentEvent(nextSeat === 0 ? onYouMessage : otherMessage);
      setCurrentTurn(nextSeat);
    };
    const actingPlayer = playersRef.current[seat] || players[seat];
    if (!actingPlayer) return;
    const actingTeam = actingPlayer.team;
    const currentBet = lanceBetsRef.current[lanceKey] || lanceBets[lanceKey];

    if (action === 'ordago') {
      sound.playOrdago();
      triggerCameo('ordago');
      setRecentEvent(`🔥 ¡¡${actingPlayer.name} HA CANTADO ÓRDAGO!!`);

      setLanceBets((prev) => ({
        ...prev,
        [lanceKey]: {
          ...prev[lanceKey],
          currentBet: targetPiedras,
          previousBet: currentBet.isOrdago ? currentBet.previousBet : currentBet.currentBet,
          isOrdago: true,
          lastBettorTeam: actingTeam,
          lastBettorIndex: seat,
        },
      }));

      passBetToOpponents(
        seat,
        actingTeam,
        `🔥 ¡${actingPlayer.name} HA CANTADO ÓRDAGO! Tienes la potestad de decidir: ¿Quieres o no quieres?`,
        `🔥 ¡¡${actingPlayer.name} HA CANTADO ÓRDAGO!!`
      );
      return;
    }

    if (action === 'envido' || action.startsWith('envido:')) {
      sound.playEnvido();
      const parsed = action.startsWith('envido:') ? parseInt(action.split(':')[1], 10) : NaN;
      const stones = !isNaN(parsed) && parsed >= 2 ? parsed : 2;
      setLanceBets((prev) => ({
        ...prev,
        [lanceKey]: {
          ...prev[lanceKey],
          currentBet: stones,
          previousBet: 0,
          lastBettorTeam: actingTeam,
          lastBettorIndex: seat,
        },
      }));
      passBetToOpponents(
        seat,
        actingTeam,
        `¡${actingPlayer.name} envida ${stones} piedras! Tienes la potestad de decidir: ¿Quieres o no quieres?`,
        `¡${actingPlayer.name} envida ${stones} piedras!`
      );
      return;
    }

    if (action === 'mas' || action.startsWith('mas:')) {
      sound.playEnvido();
      const parsed = action.startsWith('mas:') ? parseInt(action.split(':')[1], 10) : NaN;
      const added = !isNaN(parsed) && parsed >= 2 ? parsed : 2;
      const base = currentBet.currentBet || 0;
      const newBet = base + added;
      setLanceBets((prev) => ({
        ...prev,
        [lanceKey]: {
          ...prev[lanceKey],
          currentBet: newBet,
          previousBet: base,
          lastBettorTeam: actingTeam,
          lastBettorIndex: seat,
        },
      }));
      passBetToOpponents(
        seat,
        actingTeam,
        `¡${actingPlayer.name} sube ${added} más (${newBet} piedras)! Tienes la potestad de decidir: ¿Quieres o no quieres?`,
        `¡${actingPlayer.name} sube ${added} más! Total: ${newBet} piedras.`
      );
      return;
    }

    if (action === 'quiero') {
      sound.playChip();
      // Bet accepted!
      if (currentBet.isOrdago) {
        setRecentEvent(`¡${actingPlayer.name} DICE QUIERO AL ÓRDAGO! ¡¡A VER LAS CARTAS!!`);
        setShowAllCards(true);
        setTransitioning(true);

        safeTimeout(() => {
          setTransitioning(false);
          // Instant resolution of Órdago on this lance!
          const table = playersRef.current;
          const result = getWinningTeamForLance(lanceKey as any, table, manoIndex);
          setRecentEvent(`¡El lance de ${lanceKey.toUpperCase()} lo gana ${table[result.winningPlayerIndex].name}!`);

          if (result.winningTeam === 0) {
            triggerWin('¡VICTORIA POR ÓRDAGO DEL EQUIPO JUGADOR!');
          } else {
            triggerDefeat('¡LOS RIVALES GANAN EL JUEGO POR ÓRDAGO!');
          }
        }, 2200);
        return;
      }

      // Normal bet accepted
      setRecentEvent(`¡${actingPlayer.name} acepta la apuesta de ${currentBet.currentBet} piedras!`);
      setLanceBets((prev) => ({
        ...prev,
        [lanceKey]: {
          ...prev[lanceKey],
          accepted: true,
          resolved: true,
        },
      }));

      // Move to next lance
      setTransitioning(true);
      const delays = getDelays();
      safeTimeout(() => {
        setTransitioning(false);
        advanceToNextLance(lanceKey);
      }, delays.transition);
      return;
    }

    if (action === 'no_quiero') {
      sound.playCard();
      // Team declined. The betting team immediately gets stones!
      const winningTeam = actingTeam === 0 ? 1 : 0;
      // Declining gives the bettors what was already accepted before the last raise, or 1 stone.
      // (Before, declining an órdago gave targetPiedras - 2 stones and ended the game.)
      const award = currentBet.previousBet && currentBet.previousBet > 0 ? currentBet.previousBet : 1;
      awardPiedras(winningTeam, award, `Retirada en ${lanceKey.toUpperCase()}`);

      setLanceBets((prev) => ({
        ...prev,
        [lanceKey]: {
          ...prev[lanceKey],
          rejected: true,
          resolved: true,
        },
      }));

      setTransitioning(true);
      const delays = getDelays();
      safeTimeout(() => {
        setTransitioning(false);
        advanceToNextLance(lanceKey);
      }, delays.transition);
      return;
    }

    if (action === 'paso') {
      sound.playCard();
      setRecentEvent(`${actingPlayer.name} pasa.`);
      const updatedHistory: BetHistoryItem[] = [
        ...currentBet.history,
        { playerIndex: seat, action: 'paso', text: 'Paso' },
      ];
      setLanceBets((prev) => ({
        ...prev,
        [lanceKey]: { ...prev[lanceKey], history: updatedHistory },
      }));

      const eligibleCount = table.filter((p) => isPlayerEligibleForLance(p, lanceKey)).length;
      const passedCount = updatedHistory.filter((h) => h.action === 'paso').length;
      const nextSeat = getNextEligibleBettorSeat((seat + 1) % 4, lanceKey, table);
      // Everybody who can bet in this lance has passed
      if (passedCount >= eligibleCount || nextSeat === manoIndex) {
        setRecentEvent(`Lance de ${lanceKey.toUpperCase()} pasa en silencio (en blanco).`);
        setTransitioning(true);
        const delays = getDelays();
        safeTimeout(() => {
          setTransitioning(false);
          advanceToNextLance(lanceKey);
        }, delays.transition);
      } else {
        setCurrentTurn(nextSeat);
      }
      return;
    }
  };

  // Advances lance sequence
  const advanceToNextLance = (currentLanceKey: string) => {
    if (currentLanceKey === 'grande') {
      startLance('chica');
    } else if (currentLanceKey === 'chica') {
      startLance('pares');
    } else if (currentLanceKey === 'pares') {
      startLance('juego');
    } else if (currentLanceKey === 'juego' || currentLanceKey === 'punto') {
      resolveHand();
    }
  };

  // Add stones to a team
  const awardPiedras = (team: 0 | 1, count: number, reason: string) => {
    if (handWonRef.current || count <= 0) return;
    sound.playChip();
    setRecentEvent(`+${count} piedras para ${team === 0 ? 'Equipo Jugador' : 'Rivales'} (${reason}).`);

    const ref = team === 0 ? score0Ref : score1Ref;
    const setScore = team === 0 ? setScoreTeam0 : setScoreTeam1;
    const prev = ref.current;
    const newP = prev.piedras + count;
    if (newP >= targetPiedras) {
      const finalScore = { piedras: targetPiedras, juegosWon: prev.juegosWon + 1 };
      ref.current = finalScore;
      setScore(finalScore);
      handWonRef.current = true;
      if (team === 0) triggerWin('¡Equipo Jugador ha alcanzado la meta de piedras!');
      else triggerDefeat('¡Los Rivales han alcanzado la meta de piedras!');
      return;
    }
    const next = { ...prev, piedras: newP };
    ref.current = next;
    setScore(next);
  };

  // Showdown & Recuento de Tantos (Final Scoring)
  const resolveHand = () => {
    if (isScoringRef.current) return;
    isScoringRef.current = true;
    setTransitioning(true);

    setPhase('scoring');
    setShowAllCards(true);
    setRecentEvent('¡A ver las cartas! Se procede al recuento tradicional de tantos paso a paso.');

    const plan = computeHandRecountPlan(playersRef.current, manoIndex, lanceBetsRef.current);
    setRecountPlan(plan);
  };

  const handleLancePointsAwarded = (team: 0 | 1, pts: number, reason: string) => {
    awardPiedras(team, pts, reason);
  };

  const handleFinishRecount = () => {
    if (handWonRef.current) {
      setRecountPlan(null);
      if (gameMode !== 'torneo') setPhase('game_over');
      return;
    }
    setRecountPlan(null);
    setPhase('round_end');
    setRecentEvent('Mano finalizada. Preparaos para la siguiente mano.');
  };

  // Next Hand trigger
  const handleNextHand = () => {
    clearAllPendingTimers();
    setRecountPlan(null);
    isScoringRef.current = false;
    setTransitioning(false);
    const nextMano = (manoIndex + 1) % 4;
    dealNewHand(players, nextMano);
  };

  // Trigger win of game / match / tournament
  const triggerWin = (reason: string) => {
    handWonRef.current = true;
    sound.playVictory();
    triggerCameo('win');
    const winQuote = getCharacterLine(players[0]?.id || 'tio_gil', 'win');
    if (players[0] && winQuote) {
      voiceEngine.speakCharacter(players[0].id, winQuote);
    }
    setRecentEvent(`🏆 ¡¡VICTORIA!! ${reason}`);

    if (gameMode === 'torneo') {
      const nextRound = tournamentRound + 1;
      setTournamentRound(nextRound);
      setTournamentMatches((prev) =>
        prev.map((m, idx) => ({
          ...m,
          defeated: idx < nextRound,
          current: idx === nextRound,
        }))
      );
      const timer = window.setTimeout(() => setView('bracket'), 2500);
      pendingTimersRef.current.push(timer);
    } else {
      setPhase('game_over');
    }
  };

  // Trigger loss
  const triggerDefeat = (reason: string) => {
    handWonRef.current = true;
    const loseQuote = getCharacterLine(players[0]?.id || 'tio_gil', 'lose');
    if (players[0] && loseQuote) {
      voiceEngine.speakCharacter(players[0].id, loseQuote);
    }
    setRecentEvent(`❌ ¡DERROTA! ${reason}`);
    setPhase('game_over');
  };

  // Cameo trigger
  const dismissCameo = React.useCallback(() => setCameo(null), []);

  const triggerCameo = (type: string) => {
    const list = CAMEOS[type] || CAMEOS.ordago;
    const randomCameo = list[Math.floor(Math.random() * list.length)];
    setCameo(randomCameo);
  };

  // A person passes a seña: their partner must be looking at them, and any rival looking catches it
  const handleSendSeña = (seña: Seña, _isTruthful: boolean = true, seat: number = 0) => {
    if (!SEÑA_PHASES.includes(phaseRef.current) || showAllCardsRef.current) {
      if (seat === 0) setRecentEvent('Ahora no es momento de pasar señas.');
      return;
    }
    const table = playersRef.current;
    const sender = table[seat];
    if (!sender || !seña.ruleCheck(sender.cards)) return; // «la boca hace ley»: only truthful señas
    sound.playSeña();
    const currentGazes = gazesRef.current;
    const partnerSeat = partnerOf(seat);
    const partner = table[partnerSeat];
    const partnerLooking = currentGazes[partnerSeat] === seat;
    const watchers = opponentsOf(seat).filter((o) => currentGazes[o] === seat);
    const label = señaShortLabel(seña.id);
    const team = sender.team;

    let nextIntel = intelRef.current;
    if (partnerLooking) nextIntel = addIntel(nextIntel, team, seat, seña.id);
    if (watchers.length) nextIntel = addIntel(nextIntel, team === 0 ? 1 : 0, seat, seña.id);
    updateIntel(nextIntel);

    const you = seat === 0;
    if (watchers.length) {
      const catcher = watchers[0];
      const quote = getSeenSeñaQuote(catcher);
      window.setTimeout(() => {
        sayBriefly(catcher, quote);
        voiceEngine.speakCharacter(table[catcher].id, quote);
      }, 500);
      const names = watchers.map((w) => table[w].name).join(' y ');
      setRecentEvent(
        you
          ? partnerLooking
            ? `👁️ ¡${names} te ha pillado la seña «${label}»! Tu compañero también la ha visto.`
            : `👁️ ¡${names} te ha pillado la seña «${label}» y tu compañero ni te miraba!`
          : `👁️ ¡${names} ha pillado una seña de ${sender.name}!`
      );
    } else if (partnerLooking) {
      window.setTimeout(() => sayBriefly(partnerSeat, '*(Entendido, compañero...)*'), 600);
      if (you) setRecentEvent(`🤫 Seña limpia: ${partner?.name} sabe que llevas «${label}». Nadie más lo ha visto.`);
    } else if (you) {
      setRecentEvent(`🙈 ${partner?.name} no te estaba mirando: la seña «${label}» se ha perdido.`);
    }
  };

  // Host: apply a move sent by another person at the table
  const applyRemoteAction = (a: NetAction) => {
    const seat = toLocalSeat(a.seat, mySeatRef.current);
    if (seat === 0 || !humanSeatsRef.current.has(seat)) return;
    if (a.kind === 'action' && a.action) {
      handleUserAction(a.action, seat);
    } else if (a.kind === 'discard' && a.indices) {
      handleSeatDiscard(seat, a.indices);
    } else if (a.kind === 'seña' && a.señaId) {
      const seña = SEÑAS.find((x) => x.id === a.señaId);
      if (seña) handleSendSeña(seña, true, seat);
    } else if (a.kind === 'gaze' && typeof a.target === 'number') {
      const target = a.target < 0 ? -1 : toLocalSeat(a.target, mySeatRef.current);
      if (target === seat) return;
      const next = [...gazesRef.current] as GazeTarget[];
      next[seat] = target as GazeTarget;
      updateGazes(next);
    }
  };
  const applyRemoteActionRef = useRef(applyRemoteAction);
  applyRemoteActionRef.current = applyRemoteAction;

  // Client: my moves go to the host
  const sendClientMove = (move: Omit<NetAction, 'seq' | 'seat'>) => {
    if (!multiplayerRoom?.id) return;
    multiplayerService.sendAction(multiplayerRoom.id, move).catch((err) => setNetNotice((err as Error).message));
  };

  // Your seña: played here, or sent to the host when you are a guest at an online table
  const sendSeñaFromYou = (seña: Seña) => {
    if (netRole === 'client') {
      if (!seña.ruleCheck(players[0]?.cards || [])) return;
      sound.playSeña();
      sendClientMove({ kind: 'seña', señaId: seña.id });
      return;
    }
    handleSendSeña(seña, true, 0);
  };

  const leaveOnlineTable = () => {
    if (multiplayerRoom?.id) multiplayerService.leaveRoom(multiplayerRoom.id);
    multiplayerService.setActiveRoomId(null);
    clearAllPendingTimers();
    handWonRef.current = true; // stop the engine
    setMultiplayerRoom(null);
    setNetRole('none');
    netRoleRef.current = 'none';
    setHumanSeats([0]);
    setNetNotice(null);
    setRecountPlan(null);
  };

  // User controls action dispatcher
  const handleUserAction = (action: string, seat: number = 0) => {
    if (netRoleRef.current === 'client') {
      // Online client: the host plays the move
      if (action === 'discard') {
        if (phase !== 'discarding' || discardReady.includes(0) || clientSelection.length === 0) return;
        if (discardSentRef.current) return;
        discardSentRef.current = true;
        sendClientMove({ kind: 'discard', indices: clientSelection });
        setDiscardReady((prev) => [...prev, 0]);
      } else if (currentTurn === 0 && !clientBusy) {
        sendClientMove({ kind: 'action', action });
        pendingMoveRef.current = { phase, turn: currentTurn, at: Date.now() };
        setClientBusy(true); // until the host plays it
      }
      return;
    }
    if (isTransitioningRef.current || isScoringRef.current || handWonRef.current) return;
    if (action === 'discard') {
      if (phase !== 'discarding') return;
      handleSeatDiscard(seat, playersRef.current[seat]?.selectedToDiscard || []);
      return;
    }
    if (currentTurn !== seat) return;
    const isLocal = seat === 0;
    const players = playersRef.current;
    const user = players[seat];
    if (action === 'mus') {
      if (isLocal) userProfileEngine.recordAction('mus');
      sound.playCard();
      const speech = getCharacterLine(user?.id || 'tio_gil', 'mus') || '¡Mus!';
      setPlayers((prev) =>
        prev.map((p, i) => (i === seat ? { ...p, currentSpeech: speech, saidMus: true } : p))
      );
      if (user) voiceEngine.speakCharacter(user.id, speech);
      setRecentEvent(isLocal ? 'Has pedido Mus.' : `${user?.name} dice: «Mus».`);
      advanceMusTurn(seat);
    } else if (action === 'no_mus') {
      if (isLocal) userProfileEngine.recordAction('no_mus');
      sound.playEnvido();
      const speech = getCharacterLine(user?.id || 'tio_gil', 'noMus') || '¡No hay mus!';
      setPlayers((prev) =>
        prev.map((p, i) => (i === seat ? { ...p, currentSpeech: speech, saidMus: false } : p))
      );
      if (user) voiceEngine.speakCharacter(user.id, speech);
      setRecentEvent(isLocal ? '¡Cortas el mus! No hay mus.' : `¡${user?.name} corta el mus! No hay mus.`);
      setTransitioning(true);
      const delays = getDelays();
      safeTimeout(() => {
        setTransitioning(false);
        startLance('grande');
      }, delays.transition);
    } else if (action === 'declare_pares_si' || action === 'declare_pares_no') {
      if (phase !== 'pares_precheck') return;
      handleUserPrecheckDeclaration(); // the app certifies the real cards
    } else if (action === 'declare_juego_si' || action === 'declare_juego_no') {
      if (phase !== 'juego_precheck') return;
      handleUserPrecheckDeclaration();
    } else {
      // Betting action
      const lanceKey =
        phase === 'grande'
          ? 'grande'
          : phase === 'chica'
          ? 'chica'
          : phase === 'pares_bet'
          ? 'pares'
          : phase === 'juego_bet'
          ? 'juego'
          : 'punto';

      // Evaluate player's hand strength to teach the AI if the user bluffs or bets for value
      let handStrength = 5.0;
      if (user && user.cards && user.cards.length === 4) {
        if (lanceKey === 'grande') {
          const kings = user.cards.filter((c) => getMusRank(c.number) === 12).length;
          handStrength = kings * 2.5;
        } else if (lanceKey === 'chica') {
          const aces = user.cards.filter((c) => getMusRank(c.number) === 1).length;
          handStrength = aces * 2.5;
        } else if (lanceKey === 'pares') {
          const p = evaluatePares(user.cards);
          handStrength = p.type === 'duples' ? 8.5 : p.type === 'medias' ? 6.5 : p.type === 'par' ? 3.5 : 0;
        } else if (lanceKey === 'juego') {
          const sum = getHandSum(user.cards);
          handStrength = sum === 31 ? 10 : sum === 32 ? 8.5 : sum >= 33 ? 5 : 0;
        } else if (lanceKey === 'punto') {
          const sum = getHandSum(user.cards);
          handStrength = sum === 30 ? 9 : sum >= 27 ? 6 : 3;
        }
      }
      // Only moves that make sense right now (a remote browser could send anything)
      const bet = lanceBetsRef.current[lanceKey] || currentBetState;
      const base = action.split(':')[0];
      const isBettingPhase = ['grande', 'chica', 'pares_bet', 'juego_bet', 'punto_bet'].includes(phase);
      const allowed =
        isBettingPhase &&
        isPlayerEligibleForLance(user, lanceKey) &&
        (bet.currentBet === 0
          ? ['paso', 'envido', 'ordago'].includes(base)
          : ['quiero', 'no_quiero', 'ordago'].includes(base) || (base === 'mas' && !bet.isOrdago));
      if (!allowed) return;

      if (isLocal) {
        userProfileEngine.recordAction(base as any, lanceKey, handStrength, currentBetState.isOrdago);
      }

      let speech = 'Paso.';
      if (action === 'envido') speech = getCharacterLine(user?.id || 'tio_gil', 'envido') || '¡Envido dos piedras!';
      if (action.startsWith('envido:')) speech = `¡Envido ${action.split(':')[1]} piedras!`;
      if (action === 'mas') speech = '¡Dos más!';
      if (action.startsWith('mas:')) speech = `¡${action.split(':')[1]} más!`;
      if (action === 'ordago') speech = getCharacterLine(user?.id || 'tio_gil', 'ordago') || '¡¡ÓRDAGO!!';
      if (action === 'quiero') speech = getCharacterLine(user?.id || 'tio_gil', 'quiero') || '¡Quiero!';
      if (action === 'no_quiero') speech = getCharacterLine(user?.id || 'tio_gil', 'noQuiero') || 'No quiero.';

      setPlayers((prev) =>
        prev.map((p, i) => (i === seat ? { ...p, currentSpeech: speech } : p))
      );
      if (user) voiceEngine.speakCharacter(user.id, speech);

      executeBetAction(seat, action as any, lanceKey);
    }
  };

  // Card click during discard
  const handleCardClick = (cardIndex: number) => {
    if (phase !== 'discarding' || discardReady.includes(0)) return;
    sound.playCard();
    if (netRole === 'client') {
      const next = clientSelection.includes(cardIndex)
        ? clientSelection.filter((x) => x !== cardIndex)
        : [...clientSelection, cardIndex];
      setClientSelection(next);
      setPlayers((prev) => prev.map((p, i) => (i === 0 ? { ...p, selectedToDiscard: next } : p)));
      return;
    }
    setPlayers((prev) =>
      prev.map((p, i) => {
        if (i !== 0) return p;
        const current = p.selectedToDiscard || [];
        const next = current.includes(cardIndex)
          ? current.filter((x) => x !== cardIndex)
          : [...current, cardIndex];
        return { ...p, selectedToDiscard: next };
      })
    );
  };

  return (
    <div className="min-h-screen text-stone-100 flex flex-col justify-between">
      {/* Retro CRT overlay & Top bar */}
      <RetroDosOverlay
        crtEnabled={crtEnabled}
        onToggleCrt={() => setCrtEnabled(!crtEnabled)}
        onOpenRules={() => setRulesOpen(true)}
        onExitGame={() => {
          clearSavedGame();
          if (gameMode === 'multijugador') leaveOnlineTable();
          clearAllPendingTimers();
          handWonRef.current = true; // stops AI turns and pending transitions
          setRecountPlan(null);
          setCameo(null);
          setView('select');
        }}
        onOpenMultiplayer={() => setView('multiplayer')}
        onOpenTutorial={() => setView('tutorial')}
        onOpenUserControl={() => setUserControlOpen(true)}
        gameMode={gameMode}
        gameSpeed={gameSpeed}
        onChangeGameSpeed={() =>
          setGameSpeed((prev) =>
            prev === 'tranquilo' ? 'normal' : prev === 'normal' ? 'rapido' : 'tranquilo'
          )
        }
      />

      {/* Cameo guest pop-up banner */}
      <CameoBanner cameo={cameo} onDismiss={dismissCameo} />

      {/* VIEW 1: CHARACTER & MODE SELECT */}
      {view === 'select' && (
        <CharacterSelect
          onStartGame={handleStartGame}
          onOpenMultiplayer={() => setView('multiplayer')}
          onOpenTutorial={() => setView('tutorial')}
          onOpenUserControl={() => setUserControlOpen(true)}
        />
      )}

      {/* VIEW 2: MULTIPLAYER LOBBY */}
      {view === 'multiplayer' && (
        <MultiplayerLobby
          onBackToMenu={() => setView('select')}
          onStartGame={handleStartMultiplayerGame}
        />
      )}

      {/* VIEW 3: INTERACTIVE TUTORIAL */}
      {view === 'tutorial' && (
        <InteractiveTutorial
          onBackToMenu={() => setView('select')}
          onStartGame={handleTutorialStartGame}
        />
      )}

      {/* VIEW 4: TOURNAMENT BRACKET (3 ROUNDS) */}
      {view === 'bracket' && (
        <TournamentBracket
          currentRoundIndex={tournamentRound}
          matches={tournamentMatches}
          onContinueMatch={() => {
            clearAllPendingTimers();
            const match = tournamentMatches[tournamentRound];
            const rivalChars = (match?.rivals || [])
              .map((name) => PC_MUS_CHARACTERS.find((c) => c.name === name))
              .filter((c): c is CharacterInfo => !!c);
            const matchPlayers = players.map((p) => {
              if (p.team !== 1 || rivalChars.length < 2) return p;
              const char = rivalChars[p.seat === 1 ? 0 : 1];
              return {
                ...p,
                id: char.id,
                name: char.name,
                realName: char.realName,
                quote: char.presentation,
                avatarColor: char.visual.bgColor,
                avatarIcon: char.visual.emoji,
                description: char.description,
                aggressiveness: char.aggressiveness,
                bluffRate: char.bluffRate,
              };
            });
            const zero = { piedras: 0, juegosWon: 0 };
            score0Ref.current = zero;
            score1Ref.current = zero;
            setScoreTeam0(zero);
            setScoreTeam1(zero);
            setPlayers(matchPlayers);
            setView('game');
            dealNewHand(matchPlayers, 0);
          }}
          onResetTournament={() => {
            setTournamentRound(0);
            setView('select');
          }}
        />
      )}

      {/* VIEW 5: ACTIVE MUS GAME */}
      {view === 'game' && players.length === 4 && (
        <main className="flex-1 flex flex-col justify-between px-2 sm:px-4 py-1 max-w-6xl mx-auto w-full">
          {/* Multiplayer in-game room header banner */}
          {gameMode === 'multijugador' && multiplayerRoom && (
            <div className="bg-stone-900/90 border border-amber-600/50 rounded-2xl px-3 py-1.5 mb-2 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs max-w-6xl mx-auto w-full shadow-lg">
              <div className="flex items-center gap-2">
                <span className="text-emerald-400 font-mono text-[11px] flex items-center gap-1 font-bold">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping inline-block" />
                  SALA ONLINE
                </span>
                <span className="font-serif font-bold text-amber-300">{multiplayerRoom.name}</span>
                <span className="font-mono bg-stone-950 px-2 py-0.5 rounded text-[10px] text-amber-400 border border-stone-800">
                  CÓDIGO: {multiplayerRoom.code}
                </span>
                <span className="text-[10px] text-stone-400">
                  (Asiento {['Sur', 'Este', 'Norte', 'Oeste'][localSeatIndex]} · {netRole === 'host' ? 'anfitrión' : 'invitado'})
                </span>
              </div>
              {netNotice && (
                <span className="text-[11px] font-bold text-rose-300 bg-rose-950/70 border border-rose-700/60 rounded-lg px-2 py-0.5">
                  ⚠️ {netNotice}
                </span>
              )}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setChatModalOpen(true)}
                  className="px-2.5 py-1 rounded-lg bg-stone-800 hover:bg-stone-700 text-amber-300 font-bold text-[11px] border border-amber-500/40 flex items-center gap-1 transition"
                >
                  <span>💬</span>
                  <span>Chat ({multiplayerRoom.chat.length})</span>
                </button>
                <button
                  onClick={() => {
                    leaveOnlineTable();
                    setView('multiplayer');
                  }}
                  className="px-2.5 py-1 rounded-lg bg-stone-800 hover:bg-red-900/60 text-stone-300 hover:text-red-200 text-[11px] font-bold border border-stone-700 transition"
                >
                  Abandonar Mesa
                </button>
              </div>
            </div>
          )}

          {/* Tanteador (Scoreboard) */}
          <Tanteador
            scoreTeam0={scoreTeam0}
            scoreTeam1={scoreTeam1}
            targetPiedras={targetPiedras}
            manoTeam={players[manoIndex]?.team ?? 0}
            playerNames={{
              team0: `${players[0].name} & ${players[2].name}`,
              team1: `${players[1].name} & ${players[3].name}`,
            }}
          />

          {/* Central Mus Green Felt Table */}
          <Table
            players={players}
            manoIndex={manoIndex}
            currentLanceName={activeLanceName}
            phase={phase}
            betState={currentBetState}
            showAllCards={showAllCards}
            onCardClick={handleCardClick}
            recentEvent={recentEvent}
            scoreTeam0={scoreTeam0}
            scoreTeam1={scoreTeam1}
            targetPiedras={targetPiedras}
            onOpenUserControl={() => setUserControlOpen(true)}
            activeUser={activeUser}
            gameSpeed={gameSpeed}
            onChangeGameSpeed={() =>
              setGameSpeed((prev) =>
                prev === 'tranquilo' ? 'normal' : prev === 'normal' ? 'rapido' : 'tranquilo'
              )
            }
            gazes={gazes}
            intel={intel}
            onSetHumanGaze={(t) => {
              const next = [...gazesRef.current] as GazeTarget[];
              next[0] = t;
              updateGazes(next);
              if (netRole === 'client') {
                sendClientMove({ kind: 'gaze', target: t < 0 ? -1 : absoluteSeat(t, mySeatRef.current) });
              }
            }}
            validSeñas={getValidSeñas(players[0]?.cards || [])}
            señasEnabled={SEÑA_PHASES.includes(phase) && !showAllCards}
            onQuickSeña={sendSeñaFromYou}
          />

          {/* Recuento Tradicional de Tantos (Paso a paso, animado y pausado) */}
          {phase === 'scoring' && recountPlan && (
            <RecuentoOverlay
              recountPlan={recountPlan}
              players={players}
              scoreTeam0={scoreTeam0}
              scoreTeam1={scoreTeam1}
              targetPiedras={targetPiedras}
              gameSpeed={gameSpeed}
              onLancePointsAwarded={netRole === 'client' ? undefined : handleLancePointsAwarded}
              onFinishRecount={netRole === 'client' ? () => {} : handleFinishRecount}
            />
          )}

          {/* Player controls & status bar */}
          {phase !== 'round_end' && phase !== 'game_over' ? (
            <Controls
              isPlayerTurn={
                phase === 'discarding'
                  ? !discardReady.includes(0)
                  : currentTurn === 0 && !(netRole === 'client' ? clientBusy : isTransitioning)
              }
              phase={phase}
              currentLanceName={activeLanceName}
              betState={currentBetState}
              selectedCardCount={players[0]?.selectedToDiscard?.length || 0}
              onAction={handleUserAction}
              onOpenSeñas={() => setSeñasOpen(true)}
              waitingMessage={
                phase === 'discarding' && discardReady.includes(0)
                  ? `Esperando los descartes de ${humanSeats
                      .filter((h) => !discardReady.includes(h))
                      .map((h) => players[h]?.name)
                      .join(' y ') || 'la mesa'}...`
                  : players[currentTurn]
                  ? phase === 'pares_bet' && !players[0]?.declaredPares
                    ? `Turno de ${players[currentTurn].name}. (Sin pares: tu compañero defiende a tu pareja)`
                    : phase === 'juego_bet' && !players[0]?.declaredJuego
                    ? `Turno de ${players[currentTurn].name}. (Sin juego: tu compañero defiende a tu pareja)`
                    : `Turno de ${players[currentTurn].name}...`
                  : null
              }
              userHasPares={players[0]?.hasPares}
              userParesType={players[0]?.cards?.length === 4 ? describeParesHand(players[0].cards).title : undefined}
              userParesDetail={players[0]?.cards?.length === 4 ? describeParesHand(players[0].cards).detail : undefined}
              userHasJuego={players[0]?.hasJuego}
              userJuegoSum={players[0]?.cards?.length === 4 ? getHandSum(players[0].cards) : undefined}
              userJuegoDetail={players[0]?.cards?.length === 4 ? describeJuegoHand(players[0].cards).detail : undefined}
            />
          ) : (
            <div className="bg-stone-900 border-2 border-amber-500 rounded-2xl p-4 max-w-md mx-auto text-center shadow-2xl my-2">
              <h3 className="font-serif font-black text-lg text-amber-300 mb-1">
                {phase === 'game_over' ? '¡PARTIDA CONCLUIDA!' : '¡MANO COMPLETADA!'}
              </h3>
              <p className="text-xs text-stone-300 mb-3">{recentEvent}</p>
              {phase === 'round_end' && netRole === 'client' ? (
                <p className="text-xs font-bold text-emerald-300 animate-pulse">
                  Esperando a que el anfitrión reparta la siguiente mano...
                </p>
              ) : phase === 'round_end' ? (
                <button
                  onClick={handleNextHand}
                  className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-sm shadow-lg transition active:scale-95"
                >
                  Repartir Siguiente Mano
                </button>
              ) : (
                <button
                  onClick={() => {
                    clearSavedGame();
                    if (gameMode === 'multijugador') leaveOnlineTable();
                    setView('select');
                  }}
                  className="px-6 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold text-sm shadow-lg transition active:scale-95"
                >
                  Volver al Menú Principal
                </button>
              )}
            </div>
          )}
        </main>
      )}

      {/* Señas Modal */}
      <SeñasModal
        isOpen={señasOpen}
        onClose={() => setSeñasOpen(false)}
        onSendSeña={sendSeñaFromYou}
        playerCards={players[0]?.cards || []}
      />

      {/* In-Game Multiplayer Chat Modal */}
      <MultiplayerChatModal
        isOpen={chatModalOpen}
        onClose={() => setChatModalOpen(false)}
        room={multiplayerRoom}
        localSeatIndex={localSeatIndex}
      />

      {/* Rules & History Modal */}
      <RulesModal isOpen={rulesOpen} onClose={() => setRulesOpen(false)} />

      {/* User Control & AI Tactical Learning Modal */}
      <UserControlModal
        isOpen={userControlOpen}
        onClose={() => setUserControlOpen(false)}
        onUserChanged={(u) => setActiveUser(u)}
      />

      {/* Bottom status line */}
      <footer className="w-full py-1 text-center text-[10px] text-stone-400 border-t border-stone-800/60 bg-stone-950/80">
        PC Mus • Baraja Española de 40 cartas (8 Reyes)
      </footer>
    </div>
  );
}
