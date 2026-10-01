import { Card, Player, Suit, Seña } from './types';

export const SUITS: Suit[] = ['oros', 'copas', 'espadas', 'bastos'];
export const NUMBERS = [1, 2, 3, 4, 5, 6, 7, 10, 11, 12];

export function createDeck(): Card[] {
  const deck: Card[] = [];
  for (const suit of SUITS) {
    for (const num of NUMBERS) {
      deck.push({
        id: `${suit}_${num}`,
        suit,
        number: num,
      });
    }
  }
  return shuffleDeck(deck);
}

export function shuffleDeck(deck: Card[]): Card[] {
  const copy = [...deck];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

// In 8-reyes Mus:
// 3 = Rey (rank 12), 2 = As (rank 1)
export function getMusRank(num: number): number {
  if (num === 3) return 12; // 3 counts as Rey
  if (num === 2) return 1;  // 2 counts as As
  return num; // 1 -> 1, 4..7 -> 4..7, 10..12 -> 10..12
}

// Card value for sum in Juego/Punto (Figuras & 3 = 10, Ases & 2 = 1)
export function getCardSumValue(num: number): number {
  if (num === 3 || num === 10 || num === 11 || num === 12) return 10;
  if (num === 1 || num === 2) return 1;
  return num;
}

export function getHandSum(cards: Card[]): number {
  return cards.reduce((acc, c) => acc + getCardSumValue(c.number), 0);
}

// Evaluates Grande: returns sorted array of ranks descending [12, 12, 10, 4]
export function getGrandeRanks(cards: Card[]): number[] {
  return cards.map((c) => getMusRank(c.number)).sort((a, b) => b - a);
}

// Evaluates Chica: returns sorted array of ranks ascending [1, 1, 4, 10]
export function getChicaRanks(cards: Card[]): number[] {
  return cards.map((c) => getMusRank(c.number)).sort((a, b) => a - b);
}

export interface ParesEval {
  type: 'none' | 'par' | 'medias' | 'duples';
  level: number; // 0 for none, 1 for par, 2 for medias, 3 for duples
  primaryRank: number; // rank of best pair/medias/poker
  secondaryRank: number; // for duples (second pair)
}

export function evaluatePares(cards: Card[]): ParesEval {
  const counts: Record<number, number> = {};
  for (const c of cards) {
    const r = getMusRank(c.number);
    counts[r] = (counts[r] || 0) + 1;
  }

  const entries = Object.entries(counts).map(([r, count]) => ({
    rank: Number(r),
    count,
  }));

  // Poker (4 of same rank) counts as Duples of that rank
  const four = entries.find((e) => e.count === 4);
  if (four) {
    return { type: 'duples', level: 3, primaryRank: four.rank, secondaryRank: four.rank };
  }

  // Medias (3 of same rank)
  const three = entries.find((e) => e.count === 3);
  if (three) {
    return { type: 'medias', level: 2, primaryRank: three.rank, secondaryRank: 0 };
  }

  // Pairs
  const pairs = entries.filter((e) => e.count === 2).sort((a, b) => b.rank - a.rank);
  if (pairs.length === 2) {
    return { type: 'duples', level: 3, primaryRank: pairs[0].rank, secondaryRank: pairs[1].rank };
  }
  if (pairs.length === 1) {
    return { type: 'par', level: 1, primaryRank: pairs[0].rank, secondaryRank: 0 };
  }

  return { type: 'none', level: 0, primaryRank: 0, secondaryRank: 0 };
}

// Juego score order: 31 is best (score 8), 32 (score 7), 40 (score 6), 37 (5), 36 (4), 35 (3), 34 (2), 33 (1)
export function getJuegoScore(sum: number): number {
  if (sum < 31) return 0;
  if (sum === 31) return 8;
  if (sum === 32) return 7;
  if (sum === 40) return 6;
  if (sum === 37) return 5;
  if (sum === 36) return 4;
  if (sum === 35) return 3;
  if (sum === 34) return 2;
  if (sum === 33) return 1;
  return 0;
}

// Compare two players at Grande: returns 1 if pA better, -1 if pB better, 0 if tie
export function compareGrande(cardsA: Card[], cardsB: Card[]): number {
  const a = getGrandeRanks(cardsA);
  const b = getGrandeRanks(cardsB);
  for (let i = 0; i < 4; i++) {
    if (a[i] > b[i]) return 1;
    if (a[i] < b[i]) return -1;
  }
  return 0;
}

// Compare two players at Chica: returns 1 if pA better (lower is better!), -1 if pB better, 0 if tie
export function compareChica(cardsA: Card[], cardsB: Card[]): number {
  const a = getChicaRanks(cardsA);
  const b = getChicaRanks(cardsB);
  for (let i = 0; i < 4; i++) {
    if (a[i] < b[i]) return 1;
    if (a[i] > b[i]) return -1;
  }
  return 0;
}

// Compare two players at Pares: returns 1 if pA better, -1 if pB, 0 if tie
export function comparePares(evalA: ParesEval, evalB: ParesEval): number {
  if (evalA.level > evalB.level) return 1;
  if (evalA.level < evalB.level) return -1;
  if (evalA.level === 0) return 0;

  if (evalA.primaryRank > evalB.primaryRank) return 1;
  if (evalA.primaryRank < evalB.primaryRank) return -1;

  if (evalA.type === 'duples') {
    if (evalA.secondaryRank > evalB.secondaryRank) return 1;
    if (evalA.secondaryRank < evalB.secondaryRank) return -1;
  }
  return 0;
}

// Compare Juego: returns 1 if pA better, -1 if pB, 0 if tie
export function compareJuego(sumA: number, sumB: number): number {
  const scoreA = getJuegoScore(sumA);
  const scoreB = getJuegoScore(sumB);
  if (scoreA > scoreB) return 1;
  if (scoreA < scoreB) return -1;
  return 0;
}

// Compare Punto: returns 1 if pA better, -1 if pB, 0 if tie (closest to 30)
export function comparePunto(sumA: number, sumB: number): number {
  if (sumA > sumB) return 1;
  if (sumA < sumB) return -1;
  return 0;
}

// Available señas according to Reglamento Oficial de Mus de Bizkaia y Torneo de Txapeldunes (Artículo II)
export const SEÑAS: Seña[] = [
  {
    id: 'dos_reyes',
    name: 'Dos reyes: Morder labio inferior',
    gesture: '😬 (Muerde el labio inferior)',
    meaning: '2 Reyes (o Treses). Sin señas parciales de duples.',
    ruleCheck: (cards) => {
      const kings = cards.filter((c) => getMusRank(c.number) === 12);
      // No señas parciales si son duples
      return kings.length === 2 && evaluatePares(cards).type === 'par';
    },
  },
  {
    id: 'dos_ases',
    name: 'Dos ases: Sacar punta de lengua',
    gesture: '👅 (Saca la punta de la lengua hacia delante)',
    meaning: '2 Ases (o Doses). Sin señas parciales de duples.',
    ruleCheck: (cards) => {
      const aces = cards.filter((c) => getMusRank(c.number) === 1);
      return aces.length === 2 && evaluatePares(cards).type === 'par';
    },
  },
  {
    id: 'medias_ases',
    name: 'Medias de ases: Lengua a un lado',
    gesture: '👅 (Saca la punta de la lengua hacia un lado)',
    meaning: 'Medias de Ases (3 Ases o Doses)',
    ruleCheck: (cards) => {
      const aces = cards.filter((c) => getMusRank(c.number) === 1);
      return aces.length === 3;
    },
  },
  {
    id: 'medias_reyes',
    name: 'Medias de reyes: Comisura a un lado',
    gesture: '😏 (Mueve la comisura de los labios a un lado con Reyes)',
    meaning: 'Medias de Reyes (3 Reyes o Treses)',
    ruleCheck: (cards) => {
      const kings = cards.filter((c) => getMusRank(c.number) === 12);
      return kings.length === 3;
    },
  },
  {
    id: 'medias',
    name: 'Medias: Comisura a un lado',
    gesture: '😏 (Mueve la comisura de los labios a un lado)',
    meaning: 'Medias de cualquier carta (trío)',
    ruleCheck: (cards) => evaluatePares(cards).type === 'medias',
  },
  {
    id: 'duples',
    name: 'Duples: Levantar las cejas',
    gesture: '🤨 (Levanta ambas cejas)',
    meaning: 'Duples (Dobles parejas o póker)',
    ruleCheck: (cards) => evaluatePares(cards).type === 'duples',
  },
  {
    id: 'treinta_y_uno',
    name: 'Treinta y una (31): Guiñar un ojo',
    gesture: '😉 (Guiña un ojo)',
    meaning: 'Juego de 31 (Treinta y una - La mejor jugada)',
    ruleCheck: (cards) => getHandSum(cards) === 31,
  },
  {
    id: 'punto_treinta',
    name: 'Treinta al no juego: Guiñar un ojo',
    gesture: '😉 (Guiña un ojo tras «juego no»)',
    meaning: 'Treinta al juego / 30 de Punto',
    ruleCheck: (cards) => getHandSum(cards) === 30,
  },
  {
    id: 'ciego',
    name: 'Ciego: Cerrar los dos ojos',
    gesture: '😑 (Cierra los dos ojos)',
    meaning: 'Ciego (Sin pares y sin juego - No válida con 29)',
    ruleCheck: (cards) =>
      evaluatePares(cards).type === 'none' &&
      getHandSum(cards) < 31 &&
      getHandSum(cards) !== 30 &&
      getHandSum(cards) !== 29,
  },
];

// Resolves winning team for a lance (0 = Team Player, 1 = Team Rivals)
// using player hands and mano index (in case of rank tie, closest to mano in order wins)
export function getWinningTeamForLance(
  lance: 'grande' | 'chica' | 'pares' | 'juego' | 'punto',
  players: Player[],
  manoIndex: number
): { winningTeam: 0 | 1; winningPlayerIndex: number; description: string } {
  // Ordered by turn from mano
  const seatOrder = [0, 1, 2, 3].map((i) => (manoIndex + i) % 4);

  let bestIndex = seatOrder[0];

  for (let i = 1; i < 4; i++) {
    const candidateIndex = seatOrder[i];
    let cmp = 0;

    if (lance === 'grande') {
      cmp = compareGrande(players[candidateIndex].cards, players[bestIndex].cards);
    } else if (lance === 'chica') {
      cmp = compareChica(players[candidateIndex].cards, players[bestIndex].cards);
    } else if (lance === 'pares') {
      const evalCand = evaluatePares(players[candidateIndex].cards);
      const evalBest = evaluatePares(players[bestIndex].cards);
      cmp = comparePares(evalCand, evalBest);
    } else if (lance === 'juego') {
      const sumCand = getHandSum(players[candidateIndex].cards);
      const sumBest = getHandSum(players[bestIndex].cards);
      cmp = compareJuego(sumCand, sumBest);
    } else if (lance === 'punto') {
      const sumCand = getHandSum(players[candidateIndex].cards);
      const sumBest = getHandSum(players[bestIndex].cards);
      cmp = comparePunto(sumCand, sumBest);
    }

    // In Mus, if candidate is strictly better (>0), candidate takes the lead.
    // If tie (==0), the one who was earlier in seatOrder (closer to mano) wins the tie!
    if (cmp > 0) {
      bestIndex = candidateIndex;
    }
  }

  const bestPlayer = players[bestIndex];
  return {
    winningTeam: bestPlayer.team,
    winningPlayerIndex: bestIndex,
    description: `${bestPlayer.name} gana el lance de ${lance.toUpperCase()} (Mano o mejor valor).`,
  };
}

export function getRankName(rank: number): string {
  if (rank === 12) return 'Rey';
  if (rank === 11) return 'Caballo';
  if (rank === 10) return 'Sota';
  if (rank === 1) return 'As';
  return `${rank}`;
}

export function describeParesHand(cards: Card[]): {
  hasPares: boolean;
  type: 'none' | 'par' | 'medias' | 'duples';
  title: string;
  detail: string;
} {
  const p = evaluatePares(cards);
  if (p.type === 'none') {
    return {
      hasPares: false,
      type: 'none',
      title: 'Sin Pares',
      detail: 'Tus 4 cartas son de diferente valor.',
    };
  }
  if (p.type === 'duples') {
    return {
      hasPares: true,
      type: 'duples',
      title: '¡Tienes DUPLES!',
      detail: `Duples de ${getRankName(p.primaryRank)}es y ${getRankName(p.secondaryRank)}es`,
    };
  }
  if (p.type === 'medias') {
    return {
      hasPares: true,
      type: 'medias',
      title: '¡Tienes MEDIAS!',
      detail: `Trío / Medias de ${getRankName(p.primaryRank)}es`,
    };
  }
  return {
    hasPares: true,
    type: 'par',
    title: '¡Tienes PAR!',
    detail: `Pareja de ${getRankName(p.primaryRank)}es`,
  };
}

export function describeJuegoHand(cards: Card[]): {
  hasJuego: boolean;
  sum: number;
  title: string;
  detail: string;
} {
  const sum = getHandSum(cards);
  if (sum >= 31) {
    const special =
      sum === 31 ? '31 (Treinta y una - La mejor)' : sum === 32 ? '32 de Juego' : `${sum} de Juego`;
    return {
      hasJuego: true,
      sum,
      title: '¡Tienes JUEGO!',
      detail: `Tus cartas suman ${sum} (${special})`,
    };
  }
  return {
    hasJuego: false,
    sum,
    title: 'Sin Juego (Punto)',
    detail: `Tus cartas suman ${sum} (no llegas a 31; juegas al Punto)`,
  };
}
