import { Card, LanceBetState, Player } from './types';
import {
  evaluatePares,
  getHandSum,
  getMusRank,
  getWinningTeamForLance,
  compareGrande,
  compareChica,
} from './musLogic';

export interface LanceRecountDetail {
  lanceKey: 'grande' | 'chica' | 'pares' | 'juego' | 'punto';
  lanceTitle: string;
  icon: string;
  winningTeam: 0 | 1 | null;
  winningPlayerIndex: number | null;
  winnerName: string;
  cardsDescriptionTeam0: string;
  cardsDescriptionTeam1: string;
  betType: 'en_blanco' | 'aceptada' | 'rechazada' | 'sin_jugada' | 'solo_un_equipo';
  betSummary: string;
  jugadaBonusSummary?: string;
  pointsAwarded: number;
  explanation: string;
}

export interface HandRecountPlan {
  steps: LanceRecountDetail[];
  totalTeam0: number;
  totalTeam1: number;
}

// Translate a card number into human-readable Mus term
export function rankToMusName(num: number): string {
  const r = getMusRank(num);
  if (r === 12) return 'Rey';
  if (r === 11) return 'Caballo';
  if (r === 10) return 'Sota';
  if (r === 7) return '7';
  if (r === 6) return '6';
  if (r === 5) return '5';
  if (r === 4) return '4';
  if (r === 1) return 'As';
  return String(num);
}

export function describeCardsForGrande(cards: Card[]): string {
  const sorted = [...cards].sort((a, b) => getMusRank(b.number) - getMusRank(a.number));
  return sorted.map((c) => rankToMusName(c.number)).join(', ');
}

export function describeCardsForChica(cards: Card[]): string {
  const sorted = [...cards].sort((a, b) => getMusRank(a.number) - getMusRank(b.number));
  return sorted.map((c) => rankToMusName(c.number)).join(', ');
}

export function describeCardsForPares(cards: Card[]): { desc: string; bonus: number; type: string } {
  const evalP = evaluatePares(cards);
  if (evalP.type === 'none') {
    return { desc: 'Sin pares', bonus: 0, type: 'none' };
  }
  if (evalP.type === 'par') {
    return { desc: `Par de ${rankToMusName(evalP.primaryRank)}s (+1 piedra)`, bonus: 1, type: 'par' };
  }
  if (evalP.type === 'medias') {
    return { desc: `Medias de ${rankToMusName(evalP.primaryRank)}s (+2 piedras)`, bonus: 2, type: 'medias' };
  }
  return {
    desc: `Duples de ${rankToMusName(evalP.primaryRank)}s y ${rankToMusName(evalP.secondaryRank)}s (+3 piedras)`,
    bonus: 3,
    type: 'duples',
  };
}

export function describeCardsForJuego(cards: Card[]): { sum: number; desc: string; bonus: number } {
  const sum = getHandSum(cards);
  if (sum >= 31) {
    const bonus = sum === 31 ? 3 : 2;
    return {
      sum,
      desc: `Juego de ${sum} (+${bonus} piedras de tanteo)`,
      bonus,
    };
  }
  return {
    sum,
    desc: `Punto de ${sum}`,
    bonus: 0,
  };
}

/**
 * Builds the complete recount sequence according to official 8-reyes Mus rules.
 */
export function computeHandRecountPlan(
  players: Player[],
  manoIndex: number,
  lanceBets: Record<string, LanceBetState>
): HandRecountPlan {
  const steps: LanceRecountDetail[] = [];
  let totalTeam0 = 0;
  let totalTeam1 = 0;

  // 1. GRANDE
  const resGrande = getWinningTeamForLance('grande', players, manoIndex);
  const betGrande = lanceBets.grande;
  const bestT0PlayerIdx = compareGrande(players[0].cards, players[2].cards) >= 0 ? 0 : 2;
  const bestT1PlayerIdx = compareGrande(players[1].cards, players[3].cards) >= 0 ? 1 : 3;

  const descG0 = `${players[bestT0PlayerIdx].name}: [${describeCardsForGrande(players[bestT0PlayerIdx].cards)}]`;
  const descG1 = `${players[bestT1PlayerIdx].name}: [${describeCardsForGrande(players[bestT1PlayerIdx].cards)}]`;

  let ptsGrande = 0;
  let betTypeGrande: LanceRecountDetail['betType'] = 'en_blanco';
  let betSummaryGrande = 'Pasa en silencio (1 piedra de ley)';

  if (betGrande.rejected) {
    betTypeGrande = 'rechazada';
    betSummaryGrande = 'Retirada previa (ya cobrada en mesa durante el lance)';
    ptsGrande = 0;
  } else if (betGrande.accepted) {
    betTypeGrande = 'aceptada';
    ptsGrande = betGrande.currentBet;
    betSummaryGrande = `Envite aceptado de ${betGrande.currentBet} piedras`;
  } else {
    ptsGrande = 1;
  }

  if (ptsGrande > 0) {
    if (resGrande.winningTeam === 0) totalTeam0 += ptsGrande;
    else totalTeam1 += ptsGrande;
  }

  steps.push({
    lanceKey: 'grande',
    lanceTitle: 'A LA GRANDE',
    icon: '👑',
    winningTeam: resGrande.winningTeam,
    winningPlayerIndex: resGrande.winningPlayerIndex,
    winnerName: players[resGrande.winningPlayerIndex].name,
    cardsDescriptionTeam0: descG0,
    cardsDescriptionTeam1: descG1,
    betType: betTypeGrande,
    betSummary: betSummaryGrande,
    pointsAwarded: ptsGrande,
    explanation:
      ptsGrande > 0
        ? `Gana ${players[resGrande.winningPlayerIndex].name} (${resGrande.winningTeam === 0 ? 'Equipo Jugador' : 'Rivales'}) por mejores figuras a la Grande (+${ptsGrande} piedra${ptsGrande > 1 ? 's' : ''}).`
        : `Lance resuelto previamente por retirada de un equipo.`,
  });

  // 2. CHICA
  const resChica = getWinningTeamForLance('chica', players, manoIndex);
  const betChica = lanceBets.chica;
  const bestChicaT0Idx = compareChica(players[0].cards, players[2].cards) >= 0 ? 0 : 2;
  const bestChicaT1Idx = compareChica(players[1].cards, players[3].cards) >= 0 ? 1 : 3;

  const descC0 = `${players[bestChicaT0Idx].name}: [${describeCardsForChica(players[bestChicaT0Idx].cards)}]`;
  const descC1 = `${players[bestChicaT1Idx].name}: [${describeCardsForChica(players[bestChicaT1Idx].cards)}]`;

  let ptsChica = 0;
  let betTypeChica: LanceRecountDetail['betType'] = 'en_blanco';
  let betSummaryChica = 'Pasa en silencio (1 piedra de ley)';

  if (betChica.rejected) {
    betTypeChica = 'rechazada';
    betSummaryChica = 'Retirada previa (ya cobrada en mesa)';
    ptsChica = 0;
  } else if (betChica.accepted) {
    betTypeChica = 'aceptada';
    ptsChica = betChica.currentBet;
    betSummaryChica = `Envite aceptado de ${betChica.currentBet} piedras`;
  } else {
    ptsChica = 1;
  }

  if (ptsChica > 0) {
    if (resChica.winningTeam === 0) totalTeam0 += ptsChica;
    else totalTeam1 += ptsChica;
  }

  steps.push({
    lanceKey: 'chica',
    lanceTitle: 'A LA CHICA',
    icon: '🤏',
    winningTeam: resChica.winningTeam,
    winningPlayerIndex: resChica.winningPlayerIndex,
    winnerName: players[resChica.winningPlayerIndex].name,
    cardsDescriptionTeam0: descC0,
    cardsDescriptionTeam1: descC1,
    betType: betTypeChica,
    betSummary: betSummaryChica,
    pointsAwarded: ptsChica,
    explanation:
      ptsChica > 0
        ? `Gana ${players[resChica.winningPlayerIndex].name} (${resChica.winningTeam === 0 ? 'Equipo Jugador' : 'Rivales'}) por cartas más bajas a la Chica (+${ptsChica} piedra${ptsChica > 1 ? 's' : ''}).`
        : `Lance resuelto previamente por retirada de un equipo.`,
  });

  // 3. PARES
  const p0Pares = describeCardsForPares(players[0].cards);
  const p1Pares = describeCardsForPares(players[1].cards);
  const p2Pares = describeCardsForPares(players[2].cards);
  const p3Pares = describeCardsForPares(players[3].cards);

  const hasParesTeam0 = p0Pares.bonus > 0 || p2Pares.bonus > 0;
  const hasParesTeam1 = p1Pares.bonus > 0 || p3Pares.bonus > 0;

  const descP0 = `${players[0].name}: ${p0Pares.desc} | ${players[2].name}: ${p2Pares.desc}`;
  const descP1 = `${players[1].name}: ${p1Pares.desc} | ${players[3].name}: ${p3Pares.desc}`;

  if (!hasParesTeam0 && !hasParesTeam1) {
    steps.push({
      lanceKey: 'pares',
      lanceTitle: 'A LOS PARES',
      icon: '👥',
      winningTeam: null,
      winningPlayerIndex: null,
      winnerName: 'Ninguno',
      cardsDescriptionTeam0: descP0,
      cardsDescriptionTeam1: descP1,
      betType: 'sin_jugada',
      betSummary: 'Nadie tiene Pares',
      pointsAwarded: 0,
      explanation: 'Ningún equipo tiene pares en la mano. No se otorgan piedras en este lance.',
    });
  } else {
    const betPares = lanceBets.pares;
    let winningTeamPares: 0 | 1;
    let winningPlayerIdxPares: number;

    if (betPares.rejected && betPares.lastBettorTeam !== null) {
      winningTeamPares = betPares.lastBettorTeam === 0 ? 0 : 1;
      winningPlayerIdxPares = winningTeamPares === 0 ? 0 : 1;
    } else if (hasParesTeam0 && !hasParesTeam1) {
      winningTeamPares = 0;
      winningPlayerIdxPares = p0Pares.bonus >= p2Pares.bonus ? 0 : 2;
    } else if (!hasParesTeam0 && hasParesTeam1) {
      winningTeamPares = 1;
      winningPlayerIdxPares = p1Pares.bonus >= p3Pares.bonus ? 1 : 3;
    } else {
      const resP = getWinningTeamForLance('pares', players, manoIndex);
      winningTeamPares = resP.winningTeam;
      winningPlayerIdxPares = resP.winningPlayerIndex;
    }

    const pairBonusWon =
      winningTeamPares === 0 ? p0Pares.bonus + p2Pares.bonus : p1Pares.bonus + p3Pares.bonus;

    const betPts = betPares.accepted ? betPares.currentBet : 0;
    const totalPtsPares = betPts + pairBonusWon;

    if (totalPtsPares > 0) {
      if (winningTeamPares === 0) totalTeam0 += totalPtsPares;
      else totalTeam1 += totalPtsPares;
    }

    let betSummary = 'Cobro directo de jugada';
    if (betPares.accepted) betSummary = `Envite aceptado de ${betPares.currentBet} piedras + valor de pares`;
    else if (betPares.rejected) betSummary = `Envite declinado previamente + cobro reglamentario de pares`;
    else if (!hasParesTeam0 || !hasParesTeam1) betSummary = `Solo un equipo tenía pares (cobro directo)`;

    steps.push({
      lanceKey: 'pares',
      lanceTitle: 'A LOS PARES',
      icon: '👥',
      winningTeam: winningTeamPares,
      winningPlayerIndex: winningPlayerIdxPares,
      winnerName: players[winningPlayerIdxPares].name,
      cardsDescriptionTeam0: descP0,
      cardsDescriptionTeam1: descP1,
      betType: betPares.accepted ? 'aceptada' : 'en_blanco',
      betSummary,
      jugadaBonusSummary: `Jugada de ${winningTeamPares === 0 ? 'Equipo Jugador' : 'Rivales'}: ${pairBonusWon} piedras (${winningTeamPares === 0 ? `${players[0].name}: ${p0Pares.bonus}, ${players[2].name}: ${p2Pares.bonus}` : `${players[1].name}: ${p1Pares.bonus}, ${players[3].name}: ${p3Pares.bonus}`})`,
      pointsAwarded: totalPtsPares,
      explanation: `Gana el lance ${players[winningPlayerIdxPares].name} (${winningTeamPares === 0 ? 'Equipo Jugador' : 'Rivales'}) sumando ${totalPtsPares} piedra${totalPtsPares > 1 ? 's' : ''} (${pairBonusWon} de jugada${betPts > 0 ? ` + ${betPts} de apuesta` : ''}).`,
    });
  }

  // 4. JUEGO O PUNTO
  const j0 = describeCardsForJuego(players[0].cards);
  const j1 = describeCardsForJuego(players[1].cards);
  const j2 = describeCardsForJuego(players[2].cards);
  const j3 = describeCardsForJuego(players[3].cards);

  const hasJuegoT0 = j0.sum >= 31 || j2.sum >= 31;
  const hasJuegoT1 = j1.sum >= 31 || j3.sum >= 31;
  const anyHasJuego = hasJuegoT0 || hasJuegoT1;

  if (anyHasJuego) {
    const descJ0 = `${players[0].name}: ${j0.desc} | ${players[2].name}: ${j2.desc}`;
    const descJ1 = `${players[1].name}: ${j1.desc} | ${players[3].name}: ${j3.desc}`;
    const betJuego = lanceBets.juego;

    let winningTeamJuego: 0 | 1;
    let winningPlayerIdxJuego: number;

    if (betJuego.rejected && betJuego.lastBettorTeam !== null) {
      winningTeamJuego = betJuego.lastBettorTeam === 0 ? 0 : 1;
      winningPlayerIdxJuego = winningTeamJuego === 0 ? 0 : 1;
    } else if (hasJuegoT0 && !hasJuegoT1) {
      winningTeamJuego = 0;
      winningPlayerIdxJuego = j0.sum >= 31 ? 0 : 2;
    } else if (!hasJuegoT0 && hasJuegoT1) {
      winningTeamJuego = 1;
      winningPlayerIdxJuego = j1.sum >= 31 ? 1 : 3;
    } else {
      const resJ = getWinningTeamForLance('juego', players, manoIndex);
      winningTeamJuego = resJ.winningTeam;
      winningPlayerIdxJuego = resJ.winningPlayerIndex;
    }

    const tanteoBonus =
      winningTeamJuego === 0 ? j0.bonus + j2.bonus : j1.bonus + j3.bonus;
    const betPts = betJuego.accepted ? betJuego.currentBet : 0;
    const totalPtsJuego = betPts + tanteoBonus;

    if (totalPtsJuego > 0) {
      if (winningTeamJuego === 0) totalTeam0 += totalPtsJuego;
      else totalTeam1 += totalPtsJuego;
    }

    let betSummary = 'Cobro directo de tanteo de Juego';
    if (betJuego.accepted) betSummary = `Envite aceptado de ${betJuego.currentBet} piedras + tanteo de Juego`;
    else if (betJuego.rejected) betSummary = `Envite declinado previamente + tanteo de Juego`;
    else if (!hasJuegoT0 || !hasJuegoT1) betSummary = `Solo un equipo tenía Juego (cobro directo)`;

    steps.push({
      lanceKey: 'juego',
      lanceTitle: 'AL JUEGO',
      icon: '🎯',
      winningTeam: winningTeamJuego,
      winningPlayerIndex: winningPlayerIdxJuego,
      winnerName: players[winningPlayerIdxJuego].name,
      cardsDescriptionTeam0: descJ0,
      cardsDescriptionTeam1: descJ1,
      betType: betJuego.accepted ? 'aceptada' : 'en_blanco',
      betSummary,
      jugadaBonusSummary: `Tanteo de ${winningTeamJuego === 0 ? 'Equipo Jugador' : 'Rivales'}: ${tanteoBonus} piedras (${winningTeamJuego === 0 ? `${players[0].name}: ${j0.bonus}, ${players[2].name}: ${j2.bonus}` : `${players[1].name}: ${j1.bonus}, ${players[3].name}: ${j3.bonus}`})`,
      pointsAwarded: totalPtsJuego,
      explanation: `Gana el lance ${players[winningPlayerIdxJuego].name} (${winningTeamJuego === 0 ? 'Equipo Jugador' : 'Rivales'}) con ${totalPtsJuego} piedra${totalPtsJuego > 1 ? 's' : ''} (${tanteoBonus} de tanteo${betPts > 0 ? ` + ${betPts} de apuesta` : ''}).`,
    });
  } else {
    // PUNTO
    const betPunto = lanceBets.punto;
    const descPunto0 = `${players[0].name}: ${j0.sum} de punto | ${players[2].name}: ${j2.sum} de punto`;
    const descPunto1 = `${players[1].name}: ${j1.sum} de punto | ${players[3].name}: ${j3.sum} de punto`;

    let winningTeamPunto: 0 | 1;
    let winningPlayerIdxPunto: number;

    if (betPunto.rejected && betPunto.lastBettorTeam !== null) {
      winningTeamPunto = betPunto.lastBettorTeam === 0 ? 0 : 1;
      winningPlayerIdxPunto = winningTeamPunto === 0 ? 0 : 1;
    } else {
      const resPt = getWinningTeamForLance('punto', players, manoIndex);
      winningTeamPunto = resPt.winningTeam;
      winningPlayerIdxPunto = resPt.winningPlayerIndex;
    }

    let ptsPunto = 0;
    let betSummary = 'Pasa en blanco (1 piedra de ley)';

    if (betPunto.rejected) {
      betSummary = 'Retirada previa (ya cobrada en mesa)';
      ptsPunto = 0;
    } else if (betPunto.accepted) {
      ptsPunto = betPunto.currentBet + 1; // Envite + 1 de punto
      betSummary = `Envite aceptado de ${betPunto.currentBet} piedras + 1 de punto`;
    } else {
      ptsPunto = 1;
    }

    if (ptsPunto > 0) {
      if (winningTeamPunto === 0) totalTeam0 += ptsPunto;
      else totalTeam1 += ptsPunto;
    }

    steps.push({
      lanceKey: 'punto',
      lanceTitle: 'AL PUNTO',
      icon: '🎲',
      winningTeam: winningTeamPunto,
      winningPlayerIndex: winningPlayerIdxPunto,
      winnerName: players[winningPlayerIdxPunto].name,
      cardsDescriptionTeam0: descPunto0,
      cardsDescriptionTeam1: descPunto1,
      betType: betPunto.accepted ? 'aceptada' : 'en_blanco',
      betSummary,
      pointsAwarded: ptsPunto,
      explanation:
        ptsPunto > 0
          ? `Gana ${players[winningPlayerIdxPunto].name} (${winningTeamPunto === 0 ? 'Equipo Jugador' : 'Rivales'}) por mejor punto (${players[winningPlayerIdxPunto].cards.map((c) => getMusRank(c.number)).join('+')}) sumando ${ptsPunto} piedra${ptsPunto > 1 ? 's' : ''}.`
          : `Lance resuelto previamente por retirada de un equipo.`,
    });
  }

  return {
    steps,
    totalTeam0,
    totalTeam1,
  };
}
