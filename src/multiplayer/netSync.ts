// Shared game snapshot for online play.
//
// The engine always sees "you" in seat 0 (South). Online, every browser is somebody else's
// South, so the host publishes the table in ABSOLUTE seats (the room's seat numbers) and each
// player rotates it back to their own point of view.
//   local → absolute: shift = mySeat
//   absolute → local: shift = 4 - mySeat
// Teams swap when the rotation is odd (local team 0 is always "your" team).
import { LanceBetState, LancePhase, Player, TeamScore } from '../types';
import { HandRecountPlan } from '../recuentoCalculator';
import { GazeTarget, IntelState } from '../gazeSystem';

export interface TableSnapshot {
  players: Player[];
  manoIndex: number;
  currentTurn: number;
  phase: LancePhase;
  showAllCards: boolean;
  recentEvent: string | null;
  lanceBets: Record<string, LanceBetState>;
  scores: [TeamScore, TeamScore];
  recountPlan: HandRecountPlan | null;
  gazes: GazeTarget[];
  intel: IntelState;
  discardReady: number[];
  busy: boolean;
  targetPiedras: number;
  handNumber: number;
}

const rotateSnapshot = (s: TableSnapshot, shift: number, swap: boolean): TableSnapshot => {
  const seat = (i: number) => (i < 0 ? i : (i + shift) % 4);
  const team = <T extends number | null>(t: T): T => (t === null ? t : swap ? ((1 - (t as number)) as T) : t);

  const players: Player[] = new Array(4);
  s.players.forEach((p, i) => {
    players[seat(i)] = { ...p, seat: seat(i) as 0 | 1 | 2 | 3, team: team(p.team) as 0 | 1 };
  });

  const gazes: GazeTarget[] = new Array(4).fill(-1);
  s.gazes.forEach((g, i) => {
    gazes[seat(i)] = (g === -1 ? -1 : seat(g)) as GazeTarget;
  });

  const intel: IntelState = [{}, {}];
  s.intel.forEach((teamIntel, t) => {
    const out: Record<number, string[]> = {};
    Object.entries(teamIntel || {}).forEach(([k, v]) => {
      out[seat(Number(k))] = v;
    });
    intel[team(t)] = out;
  });

  const lanceBets: Record<string, LanceBetState> = {};
  Object.entries(s.lanceBets).forEach(([key, bet]) => {
    lanceBets[key] = {
      ...bet,
      lastBettorTeam: bet.lastBettorTeam === null ? null : team(bet.lastBettorTeam),
      lastBettorIndex: bet.lastBettorIndex === null ? null : seat(bet.lastBettorIndex),
      history: bet.history.map((h) => ({ ...h, playerIndex: seat(h.playerIndex) })),
    };
  });

  const recountPlan: HandRecountPlan | null = s.recountPlan
    ? {
        steps: s.recountPlan.steps.map((st) => ({
          ...st,
          winningTeam: st.winningTeam === null ? null : team(st.winningTeam),
          winningPlayerIndex: st.winningPlayerIndex === null ? null : seat(st.winningPlayerIndex),
          cardsDescriptionTeam0: swap ? st.cardsDescriptionTeam1 : st.cardsDescriptionTeam0,
          cardsDescriptionTeam1: swap ? st.cardsDescriptionTeam0 : st.cardsDescriptionTeam1,
        })),
        totalTeam0: swap ? s.recountPlan.totalTeam1 : s.recountPlan.totalTeam0,
        totalTeam1: swap ? s.recountPlan.totalTeam0 : s.recountPlan.totalTeam1,
      }
    : null;

  return {
    ...s,
    players,
    manoIndex: seat(s.manoIndex),
    currentTurn: seat(s.currentTurn),
    lanceBets,
    scores: swap ? [s.scores[1], s.scores[0]] : s.scores,
    recountPlan,
    gazes,
    intel,
    discardReady: s.discardReady.map(seat),
  };
};

// Engine (local) view → absolute seats, done by the host before publishing
export const toAbsolute = (local: TableSnapshot, mySeat: number) => rotateSnapshot(local, mySeat % 4, mySeat % 2 === 1);

// Absolute seats → my own view (I'm South)
export const toLocal = (absolute: TableSnapshot, mySeat: number) =>
  rotateSnapshot(absolute, (4 - (mySeat % 4)) % 4, mySeat % 2 === 1);

export const absoluteSeat = (localSeat: number, mySeat: number) => (localSeat + mySeat) % 4;
export const localSeat = (absSeat: number, mySeat: number) => (absSeat - mySeat + 4) % 4;
