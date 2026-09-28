export type Suit = 'oros' | 'copas' | 'espadas' | 'bastos';

export interface Card {
  id: string;
  suit: Suit;
  number: number; // 1, 2, 3, 4, 5, 6, 7, 10 (sota), 11 (caballo), 12 (rey)
  // in 8-reyes mus: 3s count as reyes (10), 2s count as ases (1)
}

export type LancePhase = 
  | 'dealing'
  | 'mus_dialog'
  | 'discarding'
  | 'grande'
  | 'chica'
  | 'pares_precheck'
  | 'pares_bet'
  | 'juego_precheck'
  | 'juego_bet'
  | 'punto_bet'
  | 'scoring'
  | 'round_end'
  | 'game_over';

export interface BetHistoryItem {
  playerIndex: number; // 0: Jugador, 1: Rival 1, 2: Pareja, 3: Rival 2
  action: 'paso' | 'envido' | 'mas' | 'ordago' | 'quiero' | 'no_quiero';
  amount?: number;
  text: string;
}

export interface LanceBetState {
  currentBet: number; // stones at stake
  lastBettorTeam: number | null; // 0: Player's team (seats 0 & 2), 1: Rival team (seats 1 & 3)
  lastBettorIndex: number | null;
  history: BetHistoryItem[];
  isOrdago: boolean;
  accepted: boolean;
  rejected: boolean;
  resolved: boolean;
}

export interface Player {
  id: string;
  name: string;
  realName: string;
  quote: string;
  team: 0 | 1; // 0 = Player & Partner, 1 = Rivals
  seat: 0 | 1 | 2 | 3; // 0: South (human), 1: East (Rival 1), 2: North (Partner), 3: West (Rival 2)
  cards: Card[];
  selectedToDiscard: number[]; // indices of cards to discard
  avatarColor: string;
  avatarIcon: string;
  description: string;
  aggressiveness: number; // 0 to 1
  bluffRate: number; // 0 to 1
  saidMus?: boolean | null;
  currentSpeech?: string | null;
  lastGesture?: string | null;
  hasPares?: boolean;
  hasJuego?: boolean;
  juegoValue?: number;
}

export interface TeamScore {
  piedras: number; // Total points (typically up to 30 or 40)
  juegosWon: number; // Games / Vacas won
}

export type GameMode = 'partida' | 'torneo' | 'multijugador';

export interface RoomSeat {
  seatIndex: number; // 0: Sur, 1: Este, 2: Norte, 3: Oeste
  occupied: boolean;
  playerId: string;
  playerName: string;
  characterId: string;
  avatarColor: string;
  avatarIcon: string;
  isHost: boolean;
  isBot: boolean;
  isReady: boolean;
}

export interface ChatMessage {
  id: string;
  senderName: string;
  seat: number;
  text: string;
  timestamp: string;
  isQuickPhrase?: boolean;
}

export interface MultiplayerRoom {
  id: string;
  name: string;
  code: string;
  isPrivate: boolean;
  password?: string;
  targetPiedras: number;
  status: 'waiting' | 'playing' | 'finished';
  hostPlayerId: string;
  seats: RoomSeat[];
  createdAt: number;
  updatedAt: number;
  chat: ChatMessage[];
  currentHandData?: any;
}

export interface MultiplayerActionPayload {
  roomId: string;
  seatIndex: number;
  type: 'mus_response' | 'discard' | 'bet' | 'seña' | 'next_hand';
  action?: string;
  discardIndices?: number[];
  amount?: number;
  señaId?: string;
}

export interface TournamentMatch {
  roundName: 'Cuartos de Final' | 'Semifinales' | 'Gran Final';
  rivals: [string, string];
  defeated: boolean;
  current: boolean;
}

export interface Seña {
  id: string;
  name: string;
  gesture: string;
  meaning: string;
  ruleCheck: (cards: Card[]) => boolean;
}

export interface GameLogEntry {
  id: string;
  text: string;
  type: 'info' | 'bet' | 'score' | 'cameo' | 'ordago' | 'seña';
  timestamp: string;
}
