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
  MultiplayerRoom,
} from './types';
import { PC_MUS_CHARACTERS, CharacterInfo, CAMEOS, Cameo, getCharacterLine } from './characters';
import {
  createDeck,
  evaluatePares,
  getHandSum,
  getMusRank,
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
import { RecuentoOverlay } from './components/RecuentoOverlay';
import { computeHandRecountPlan, HandRecountPlan } from './recuentoCalculator';

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

  const clearAllPendingTimers = () => {
    pendingTimersRef.current.forEach((t) => clearTimeout(t));
    pendingTimersRef.current = [];
  };

  const safeTimeout = (fn: () => void, ms: number) => {
    const timer = window.setTimeout(() => {
      fn();
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
      setTournamentMatches([
        { roundName: 'Cuartos de Final', rivals: [rivalChars[0].name, rivalChars[1].name], defeated: false, current: true },
        { roundName: 'Semifinales', rivals: ['El Isidoro', 'Doña Norma'], defeated: false, current: false },
        { roundName: 'Gran Final', rivals: ['El Marqués', 'Tío Mateo'], defeated: false, current: false },
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
      const paresEval = evaluatePares(cards);
      const handSum = getHandSum(cards);
      return {
        ...p,
        cards,
        selectedToDiscard: [],
        currentSpeech: null,
        lastGesture: null,
        saidMus: null,
        hasPares: paresEval.level > 0,
        declaredPares: null,
        hasJuego: handSum >= 31,
        declaredJuego: null,
        juegoValue: handSum,
      };
    });

    setDeck(newDeck);
    setPlayers(dealtPlayers);
    setShowAllCards(false);
    setManoIndex(mano);
    setCurrentTurn(mano);
    setPhase('mus_dialog');
    setRecentEvent(`Mano: ${dealtPlayers[mano].name}. Se inicia consulta de Mus.`);
    isScoringRef.current = false;
    handWonRef.current = false;
    isTransitioningRef.current = false;
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

  // User hand precheck certification handler:
  // The app certifies the hand automatically according to authentic Mus rules so no one can lie.
  const handleUserPrecheckDeclaration = () => {
    if (players.length === 0) return;
    if (isTransitioningRef.current || isScoringRef.current || handWonRef.current) return;
    const user = players[0];
    if (!user) return;

    if (phase === 'pares_precheck') {
      const paresEval = evaluatePares(user.cards);
      const hasPairs = paresEval.level > 0;
      const paresDesc = describeParesHand(user.cards);
      const speech = hasPairs ? '¡Pares sí!' : 'Pares no.';
      setRecentEvent(
        hasPairs
          ? `La app certifica tus naipes: ¡TIENES PARES (${paresDesc.title})! Declaras: «${speech}».`
          : 'La app certifica tus naipes: NO TIENES PARES. Declaras: «Pares no.».'
      );
      handleDeclarePares(0, hasPairs, speech);
    } else if (phase === 'juego_precheck') {
      const sum = getHandSum(user.cards);
      const hasJuego = sum >= 31;
      const speech = hasJuego ? '¡Juego sí!' : 'Juego no.';
      setRecentEvent(
        hasJuego
          ? `La app certifica tus naipes (suma ${sum}): ¡TIENES JUEGO! Declaras: «${speech}».`
          : `La app certifica tus naipes (suma ${sum}): NO TIENES JUEGO (Punto). Declaras: «${speech}».`
      );
      handleDeclareJuego(0, hasJuego, speech);
    }
  };

  // AI & Automation Turn ticker (guarded against duplicate ticks and race loops)
  useEffect(() => {
    if (view !== 'game' || players.length === 0) return;
    if (isTransitioningRef.current || isScoringRef.current || handWonRef.current) return;

    // Only run during active turn-based phases (never during scoring, round_end, or discarding)
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

    if (!isTurnPhase) return;

    const isPrecheck = phase === 'pares_precheck' || phase === 'juego_precheck';

    // If it's precheck, the app automatically evaluates and declares for EVERYONE (including user seat 0)
    // so that the player cannot lie and the app decides according to the real cards.
    if (currentTurn === 0 && isPrecheck) {
      const delays = getDelays();
      const timer = window.setTimeout(() => {
        if (isTransitioningRef.current || isScoringRef.current || handWonRef.current) return;
        handleUserPrecheckDeclaration();
      }, delays.aiTurn);
      return () => clearTimeout(timer);
    }

    // Safety: If it's pares_bet or juego_bet and seat 0 has no pairs / no juego, seat 0 cannot bet!
    if (currentTurn === 0) {
      if (phase === 'pares_bet' && !players[0]?.declaredPares) {
        const nextSeat = getNextEligibleBettorSeat(1, 'pares', players);
        setCurrentTurn(nextSeat);
        return;
      }
      if (phase === 'juego_bet' && !players[0]?.declaredJuego) {
        const nextSeat = getNextEligibleBettorSeat(1, 'juego', players);
        setCurrentTurn(nextSeat);
        return;
      }
    }

    // Is it an AI turn?
    if (currentTurn !== 0 && currentTurn >= 0) {
      const delays = getDelays();
      const timer = window.setTimeout(() => {
        if (isTransitioningRef.current || isScoringRef.current || handWonRef.current) return;
        handleAITurn();
      }, delays.aiTurn);
      return () => clearTimeout(timer);
    }
  }, [currentTurn, phase, view, gameSpeed, players]);

  // Execute AI action based on phase
  const handleAITurn = () => {
    if (players.length === 0) return;
    if (isTransitioningRef.current || isScoringRef.current || handWonRef.current) return;
    const aiPlayer = players[currentTurn];
    if (!aiPlayer) return;

    // Pares declaration precheck
    if (phase === 'pares_precheck') {
      const hasPairs = evaluatePares(aiPlayer.cards).level > 0;
      handleDeclarePares(currentTurn, hasPairs);
      return;
    }

    // Juego declaration precheck
    if (phase === 'juego_precheck') {
      const hasJuego = getHandSum(aiPlayer.cards) >= 31;
      handleDeclareJuego(currentTurn, hasJuego);
      return;
    }

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
        isTransitioningRef.current = true;
        const delays = getDelays();
        safeTimeout(() => {
          isTransitioningRef.current = false;
          startLance('grande');
        }, delays.transition);
      }
      return;
    }

    // Betting phase (grande, chica, pares_bet, juego_bet, punto_bet)
    const isBettingLance = ['grande', 'chica', 'pares_bet', 'juego_bet', 'punto_bet'].includes(phase);
    if (!isBettingLance) return;

    // If AI does not have pares or juego, they cannot bet in that lance!
    if (phase === 'pares_bet' && !aiPlayer.declaredPares) {
      const nextSeat = getNextEligibleBettorSeat((currentTurn + 1) % 4, 'pares', players);
      setCurrentTurn(nextSeat);
      return;
    }
    if (phase === 'juego_bet' && !aiPlayer.declaredJuego) {
      const nextSeat = getNextEligibleBettorSeat((currentTurn + 1) % 4, 'juego', players);
      setCurrentTurn(nextSeat);
      return;
    }

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

    // Regla de Oro: Si los rivales han apostado y el turno recae en el compañero (Norte, asiento 2),
    // el compañero cede la palabra al usuario (asiento 0) si este es apto para el lance,
    // garantizando que el jugador usuario siempre tiene la potestad de decidir si quiere o no quiere.
    if (currentTurn === 2 && currentLanceBet.currentBet > 0 && currentLanceBet.lastBettorTeam === 1) {
      if (isPlayerEligibleForLance(players[0], lanceKey)) {
        const deferSpeech = '¡Compañero, tú decides si queremos o no!';
        setPlayers((prev) =>
          prev.map((p, i) => (i === 2 ? { ...p, currentSpeech: deferSpeech } : p))
        );
        voiceEngine.speakCharacter(aiPlayer.id, deferSpeech);
        setRecentEvent(`${aiPlayer.name} te cede la palabra: «${deferSpeech}»`);
        setCurrentTurn(0);
        return;
      }
    }

    const decision = decideLanceAction(
      aiPlayer,
      lanceKey as any,
      currentLanceBet,
      aiPlayer.team === 0 ? scoreTeam0.piedras : scoreTeam1.piedras,
      aiPlayer.team === 0 ? scoreTeam1.piedras : scoreTeam0.piedras
    );

    // Apply speech
    setPlayers((prev) =>
      prev.map((p, i) => (i === currentTurn ? { ...p, currentSpeech: decision.speech } : p))
    );
    voiceEngine.speakCharacter(aiPlayer.id, decision.speech);

    executeBetAction(currentTurn, decision.action, lanceKey);
  };

  // Progress Mus turn in circle
  const advanceMusTurn = (fromSeat: number) => {
    const nextSeat = (fromSeat + 1) % 4;
    // If completed full circle back to manoIndex, everyone said Mus!
    if (nextSeat === manoIndex) {
      setRecentEvent('¡Los cuatro jugadores quieren Mus! Se procede a los descartes.');
      isTransitioningRef.current = true;
      const delays = getDelays();
      safeTimeout(() => {
        isTransitioningRef.current = false;
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

    // Also compute AI discards
    const updatedPlayers = players.map((p, idx) => {
      let discards = idx === 0 ? userDiscardIndices : getAIDiscardIndices(p.cards);
      // Draw replacements
      const remainingDeck = [...deck];
      const newCards = [...p.cards];

      discards.forEach((dIdx) => {
        if (remainingDeck.length > 0) {
          newCards[dIdx] = remainingDeck.pop()!;
        }
      });

      const paresEval = evaluatePares(newCards);
      const handSum = getHandSum(newCards);

      return {
        ...p,
        cards: newCards,
        selectedToDiscard: [],
        currentSpeech: null,
        hasPares: paresEval.level > 0,
        declaredPares: null,
        hasJuego: handSum >= 31,
        declaredJuego: null,
        juegoValue: handSum,
      };
    });

    setPlayers(updatedPlayers);
    setRecentEvent('Se han repartido los nuevos naipes de descarte. Nueva consulta de Mus.');
    setPhase('mus_dialog');
    setCurrentTurn(manoIndex);
  };

  // Helper to determine if a player can participate in betting for this lance
  const isPlayerEligibleForLance = (p: Player, lance: string) => {
    if (lance === 'pares') return p.declaredPares === true;
    if (lance === 'juego') return p.declaredJuego === true;
    return true; // grande, chica, punto
  };

  // Helper to find the next eligible bettor around the table
  const getNextEligibleBettorSeat = (fromSeat: number, lance: string, currentPlayers: Player[]) => {
    for (let step = 0; step < 4; step++) {
      const candidate = (fromSeat + step) % 4;
      if (isPlayerEligibleForLance(currentPlayers[candidate], lance)) {
        return candidate;
      }
    }
    return fromSeat;
  };

  // Helper to find next eligible bettor in opposing team
  const getNextOpposingBettorSeat = (fromSeat: number, actingTeam: 0 | 1, lance: string, currentPlayers: Player[]) => {
    const opposingTeam = actingTeam === 0 ? 1 : 0;

    // Regla de Oro: Cuando los rivales (actingTeam 1) apuestan contra el equipo del usuario (opposingTeam 0),
    // el jugador usuario (asiento 0) SIEMPRE tiene la potestad de decidir si quiere o no quiere,
    // siempre que sea apto para el lance activo (tenga pares/juego o lance abierto).
    if (opposingTeam === 0) {
      if (isPlayerEligibleForLance(currentPlayers[0], lance)) {
        return 0; // El usuario toma la decisión obligatoriamente
      } else if (isPlayerEligibleForLance(currentPlayers[2], lance)) {
        return 2; // Si el usuario no tiene pares/juego, defiende el compañero
      }
      return null;
    }

    // Cuando el equipo del usuario apuesta contra los rivales (opposingTeam 1):
    for (let step = 1; step <= 4; step++) {
      const candidate = (fromSeat + step) % 4;
      if (currentPlayers[candidate].team === opposingTeam && isPlayerEligibleForLance(currentPlayers[candidate], lance)) {
        return candidate;
      }
    }
    return null;
  };

  // Start a betting lance or declaration precheck
  const startLance = (lance: 'grande' | 'chica' | 'pares' | 'juego' | 'punto') => {
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
      setRecentEvent(`Consulta de Pares: Empieza preguntando a ${players[manoIndex]?.name || 'Mano'} (Mano).`);
      return;
    }

    if (lance === 'juego') {
      setPhase('juego_precheck');
      setCurrentTurn(manoIndex);
      setRecentEvent(`Consulta de Juego (>= 31): Empieza preguntando a ${players[manoIndex]?.name || 'Mano'} (Mano).`);
      return;
    }
  };

  // Pares Declaration Handler (Art. I/II: «La boca hace ley, nunca se puede mentir»)
  const handleDeclarePares = (seat: number, hasPairs: boolean, customSpeech?: string) => {
    const p = players[seat];
    if (!p) return;
    const speech = customSpeech || (hasPairs ? '¡Pares sí!' : 'Pares no.');

    if (hasPairs) sound.playEnvido(); else sound.playCard();
    voiceEngine.speakCharacter(p.id, speech);
    setRecentEvent(`${p.name} declara: «${speech}».`);

    const updatedPlayers = players.map((pl, idx) =>
      idx === seat ? { ...pl, declaredPares: hasPairs, currentSpeech: speech } : pl
    );
    setPlayers(updatedPlayers);

    const nextSeat = (seat + 1) % 4;
    if (nextSeat !== manoIndex) {
      setCurrentTurn(nextSeat);
    } else {
      // Full circle! Everyone declared Pares
      const t0Has = updatedPlayers[0].declaredPares === true || updatedPlayers[2].declaredPares === true;
      const t1Has = updatedPlayers[1].declaredPares === true || updatedPlayers[3].declaredPares === true;

      isTransitioningRef.current = true;
      const delays = getDelays();

      if (!t0Has && !t1Has) {
        setRecentEvent('❌ Ningún equipo tiene Pares. Se pasa al lance de Juego.');
        safeTimeout(() => {
          isTransitioningRef.current = false;
          startLance('juego');
        }, delays.transition);
      } else if (t0Has && !t1Has) {
        setRecentEvent('✅ Solo el Equipo Jugador tiene Pares (se cobrarán en el recuento). Se pasa a Juego.');
        safeTimeout(() => {
          isTransitioningRef.current = false;
          startLance('juego');
        }, delays.transition);
      } else if (!t0Has && t1Has) {
        setRecentEvent('✅ Solo los Rivales tienen Pares (se cobrarán en el recuento). Se pasa a Juego.');
        safeTimeout(() => {
          isTransitioningRef.current = false;
          startLance('juego');
        }, delays.transition);
      } else {
        // Both teams have pairs! Only players with declaredPares === true participate
        const firstBettor = getNextEligibleBettorSeat(manoIndex, 'pares', updatedPlayers);
        setRecentEvent(`⚔️ ¡Ambos equipos tienen Pares! Se abre el lance. Turno de ${updatedPlayers[firstBettor].name}.`);
        safeTimeout(() => {
          isTransitioningRef.current = false;
          setPhase('pares_bet');
          setCurrentTurn(firstBettor);
        }, delays.transition);
      }
    }
  };

  // Juego Declaration Handler
  const handleDeclareJuego = (seat: number, hasJuego: boolean, customSpeech?: string) => {
    const p = players[seat];
    if (!p) return;
    const speech = customSpeech || (hasJuego ? '¡Juego sí!' : 'Juego no.');

    if (hasJuego) sound.playEnvido(); else sound.playCard();
    voiceEngine.speakCharacter(p.id, speech);
    setRecentEvent(`${p.name} declara: «${speech}».`);

    const updatedPlayers = players.map((pl, idx) =>
      idx === seat ? { ...pl, declaredJuego: hasJuego, currentSpeech: speech } : pl
    );
    setPlayers(updatedPlayers);

    const nextSeat = (seat + 1) % 4;
    if (nextSeat !== manoIndex) {
      setCurrentTurn(nextSeat);
    } else {
      // Full circle! Everyone declared Juego
      const t0Has = updatedPlayers[0].declaredJuego === true || updatedPlayers[2].declaredJuego === true;
      const t1Has = updatedPlayers[1].declaredJuego === true || updatedPlayers[3].declaredJuego === true;

      isTransitioningRef.current = true;
      const delays = getDelays();

      if (!t0Has && !t1Has) {
        setRecentEvent('❌ Nadie tiene Juego (nadie llega a 31). ¡Se abre el lance al PUNTO!');
        safeTimeout(() => {
          isTransitioningRef.current = false;
          setPhase('punto_bet');
          setCurrentTurn(manoIndex);
        }, delays.transition);
      } else if (t0Has && !t1Has) {
        setRecentEvent('✅ Solo el Equipo Jugador tiene Juego (se cobrará en el recuento). Fin de lances.');
        safeTimeout(() => {
          isTransitioningRef.current = false;
          resolveHand();
        }, delays.transition);
      } else if (!t0Has && t1Has) {
        setRecentEvent('✅ Solo los Rivales tienen Juego (se cobrarán en el recuento). Fin de lances.');
        safeTimeout(() => {
          isTransitioningRef.current = false;
          resolveHand();
        }, delays.transition);
      } else {
        // Both teams have juego! Only players with declaredJuego === true participate
        const firstBettor = getNextEligibleBettorSeat(manoIndex, 'juego', updatedPlayers);
        setRecentEvent(`⚔️ ¡Ambos equipos tienen Juego! Se abre el lance. Turno de ${updatedPlayers[firstBettor].name}.`);
        safeTimeout(() => {
          isTransitioningRef.current = false;
          setPhase('juego_bet');
          setCurrentTurn(firstBettor);
        }, delays.transition);
      }
    }
  };

  // Handle betting action from user or AI
  const executeBetAction = (
    seat: number,
    action: 'paso' | 'envido' | 'mas' | 'ordago' | 'quiero' | 'no_quiero' | string,
    lanceKey: string
  ) => {
    const actingPlayer = players[seat];
    const actingTeam = actingPlayer.team;
    const currentBet = lanceBets[lanceKey];

    if (action === 'ordago') {
      sound.playOrdago();
      triggerCameo('ordago');
      setRecentEvent(`🔥 ¡¡${actingPlayer.name} HA CANTADO ÓRDAGO!!`);

      setLanceBets((prev) => ({
        ...prev,
        [lanceKey]: {
          ...prev[lanceKey],
          currentBet: targetPiedras,
          isOrdago: true,
          lastBettorTeam: actingTeam,
          lastBettorIndex: seat,
        },
      }));

      // Pass turn to opposing team (only eligible players with pairs/juego)
      const nextSeat = getNextOpposingBettorSeat(seat, actingTeam, lanceKey, players);
      if (nextSeat !== null) {
        if (nextSeat === 0) {
          setRecentEvent(`🔥 ¡${actingPlayer.name} HA CANTADO ÓRDAGO! Tienes la potestad de decidir: ¿Quieres o no quieres?`);
        }
        setCurrentTurn(nextSeat);
      } else {
        isTransitioningRef.current = true;
        safeTimeout(() => {
          isTransitioningRef.current = false;
          advanceToNextLance(lanceKey);
        }, getDelays().transition);
      }
      return;
    }

    if (action === 'envido' || (typeof action === 'string' && action.startsWith('envido'))) {
      sound.playEnvido();
      let stones = 2;
      if (typeof action === 'string' && action.startsWith('envido:')) {
        const parsed = parseInt(action.split(':')[1], 10);
        if (!isNaN(parsed) && parsed >= 2) stones = parsed;
      }

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

      const nextSeat = getNextOpposingBettorSeat(seat, actingTeam, lanceKey, players);
      if (nextSeat !== null) {
        if (nextSeat === 0) {
          setRecentEvent(`¡${actingPlayer.name} envida ${stones} piedras! Tienes la potestad de decidir: ¿Quieres o no quieres?`);
        } else {
          setRecentEvent(`¡${actingPlayer.name} envida ${stones} piedras!`);
        }
        setCurrentTurn(nextSeat);
      } else {
        isTransitioningRef.current = true;
        safeTimeout(() => {
          isTransitioningRef.current = false;
          advanceToNextLance(lanceKey);
        }, getDelays().transition);
      }
      return;
    }

    if (action === 'mas' || (typeof action === 'string' && action.startsWith('mas'))) {
      sound.playEnvido();
      let added = 2;
      if (typeof action === 'string' && action.startsWith('mas:')) {
        const parsed = parseInt(action.split(':')[1], 10);
        if (!isNaN(parsed) && parsed >= 2) added = parsed;
      }
      const previousAmount = currentBet.currentBet || 0;
      const newBet = previousAmount + added;
      setLanceBets((prev) => ({
        ...prev,
        [lanceKey]: {
          ...prev[lanceKey],
          currentBet: newBet,
          previousBet: previousAmount,
          lastBettorTeam: actingTeam,
          lastBettorIndex: seat,
        },
      }));

      const nextSeat = getNextOpposingBettorSeat(seat, actingTeam, lanceKey, players);
      if (nextSeat !== null) {
        if (nextSeat === 0) {
          setRecentEvent(`¡${actingPlayer.name} sube ${added} más (${newBet} piedras)! Tienes la potestad de decidir: ¿Quieres o no quieres?`);
        } else {
          setRecentEvent(`¡${actingPlayer.name} sube ${added} más! Total: ${newBet} piedras.`);
        }
        setCurrentTurn(nextSeat);
      } else {
        isTransitioningRef.current = true;
        safeTimeout(() => {
          isTransitioningRef.current = false;
          advanceToNextLance(lanceKey);
        }, getDelays().transition);
      }
      return;
    }

    if (action === 'quiero') {
      sound.playChip();
      // Bet accepted!
      if (currentBet.isOrdago) {
        setRecentEvent(`¡${actingPlayer.name} DICE QUIERO AL ÓRDAGO! ¡¡A VER LAS CARTAS!!`);
        setShowAllCards(true);
        isTransitioningRef.current = true;

        safeTimeout(() => {
          isTransitioningRef.current = false;
          // Instant resolution of Órdago on this lance!
          const result = getWinningTeamForLance(lanceKey as any, players, manoIndex);
          setRecentEvent(`¡El lance de ${lanceKey.toUpperCase()} lo gana ${players[result.winningPlayerIndex].name}!`);

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
      isTransitioningRef.current = true;
      const delays = getDelays();
      safeTimeout(() => {
        isTransitioningRef.current = false;
        advanceToNextLance(lanceKey);
      }, delays.transition);
      return;
    }

    if (action === 'no_quiero') {
      sound.playCard();
      // Team declined. The betting team immediately gets stones!
      const winningTeam = actingTeam === 0 ? 1 : 0;
      // If was a raise or first bet: 1 stone for leaving initial bet, or previous amount
      const award = currentBet.currentBet > 2 ? currentBet.currentBet - 2 : 1;
      awardPiedras(winningTeam, award, `Retirada en ${lanceKey.toUpperCase()}`);

      setLanceBets((prev) => ({
        ...prev,
        [lanceKey]: {
          ...prev[lanceKey],
          rejected: true,
          resolved: true,
        },
      }));

      isTransitioningRef.current = true;
      const delays = getDelays();
      safeTimeout(() => {
        isTransitioningRef.current = false;
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
        [lanceKey]: {
          ...prev[lanceKey],
          history: updatedHistory,
        },
      }));

      const eligibleCount = players.filter((p) => isPlayerEligibleForLance(p, lanceKey)).length;
      const passedCount = updatedHistory.filter((h) => h.action === 'paso').length;
      const nextSeat = getNextEligibleBettorSeat((seat + 1) % 4, lanceKey, players);

      // If all eligible players passed without any active bet:
      if (passedCount >= eligibleCount || nextSeat === manoIndex) {
        setRecentEvent(`Lance de ${lanceKey.toUpperCase()} pasa en silencio (en blanco).`);
        isTransitioningRef.current = true;
        const delays = getDelays();
        safeTimeout(() => {
          isTransitioningRef.current = false;
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

    if (team === 0) {
      setScoreTeam0((prev) => {
        if (prev.piedras >= targetPiedras || handWonRef.current) return prev;
        const newP = prev.piedras + count;
        if (newP >= targetPiedras) {
          handWonRef.current = true;
          triggerWin('¡Equipo Jugador ha alcanzado la meta de piedras!');
          return { piedras: targetPiedras, juegosWon: prev.juegosWon + 1 };
        }
        return { ...prev, piedras: newP };
      });
    } else {
      setScoreTeam1((prev) => {
        if (prev.piedras >= targetPiedras || handWonRef.current) return prev;
        const newP = prev.piedras + count;
        if (newP >= targetPiedras) {
          handWonRef.current = true;
          triggerDefeat('¡Los Rivales han alcanzado la meta de piedras!');
          return { piedras: targetPiedras, juegosWon: prev.juegosWon + 1 };
        }
        return { ...prev, piedras: newP };
      });
    }
  };

  // Showdown & Recuento de Tantos (Final Scoring)
  const resolveHand = () => {
    if (isScoringRef.current) return;
    isScoringRef.current = true;
    isTransitioningRef.current = true;

    setPhase('scoring');
    setShowAllCards(true);
    setRecentEvent('¡A ver las cartas! Se procede al recuento tradicional de tantos paso a paso.');

    const plan = computeHandRecountPlan(players, manoIndex, lanceBets);
    setRecountPlan(plan);
  };

  const handleLancePointsAwarded = (team: 0 | 1, pts: number, reason: string) => {
    awardPiedras(team, pts, reason);
  };

  const handleFinishRecount = () => {
    if (handWonRef.current) return;
    setRecountPlan(null);
    setPhase('round_end');
    setRecentEvent('Mano finalizada. Preparaos para la siguiente mano.');
  };

  // Next Hand trigger
  const handleNextHand = () => {
    clearAllPendingTimers();
    setRecountPlan(null);
    isScoringRef.current = false;
    isTransitioningRef.current = false;
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
      setTimeout(() => {
        setView('bracket');
      }, 2500);
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
  const triggerCameo = (type: string) => {
    const list = CAMEOS[type] || CAMEOS.ordago;
    const randomCameo = list[Math.floor(Math.random() * list.length)];
    setCameo(randomCameo);
  };

  // Handle Seña sent by user
  const handleSendSeña = (seña: Seña, isTruthful: boolean) => {
    sound.playSeña();
    const partner = players[2];
    const rival1 = players[1];
    const rival2 = players[3];

    // Show gesture tag above player
    setPlayers((prev) =>
      prev.map((p, i) => (i === 0 ? { ...p, lastGesture: seña.gesture } : p))
    );

    // 25% chance a rival catches the seña!
    const wasCaught = Math.random() < 0.28;

    if (wasCaught) {
      const catcher = Math.random() < 0.5 ? rival1 : rival2;
      const catcherChar = PC_MUS_CHARACTERS.find((c) => c.id === catcher.id)!;
      const quote = catcherChar.dialogs.señaSeen[0] || '¡Te he visto la seña!';

      setTimeout(() => {
        setPlayers((prev) =>
          prev.map((p) => (p.id === catcher.id ? { ...p, currentSpeech: quote } : p))
        );
        voiceEngine.speakCharacter(catcher.id, quote);
        setRecentEvent(`¡${catcher.name} ha pillado tu seña! «${quote}»`);
      }, 600);
    } else {
      // Partner understood the seña
      setTimeout(() => {
        setPlayers((prev) =>
          prev.map((p) =>
            p.seat === 2
              ? { ...p, currentSpeech: '*(Entendido, compañero...)*' }
              : p
          )
        );
        setRecentEvent(`Tu compañero ${partner.name} ha captado tu seña.`);
      }, 700);
    }
  };

  // User controls action dispatcher
  const handleUserAction = (action: string) => {
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
      isTransitioningRef.current = true;
      const delays = getDelays();
      safeTimeout(() => {
        isTransitioningRef.current = false;
        startLance('grande');
      }, delays.transition);
    } else if (action === 'discard') {
      handleUserDiscard();
    } else if (action === 'declare_pares_si') {
      handleDeclarePares(0, true, '¡Pares sí!');
    } else if (action === 'declare_pares_no') {
      handleDeclarePares(0, false, 'Pares no.');
    } else if (action === 'declare_juego_si') {
      handleDeclareJuego(0, true, '¡Juego sí!');
    } else if (action === 'declare_juego_no') {
      handleDeclareJuego(0, false, 'Juego no.');
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
      if (typeof action === 'string' && action.startsWith('envido:')) {
        const stones = action.split(':')[1];
        speech = `¡Envido ${stones} piedras!`;
      }
      if (action === 'mas') speech = '¡Dos más!';
      if (typeof action === 'string' && action.startsWith('mas:')) {
        const stones = action.split(':')[1];
        speech = `¡${stones} más!`;
      }
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
    <div className="min-h-screen bg-stone-950 text-stone-100 flex flex-col justify-between selection:bg-amber-500 selection:text-stone-950">
      {/* Retro CRT overlay & Top bar */}
      <RetroDosOverlay
        crtEnabled={crtEnabled}
        onToggleCrt={() => setCrtEnabled(!crtEnabled)}
        onOpenRules={() => setRulesOpen(true)}
        onExitGame={() => setView('select')}
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
      <CameoBanner cameo={cameo} onDismiss={() => setCameo(null)} />

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
            setView('game');
            dealNewHand(players, 0);
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
            controlsNode={
              phase !== 'round_end' && phase !== 'game_over' ? (
                <Controls
                  isPlayerTurn={currentTurn === 0}
                  phase={phase}
                  currentLanceName={activeLanceName}
                  betState={currentBetState}
                  selectedCardCount={players[0]?.selectedToDiscard?.length || 0}
                  onAction={handleUserAction}
                  onOpenSeñas={() => setSeñasOpen(true)}
                  waitingMessage={
                    players[currentTurn]
                      ? phase === 'pares_bet' && !players[0]?.declaredPares
                        ? `Turno de ${players[currentTurn].name}. (Sin pares: tu compañero defiende a tu pareja)`
                        : phase === 'juego_bet' && !players[0]?.declaredJuego
                        ? `Turno de ${players[currentTurn].name}. (Sin juego: tu compañero defiende a tu pareja)`
                        : `Turno de ${players[currentTurn].name}...`
                      : null
                  }
                  userHasPares={players[0]?.hasPares}
                  userParesType={
                    players[0]?.cards ? describeParesHand(players[0].cards).title : undefined
                  }
                  userParesDetail={
                    players[0]?.cards ? describeParesHand(players[0].cards).detail : undefined
                  }
                  userHasJuego={players[0]?.hasJuego}
                  userJuegoSum={players[0]?.cards ? getHandSum(players[0].cards) : undefined}
                  userJuegoDetail={
                    players[0]?.cards ? describeJuegoHand(players[0].cards).detail : undefined
                  }
                />
              ) : (
                <div className="bg-stone-900/95 border-2 border-amber-500 rounded-2xl p-2.5 text-center shadow-xl w-full max-w-[320px]">
                  <h3 className="font-serif font-black text-xs sm:text-sm text-amber-300 mb-0.5">
                    {phase === 'game_over' ? '¡PARTIDA CONCLUIDA!' : '¡MANO COMPLETADA!'}
                  </h3>
                  <p className="text-[10px] text-stone-300 mb-2 truncate">{recentEvent}</p>
                  {phase === 'round_end' ? (
                    <button
                      onClick={handleNextHand}
                      className="w-full py-1.5 px-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs shadow-md transition active:scale-95 cursor-pointer"
                    >
                      Repartir Siguiente Mano
                    </button>
                  ) : (
                    <button
                      onClick={() => setView('select')}
                      className="w-full py-1.5 px-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold text-xs shadow-md transition active:scale-95 cursor-pointer"
                    >
                      Volver al Menú Principal
                    </button>
                  )}
                </div>
              )
            }
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
