import { Player, LanceBetState, Card, LancePhase } from './types';
import {
  evaluatePares,
  getHandSum,
  getMusRank,
  getGrandeRanks,
  getChicaRanks,
} from './musLogic';
import { PC_MUS_CHARACTERS } from './characters';
import { userProfileEngine } from './userProfileEngine';
import { maxSeñaStrength } from './gazeSystem';

export type LanceActionType = 'paso' | 'envido' | 'mas' | 'ordago' | 'quiero' | 'no_quiero';

export interface LanceAIDecision {
  action: LanceActionType;
  speech: string;
  gesture?: string;
}

// Game levels. They change how well the rivals play:
// - noise: random error added to the AI's reading of its own hand
// - learn: how much it uses what it has learned about you (0 = nothing, 1 = everything)
// - rivalIntel: whether it uses the señas it caught from you
// - blunder: chance of simply playing a random legal move
export type Difficulty = 'facil' | 'medio' | 'dificil';
export const DIFFICULTY_SETTINGS: Record<Difficulty, { noise: number; learn: number; rivalIntel: boolean; blunder: number; smart: boolean }> = {
  facil: { noise: 2.5, learn: 0, rivalIntel: false, blunder: 0.15, smart: false },
  medio: { noise: 1, learn: 0.6, rivalIntel: true, blunder: 0.03, smart: false },
  dificil: { noise: 0, learn: 1, rivalIntel: true, blunder: 0, smart: true },
};

// What the AI's team has learned through señas this hand
export interface SeñaIntel {
  partnerSeñas: string[]; // señas received from the partner
  rivalSeñas: string[]; // señas caught from the rivals
}

export function decideMusOrNoMus(player: Player, difficulty: Difficulty = 'medio'): { wantsMus: boolean; speech: string } {
  const level = DIFFICULTY_SETTINGS[difficulty];
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

  // Adaptive learning factor against the user
  const tactical = userProfileEngine.analyzeUser();
  const isRivalTeam = player.team === 1; // Seats 1 and 3 are rivals to seat 0 (human user)

  // If user is a rival and has high mus tendency (always wants discards), rival AI cuts mus more aggressively
  let cutBonus = 0;
  if (isRivalTeam && tactical.musTendency >= 70 && isGoodHand) {
    cutBonus = 0.25 * level.learn; // Cut mus to deny user easy improvements
  }

  // AI may decide to cut mus based on aggression + tactical learning.
  // On easy, it sometimes keeps asking for mus with a great hand (or cuts with a poor one).
  const sloppy = !level.smart && Math.random() < level.blunder * 2;
  const wantsToCut = sloppy
    ? Math.random() < 0.5
    : isSuperbHand || (isGoodHand && Math.random() < player.aggressiveness + cutBonus);

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

  // According to Reglamento de Bizkaia (Art. IV, Punto 2):
  // "Ningún jugador podrá quedarse con las cuatro cartas, obligatoriamente tendrá que pedir como mínimo una."
  if (discardIndices.length === 0) {
    const sorted = cards
      .map((c, i) => ({ i, r: getMusRank(c.number) }))
      .sort((a, b) => a.r - b.r);
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
  rivalScore: number,
  intel?: SeñaIntel,
  difficulty: Difficulty = 'medio'
): LanceAIDecision {
  const level = DIFFICULTY_SETTINGS[difficulty];
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

  // Easy rivals misread their own cards; hard ones read them exactly
  if (level.noise > 0) strength += (Math.random() - 0.5) * 2 * level.noise;

  // Señas: knowing the partner's cards lets the AI play the team's hand,
  // knowing the rivals' cards lets it avoid traps and punish weak hands.
  let rivalKnownStrong = false;
  if (intel) {
    const partnerEst = maxSeñaStrength(intel.partnerSeñas, lance);
    if (partnerEst !== undefined) {
      strength = Math.max(strength, partnerEst) + (partnerEst >= 6 ? 0.5 : 0);
    }
    const rivalEst = level.rivalIntel ? maxSeñaStrength(intel.rivalSeñas, lance) : undefined;
    if (rivalEst !== undefined) {
      if (rivalEst >= strength + 1) {
        strength -= 2.5;
        rivalKnownStrong = true;
      } else if (rivalEst <= 3) {
        strength += 1.5;
      }
    }
  }

  // What the AI has learned about you (weighted by the game level)
  const isRivalOfUser = player.team === 1;
  const tactical = userProfileEngine.analyzeUser();
  const learn = isRivalOfUser ? level.learn : 0;
  // You give up easily when somebody bets → the AI bluffs more against you
  const youFoldOften = learn > 0 && (tactical.foldRate ?? 0) >= 60;

  // Factor in bluff probability (nobody bluffs into a hand they know is better)
  const bluffChance = player.bluffRate * 0.35 + (youFoldOften && betState.currentBet === 0 ? 0.15 * learn : 0);
  const isBluffing = !rivalKnownStrong && Math.random() < bluffChance;
  if (isBluffing) {
    strength += 4;
  }

  const isTrailing = rivalScore - teamScore > 10;
  const isMatchPoint = teamScore >= 35 || rivalScore >= 35;

  // Adaptive Learning Counter-Strategy against the human user (Seat 0)
  const fullCounter = tactical.aiCounterStrategy;
  const counter = {
    ...fullCounter,
    callThresholdShift: fullCounter.callThresholdShift * learn,
    raiseTendencyShift: fullCounter.raiseTendencyShift * learn,
    trapTendency: fullCounter.trapTendency * learn,
  };
  const userWasLastBettor = betState.lastBettorIndex === 0;

  // Effective thresholds modified by what the AI has learned from the user
  let callThreshold = 4.5;
  let ordagoCallThreshold = 8.5;

  if (isRivalOfUser && userWasLastBettor) {
    // If user bluffs a lot, AI call threshold drops (Cazador de faroles)
    // If user is amarrategui, AI call threshold increases (respects bet, folds weak hands)
    callThreshold += counter.callThresholdShift;
    ordagoCallThreshold += (counter.callThresholdShift * 0.5);
    // Learned for THIS lance: if you bluff here a lot, the AI calls you; if you never do, it believes you
    const lanceBluff = tactical.lanceBluffRate?.[lance];
    if (lanceBluff !== null && lanceBluff !== undefined) {
      if (lanceBluff >= 40) {
        callThreshold -= 1.5 * learn;
        ordagoCallThreshold -= 0.8 * learn;
      } else if (lanceBluff <= 10) {
        callThreshold += 1.5 * learn;
        ordagoCallThreshold += 0.8 * learn;
      }
    }
  }

  // Easy level: now and then a plain mistake
  if (level.blunder > 0 && Math.random() < level.blunder) {
    const options: LanceActionType[] = betState.currentBet === 0 ? ['paso', 'envido'] : ['quiero', 'no_quiero'];
    const action = options[Math.floor(Math.random() * options.length)];
    const pool =
      action === 'envido' ? char.dialogs.envido : action === 'quiero' ? char.dialogs.quiero : action === 'no_quiero' ? char.dialogs.noQuiero : ['Paso.'];
    return { action, speech: pool[Math.floor(Math.random() * pool.length)] || 'Paso.' };
  }

  // SCENARIO 1: No bet yet (currentBet === 0)
  if (betState.currentBet === 0) {
    // AI Trap tactic: If user is known to be overly aggressive, AI with strong hand (strength >= 8.5)
    // may pass first (slow-play) to let the aggressive user fall into the trap.
    if (isRivalOfUser && strength >= 8.5 && Math.random() < counter.trapTendency) {
      return { action: 'paso', speech: 'Paso...' };
    }

    // Should we Órdago?
    const ordagoPressure = (isRivalOfUser && tactical.riskTolerance <= 35) ? 0.2 * learn : 0;
    if (
      (strength >= 9.5 && Math.random() < (player.aggressiveness + ordagoPressure)) ||
      (isMatchPoint && strength >= 7) ||
      (isBluffing && Math.random() < (0.2 + ordagoPressure))
    ) {
      const speech = char.dialogs.ordago[Math.floor(Math.random() * char.dialogs.ordago.length)];
      return { action: 'ordago', speech };
    }

    // Should we Envido?
    // Against an amarrategui user, AI steals pots easily with moderate strength (>= 3.8)
    let stealThreshold = (isRivalOfUser && learn > 0 && tactical.aggressiveness <= 35) ? 5.0 - 1.2 * learn : 5.0;
    if (youFoldOften) stealThreshold -= 0.8 * learn;
    // Hard level: when everybody before has passed, a medium hand is enough to take the stone
    const passesSoFar = betState.history.filter((h) => h.action === 'paso').length;
    if (level.smart && passesSoFar >= 2) stealThreshold -= 1;
    if (strength >= stealThreshold || (Math.random() < (player.aggressiveness + counter.raiseTendencyShift) * 0.6)) {
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
    // Need top strength, or desperation, calibrated against user's bluff frequency
    const willQuieroOrdago = strength >= ordagoCallThreshold || (isTrailing && strength >= (ordagoCallThreshold - 1.5));
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
    if (Math.random() < 0.35 + counter.raiseTendencyShift) {
      const speech = char.dialogs.ordago[Math.floor(Math.random() * char.dialogs.ordago.length)];
      return { action: 'ordago', speech };
    } else {
      const speech = `¡Dos más, y son ${betState.currentBet + 2}!`;
      return { action: 'mas', speech };
    }
  } else if (strength >= callThreshold || isBluffing) {
    // Good enough to accept ("Quiero") - modulated by user learning!
    const speech = char.dialogs.quiero[Math.floor(Math.random() * char.dialogs.quiero.length)];
    return { action: 'quiero', speech };
  } else {
    // Weak: decline ("No quiero")
    const speech = char.dialogs.noQuiero[Math.floor(Math.random() * char.dialogs.noQuiero.length)];
    return { action: 'no_quiero', speech };
  }
}
