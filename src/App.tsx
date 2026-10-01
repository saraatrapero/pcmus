import React, { useState, useEffect, useRef } from 'react';
import {
  Card,
  Player,
  TeamScore,
  LancePhase,
  LanceBetState,
  GameMode,
  TournamentMatch,
  Seña,
  GameLogEntry,
} from './types';
import { PC_MUS_CHARACTERS, CharacterInfo, CAMEOS, Cameo, getCharacterLine } from './characters';
import {
  createDeck,
  evaluatePares,
  getHandSum,
  getWinningTeamForLance,
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

  // Start multiplayer game when ready from lobby
  const handleStartMultiplayerGame = (room: MultiplayerRoom, localSeat: number) => {
    setGameMode('multijugador');
    setMultiplayerRoom(room);
    setLocalSeatIndex(localSeat);
    setTargetPiedras(room.targetPiedras);
    setScoreTeam0({ piedras: 0, juegosWon: 0 });
    setScoreTeam1({ piedras: 0, juegosWon: 0 });

    const newPlayers: Player[] = room.seats.map((s, idx) => {
      const char =
        PC_MUS_CHARACTERS.find((c) => c.id === s.characterId) ||
        PC_MUS_CHARACTERS[idx % PC_MUS_CHARACTERS.length];
      return {
        id: s.playerId || char.id,
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

    setPlayers(newPlayers);
    setManoIndex(0);
    setView('game');
    dealNewHand(newPlayers, 0);
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

  // Keep multiplayer room state updated
  useEffect(() => {
    if (!multiplayerRoom?.id) return;
    const unsubscribe = multiplayerService.subscribeToRoom(multiplayerRoom.id, (updated) => {
      setMultiplayerRoom(updated);
    });
    return () => unsubscribe();
  }, [multiplayerRoom?.id]);

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
      };
    });

    setDeck(newDeck);
    discardPileRef.current = [];
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

  // AI Turn automation ticker.
  // Instead of a single timeout (which was lost if it fired during a transition and the game
  // froze), it polls until the turn can be played, and always calls the latest handler.
  useEffect(() => {
    if (view !== 'game' || players.length === 0) return;
    const isTurnPhase = ['mus_dialog', 'grande', 'chica', 'pares_bet', 'juego_bet', 'punto_bet'].includes(phase);
    if (!isTurnPhase || currentTurn === 0 || currentTurn < 0) return;

    const startedAt = Date.now();
    const delay = getDelays().aiTurn;
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
  }, [currentTurn, phase, view, gameSpeed, players.length]);

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
      const table = playersRef.current;
      if (table.length !== 4) return;
      const now = Date.now();

      // 1. Random neck movements
      let changed = false;
      const next = [...gazesRef.current] as GazeTarget[];
      for (let seat = 1; seat < 4; seat++) {
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

    const currentLanceBet = lanceBets[lanceKey];
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

  // Discarding cards
  const handleUserDiscard = () => {
    sound.playCard();
    const user = players[0];
    const userDiscardIndices = user.selectedToDiscard || [];

    // Everybody draws from the same remaining deck (before, each player drew from its own copy
    // and cards were duplicated). When it runs out, the previous discards are reshuffled.
    let remainingDeck = [...deck];
    let discardPile = [...discardPileRef.current];
    const updatedPlayers = players.map((p, idx) => {
      const discards = idx === 0 ? userDiscardIndices : getAIDiscardIndices(p.cards);
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
      };
    });

    setDeck(remainingDeck);
    discardPileRef.current = discardPile;
    setPlayers(updatedPlayers);
    resetSeñasForNewCards();
    setRecentEvent('Se han repartido los nuevos naipes de descarte. Nueva consulta de Mus.');
    setPhase('mus_dialog');
    setCurrentTurn(manoIndex);
  };

  // Start a betting lance
  const startLance = (lance: 'grande' | 'chica' | 'pares' | 'juego' | 'punto') => {
    const players = playersRef.current;
    // Clear speech bubbles
    setPlayers((prev) => prev.map((p) => ({ ...p, currentSpeech: null })));

    if (lance === 'pares') {
      // Check who has pairs
      const t0Has = evaluatePares(players[0].cards).level > 0 || evaluatePares(players[2].cards).level > 0;
      const t1Has = evaluatePares(players[1].cards).level > 0 || evaluatePares(players[3].cards).level > 0;

      if (!t0Has && !t1Has) {
        setRecentEvent('Nadie tiene Pares. Se pasa al siguiente lance.');
        setTransitioning(true);
        const delays = getDelays();
        safeTimeout(() => {
          setTransitioning(false);
          startLance('juego');
        }, delays.transition);
        return;
      }
      if (t0Has && !t1Has) {
        setRecentEvent('Solo el Equipo Jugador tiene Pares (se cobrarán en el recuento).');
        setTransitioning(true);
        const delays = getDelays();
        safeTimeout(() => {
          setTransitioning(false);
          startLance('juego');
        }, delays.transition);
        return;
      }
      if (!t0Has && t1Has) {
        setRecentEvent('Solo los Rivales tienen Pares (se cobrarán en el recuento).');
        setTransitioning(true);
        const delays = getDelays();
        safeTimeout(() => {
          setTransitioning(false);
          startLance('juego');
        }, delays.transition);
        return;
      }

      setPhase('pares_bet');
      setCurrentTurn(manoIndex);
      setRecentEvent('¡Ambos equipos tienen Pares! Se abre el lance de Pares.');
      return;
    }

    if (lance === 'juego') {
      // Check who has Juego (>= 31)
      const t0Has = getHandSum(players[0].cards) >= 31 || getHandSum(players[2].cards) >= 31;
      const t1Has = getHandSum(players[1].cards) >= 31 || getHandSum(players[3].cards) >= 31;

      if (!t0Has && !t1Has) {
        setRecentEvent('Nadie tiene Juego (>= 31). ¡Se juega al PUNTO!');
        setPhase('punto_bet');
        setCurrentTurn(manoIndex);
        return;
      }
      if (t0Has && !t1Has) {
        setRecentEvent('Solo el Equipo Jugador tiene Juego (se cobrará en el recuento).');
        setTransitioning(true);
        const delays = getDelays();
        safeTimeout(() => {
          setTransitioning(false);
          resolveHand();
        }, delays.transition);
        return;
      }
      if (!t0Has && t1Has) {
        setRecentEvent('Solo los Rivales tienen Juego (se cobrarán en el recuento).');
        setTransitioning(true);
        const delays = getDelays();
        safeTimeout(() => {
          setTransitioning(false);
          resolveHand();
        }, delays.transition);
        return;
      }

      setPhase('juego_bet');
      setCurrentTurn(manoIndex);
      setRecentEvent('¡Ambos equipos tienen Juego! Se abre el lance de Juego.');
      return;
    }

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
  };

  // Handle betting action from user or AI
  const executeBetAction = (
    seat: number,
    action: 'paso' | 'envido' | 'mas' | 'ordago' | 'quiero' | 'no_quiero',
    lanceKey: string
  ) => {
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

      // Pass turn to opposing team
      const nextSeat = (seat + 1) % 4;
      setCurrentTurn(nextSeat);
      return;
    }

    if (action === 'envido') {
      sound.playEnvido();
      setRecentEvent(`¡${actingPlayer.name} envida 2 piedras!`);
      setLanceBets((prev) => ({
        ...prev,
        [lanceKey]: {
          ...prev[lanceKey],
          currentBet: 2,
          previousBet: 0,
          lastBettorTeam: actingTeam,
          lastBettorIndex: seat,
        },
      }));
      const nextSeat = (seat + 1) % 4;
      setCurrentTurn(nextSeat);
      return;
    }

    if (action === 'mas') {
      sound.playEnvido();
      // "Envido 4" with nothing on the table opens at 4; otherwise two more
      const base = currentBet.currentBet || 0;
      const newBet = base === 0 ? 4 : base + 2;
      setRecentEvent(`¡${actingPlayer.name} sube dos más! Total: ${newBet} piedras.`);
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
      const nextSeat = (seat + 1) % 4;
      setCurrentTurn(nextSeat);
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
      const nextSeat = (seat + 1) % 4;
      // If everyone passed full cycle
      if (nextSeat === manoIndex) {
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

  // Handle Seña sent by user: your partner must be looking at you, and any rival looking will catch it
  const handleSendSeña = (seña: Seña, _isTruthful: boolean = true) => {
    if (!SEÑA_PHASES.includes(phaseRef.current) || showAllCardsRef.current) {
      setRecentEvent('Ahora no es momento de pasar señas.');
      return;
    }
    sound.playSeña();
    const table = playersRef.current;
    const currentGazes = gazesRef.current;
    const partner = table[2];
    const partnerLooking = currentGazes[2] === 0;
    const watchers = [1, 3].filter((s) => currentGazes[s] === 0);
    const label = señaShortLabel(seña.id);

    let nextIntel = intelRef.current;
    if (partnerLooking) nextIntel = addIntel(nextIntel, 0, 0, seña.id);
    if (watchers.length) nextIntel = addIntel(nextIntel, 1, 0, seña.id);
    updateIntel(nextIntel);

    if (watchers.length) {
      const catcher = watchers[0];
      const quote = getSeenSeñaQuote(catcher);
      window.setTimeout(() => {
        sayBriefly(catcher, quote);
        voiceEngine.speakCharacter(table[catcher].id, quote);
      }, 500);
      const names = watchers.map((w) => table[w].name).join(' y ');
      setRecentEvent(
        partnerLooking
          ? `👁️ ¡${names} te ha pillado la seña «${label}»! Tu compañero también la ha visto.`
          : `👁️ ¡${names} te ha pillado la seña «${label}» y tu compañero ni te miraba!`
      );
    } else if (partnerLooking) {
      window.setTimeout(() => sayBriefly(2, '*(Entendido, compañero...)*'), 600);
      setRecentEvent(`🤫 Seña limpia: ${partner?.name} sabe que llevas «${label}». Nadie más lo ha visto.`);
    } else {
      setRecentEvent(`🙈 ${partner?.name} no te estaba mirando: la seña «${label}» se ha perdido.`);
    }
  };

  // User controls action dispatcher
  const handleUserAction = (action: string) => {
    if (isTransitioningRef.current || isScoringRef.current || handWonRef.current) return;
    if (action === 'discard' ? phase !== 'discarding' : currentTurn !== 0) return;
    const user = players[0];
    if (action === 'mus') {
      userProfileEngine.recordAction('mus');
      sound.playCard();
      const speech = getCharacterLine(user?.id || 'tio_gil', 'mus') || '¡Mus!';
      setPlayers((prev) =>
        prev.map((p, i) => (i === 0 ? { ...p, currentSpeech: speech, saidMus: true } : p))
      );
      if (user) voiceEngine.speakCharacter(user.id, speech);
      setRecentEvent('Has pedido Mus.');
      advanceMusTurn(0);
    } else if (action === 'no_mus') {
      userProfileEngine.recordAction('no_mus');
      sound.playEnvido();
      const speech = getCharacterLine(user?.id || 'tio_gil', 'noMus') || '¡No hay mus!';
      setPlayers((prev) =>
        prev.map((p, i) => (i === 0 ? { ...p, currentSpeech: speech, saidMus: false } : p))
      );
      if (user) voiceEngine.speakCharacter(user.id, speech);
      setRecentEvent('¡Cortas el mus! No hay mus.');
      setTransitioning(true);
      const delays = getDelays();
      safeTimeout(() => {
        setTransitioning(false);
        startLance('grande');
      }, delays.transition);
    } else if (action === 'discard') {
      handleUserDiscard();
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
      userProfileEngine.recordAction(
        action as any,
        lanceKey,
        handStrength,
        currentBetState.isOrdago
      );

      let speech = 'Paso.';
      if (action === 'envido') speech = getCharacterLine(user?.id || 'tio_gil', 'envido') || '¡Envido dos piedras!';
      if (action === 'mas') speech = '¡Dos más!';
      if (action === 'ordago') speech = getCharacterLine(user?.id || 'tio_gil', 'ordago') || '¡¡ÓRDAGO!!';
      if (action === 'quiero') speech = getCharacterLine(user?.id || 'tio_gil', 'quiero') || '¡Quiero!';
      if (action === 'no_quiero') speech = getCharacterLine(user?.id || 'tio_gil', 'noQuiero') || 'No quiero.';

      setPlayers((prev) =>
        prev.map((p, i) => (i === 0 ? { ...p, currentSpeech: speech } : p))
      );
      if (user) voiceEngine.speakCharacter(user.id, speech);

      executeBetAction(0, action as any, lanceKey);
    }
  };

  // Card click during discard
  const handleCardClick = (cardIndex: number) => {
    if (phase !== 'discarding') return;
    sound.playCard();
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
                  ({['Sur (Tú)', 'Este', 'Norte (Pareja)', 'Oeste'][localSeatIndex]})
                </span>
              </div>
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
                    multiplayerService.leaveRoom(multiplayerRoom.id);
                    setMultiplayerRoom(null);
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
            }}
            validSeñas={getValidSeñas(players[0]?.cards || [])}
            señasEnabled={SEÑA_PHASES.includes(phase) && !showAllCards}
            onQuickSeña={(seña) => handleSendSeña(seña, true)}
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
              onLancePointsAwarded={handleLancePointsAwarded}
              onFinishRecount={handleFinishRecount}
            />
          )}

          {/* Player controls & status bar */}
          {phase !== 'round_end' && phase !== 'game_over' ? (
            <Controls
              isPlayerTurn={currentTurn === 0 && !isTransitioning}
              phase={phase}
              currentLanceName={activeLanceName}
              betState={currentBetState}
              selectedCardCount={players[0]?.selectedToDiscard?.length || 0}
              onAction={handleUserAction}
              onOpenSeñas={() => setSeñasOpen(true)}
              waitingMessage={
                players[currentTurn] ? `Turno de ${players[currentTurn].name}...` : null
              }
            />
          ) : (
            <div className="bg-stone-900 border-2 border-amber-500 rounded-2xl p-4 max-w-md mx-auto text-center shadow-2xl my-2">
              <h3 className="font-serif font-black text-lg text-amber-300 mb-1">
                {phase === 'game_over' ? '¡PARTIDA CONCLUIDA!' : '¡MANO COMPLETADA!'}
              </h3>
              <p className="text-xs text-stone-300 mb-3">{recentEvent}</p>
              {phase === 'round_end' ? (
                <button
                  onClick={handleNextHand}
                  className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-sm shadow-lg transition active:scale-95"
                >
                  Repartir Siguiente Mano
                </button>
              ) : (
                <button
                  onClick={() => setView('select')}
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
        onSendSeña={handleSendSeña}
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
        PC Mus 1996 • Homenaje al clásico de Círculo ASM y Dinamic Multimedia • Baraja Española de 40 cartas (8 Reyes)
      </footer>
    </div>
  );
}
