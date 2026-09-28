import { Player, LanceBetState, Card, LancePhase } from './types';
import {
  evaluatePares,
  getHandSum,
  getMusRank,
  getGrandeRanks,
  getChicaRanks,
} from './musLogic';
import { PC_MUS_CHARACTERS } from './characters';

export type LanceActionType = 'paso' | 'envido' | 'mas' | 'ordago' | 'quiero' | 'no_quiero';

export interface LanceAIDecision {
  action: LanceActionType;
  speech: string;
  gesture?: string;
}

export function decideMusOrNoMus(player: Player): { wantsMus: boolean; speech: string } {
  const char = PC_MUS_CHARACTERS.find((c) => c.id === player.id) || PC_MUS_CHARACTERS[0];
  const handSum = getHandSum(player.cards);
  const paresEval = evaluatePares(player.cards);
  const kings = player.cards.filter((c) => getMusRank(c.number) === 12).length;
  const aces = player.cards.filter((c) => getMusRank(c.number) === 1).length;

  // Good hand condition:
  // 1. Has 31 or 32 in Juego
  // 2. Has Duples or Medias
  // 3. Has 3 or 4 Kings (amazing Grande)
  // 4. Has 3 or 4 Aces (amazing Chica)
  const isSuperbHand = handSum === 31 || handSum === 32 || paresEval.level >= 2 || kings >= 3 || aces >= 3;
  const isGoodHand = handSum >= 31 || paresEval.level >= 1 || kings >= 2 || aces >= 2;

  // AI may decide to cut mus based on aggression
  const wantsToCut = isSuperbHand || (isGoodHand && Math.random() < player.aggressiveness);

  if (wantsToCut) {
    const quote = char.dialogs.noMus[Math.floor(Math.random() * char.dialogs.noMus.length)];
    return { wantsMus: false, speech: quote };
  } else {
    const quote = char.dialogs.mus[Math.floor(Math.random() * char.dialogs.mus.length)];
    return { wantsMus: true, speech: quote };
  }
}

// Discard algorithm for AI: keep pairs, kings, aces, and cards summing to 31
export function getAIDiscardIndices(cards: Card[]): number[] {
  const discardIndices: number[] = [];
  const pares = evaluatePares(cards);
  const sum = getHandSum(cards);

  // If already has 31 or 32, don't discard anything!
  if (sum === 31 || sum === 32) return [];

  // Keep pairs
  cards.forEach((card, idx) => {
    const rank = getMusRank(card.number);
    const isPairCard = pares.level > 0 && rank === pares.primaryRank;
    const isKing = rank === 12;
    const isAce = rank === 1;

    // Discard middle cards (4, 5, 6, 7) unless part of good hand
    if (!isPairCard && !isKing && !isAce) {
      discardIndices.push(idx);
    }
  });

  // If keeping all, but not satisfied, discard the lowest non-essential card
  if (discardIndices.length === 0 && sum < 31 && pares.level < 2) {
    const sorted = cards
      .map((c, i) => ({ i, r: getMusRank(c.number) }))
      .sort((a, b) => a.r - b.r);
    // Discard 1 or 2 cards
    discardIndices.push(sorted[0].i);
  }

  return discardIndices;
}

// Betting decision during a lance
export function decideLanceAction(
  player: Player,
  lance: 'grande' | 'chica' | 'pares' | 'juego' | 'punto',
  betState: LanceBetState,
  teamScore: number,
  rivalScore: number
): LanceAIDecision {
  const char = PC_MUS_CHARACTERS.find((c) => c.id === player.id) || PC_MUS_CHARACTERS[0];
  const handSum = getHandSum(player.cards);
  const pares = evaluatePares(player.cards);
  const grandeRanks = getGrandeRanks(player.cards);
  const chicaRanks = getChicaRanks(player.cards);

  // Evaluate card strength for current lance on scale 0..10
  let strength = 0;

  if (lance === 'grande') {
    const kings = grandeRanks.filter((r) => r === 12).length;
    strength = kings * 2.5 + (grandeRanks[0] >= 11 ? 1 : 0);
  } else if (lance === 'chica') {
    const aces = chicaRanks.filter((r) => r === 1).length;
    strength = aces * 2.5 + (chicaRanks[0] <= 4 ? 1 : 0);
  } else if (lance === 'pares') {
    if (pares.type === 'duples') {
      strength = 8 + (pares.primaryRank === 12 ? 2 : 0);
    } else if (pares.type === 'medias') {
      strength = 6 + (pares.primaryRank === 12 ? 2 : 0);
    } else if (pares.type === 'par') {
      strength = 3 + (pares.primaryRank === 12 ? 2 : 0);
    } else {
      strength = 0;
    }
  } else if (lance === 'juego') {
    if (handSum === 31) strength = 10;
    else if (handSum === 32) strength = 8.5;
    else if (handSum === 40) strength = 7;
    else if (handSum >= 33) strength = 5;
    else strength = 0;
  } else if (lance === 'punto') {
    if (handSum === 30) strength = 9;
    else if (handSum === 29) strength = 7.5;
    else if (handSum >= 27) strength = 5.5;
    else strength = 3;
  }

  // Factor in bluff probability
  const isBluffing = Math.random() < player.bluffRate * 0.35;
  if (isBluffing) {
    strength += 4;
  }

  const isTrailing = rivalScore - teamScore > 10;
  const isMatchPoint = teamScore >= 35 || rivalScore >= 35;

  // SCENARIO 1: No bet yet (currentBet === 0)
  if (betState.currentBet === 0) {
    // Should we Órdago?
    if ((strength >= 9.5 && Math.random() < player.aggressiveness) || (isMatchPoint && strength >= 7) || (isBluffing && Math.random() < 0.2)) {
      const speech = char.dialogs.ordago[Math.floor(Math.random() * char.dialogs.ordago.length)];
      return { action: 'ordago', speech };
    }

    // Should we Envido?
    if (strength >= 5 || (Math.random() < player.aggressiveness * 0.6)) {
      const speech = char.dialogs.envido[Math.floor(Math.random() * char.dialogs.envido.length)];
      return { action: 'envido', speech };
    }

    // Otherwise Paso
    return {
      action: 'paso',
      speech: 'Paso.',
    };
  }

  // SCENARIO 2: Rival declared ÓRDAGO!
  if (betState.isOrdago) {
    // Want to accept órdago?
    // Need top strength, or desperation
    const willQuieroOrdago = strength >= 8.5 || (isTrailing && strength >= 7);
    if (willQuieroOrdago) {
      const speech = char.dialogs.quiero[Math.floor(Math.random() * char.dialogs.quiero.length)];
      return { action: 'quiero', speech };
    } else {
      const speech = char.dialogs.noQuiero[Math.floor(Math.random() * char.dialogs.noQuiero.length)];
      return { action: 'no_quiero', speech };
    }
  }

  // SCENARIO 3: Rival bet (envido or raise)
  // Bet is at least 2
  if (strength >= 8.5) {
    // Super strong: can throw ÓRDAGO or raise Más
    if (Math.random() < 0.35) {
      const speech = char.dialogs.ordago[Math.floor(Math.random() * char.dialogs.ordago.length)];
      return { action: 'ordago', speech };
    } else {
      const speech = `¡Dos más, y son ${betState.currentBet + 2}!`;
      return { action: 'mas', speech };
    }
  } else if (strength >= 4.5 || isBluffing) {
    // Good enough to accept ("Quiero")
    const speech = char.dialogs.quiero[Math.floor(Math.random() * char.dialogs.quiero.length)];
    return { action: 'quiero', speech };
  } else {
    // Weak: decline ("No quiero")
    const speech = char.dialogs.noQuiero[Math.floor(Math.random() * char.dialogs.noQuiero.length)];
    return { action: 'no_quiero', speech };
  }
}
