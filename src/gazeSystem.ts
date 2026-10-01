import { Card, Seña } from './types';
import { SEÑAS } from './musLogic';

// Gaze target per seat: another seat index (0..3) or -1 when looking down at own cards / the table.
export type GazeTarget = -1 | 0 | 1 | 2 | 3;

export const LOOKING_AT_CARDS: GazeTarget = -1;

export const SEAT_NAMES = ['Sur', 'Este', 'Norte', 'Oeste'];

export const partnerOf = (seat: number) => (seat + 2) % 4;
export const teamOf = (seat: number): 0 | 1 => (seat % 2 === 0 ? 0 : 1);
export const opponentsOf = (seat: number) => [(seat + 1) % 4, (seat + 3) % 4];

// Knowledge each team has gathered through señas: knownSeñas[team][seat] = list of seña ids
export type TeamIntel = Record<number, string[]>;
export type IntelState = [TeamIntel, TeamIntel];

export const emptyIntel = (): IntelState => [{}, {}];

export const addIntel = (intel: IntelState, knowerTeam: 0 | 1, seat: number, señaId: string): IntelState => {
  const next: IntelState = [{ ...intel[0] }, { ...intel[1] }];
  const current = next[knowerTeam][seat] || [];
  if (!current.includes(señaId)) {
    next[knowerTeam][seat] = [...current, señaId];
  }
  return next;
};

export const getSeña = (id: string): Seña | undefined => SEÑAS.find((s) => s.id === id);

// Señas a hand is allowed to send (truthful only: "la boca hace ley")
export const getValidSeñas = (cards: Card[]): Seña[] =>
  cards.length === 4 ? SEÑAS.filter((s) => s.ruleCheck(cards)) : [];

// Picks a random new gaze for an AI seat. Partners look at each other often (waiting for señas),
// rivals keep an eye on their opponents to catch them, and everybody checks their own cards.
export function pickNextGaze(seat: number, current: GazeTarget): GazeTarget {
  const partner = partnerOf(seat);
  const [oppA, oppB] = opponentsOf(seat);
  const options: [GazeTarget, number][] = [
    [LOOKING_AT_CARDS, 0.3],
    [partner as GazeTarget, 0.3],
    [oppA as GazeTarget, 0.2],
    [oppB as GazeTarget, 0.2],
  ];
  // Avoid staying on the same target too often so the neck movement is visible
  const weighted = options.map(([t, w]) => [t, t === current ? w * 0.35 : w] as [GazeTarget, number]);
  const total = weighted.reduce((acc, [, w]) => acc + w, 0);
  let roll = Math.random() * total;
  for (const [t, w] of weighted) {
    roll -= w;
    if (roll <= 0) return t;
  }
  return LOOKING_AT_CARDS;
}

// How long (ms) an AI holds a gaze before turning its neck again
export const randomGazeDuration = () => 1100 + Math.random() * 2300;

// Estimated strength (0..10, same scale as aiPlayer) that a seña reveals for a given lance.
// Returns undefined when the seña says nothing about that lance.
export function señaLanceStrength(
  señaId: string,
  lance: 'grande' | 'chica' | 'pares' | 'juego' | 'punto'
): number | undefined {
  const table: Record<string, Partial<Record<typeof lance, number>>> = {
    dos_reyes: { grande: 6, pares: 5 },
    dos_ases: { chica: 6, pares: 3 },
    medias_ases: { chica: 8.5, pares: 6 },
    medias_reyes: { grande: 8.5, pares: 8 },
    medias: { pares: 6 },
    duples: { pares: 8.5 },
    treinta_y_uno: { juego: 10 },
    punto_treinta: { punto: 9 },
    ciego: { pares: 0, juego: 0, punto: 2.5 },
  };
  return table[señaId]?.[lance];
}

export const maxSeñaStrength = (
  señaIds: string[],
  lance: 'grande' | 'chica' | 'pares' | 'juego' | 'punto'
): number | undefined => {
  const values = señaIds
    .map((id) => señaLanceStrength(id, lance))
    .filter((v): v is number => v !== undefined);
  return values.length ? Math.max(...values) : undefined;
};

// Short label used on the table badges
export const señaShortLabel = (id: string): string =>
  ({
    dos_reyes: '2 Reyes',
    dos_ases: '2 Ases',
    medias_ases: 'Medias de Ases',
    medias_reyes: 'Medias de Reyes',
    medias: 'Medias',
    duples: 'Duples',
    treinta_y_uno: '31',
    punto_treinta: '30 de punto',
    ciego: 'Ciego',
  }[id] || id);

export const señaEmoji = (id: string): string => getSeña(id)?.gesture.split(' ')[0] || '🤫';
