// userProfileEngine.ts - Control de Usuarios y Motor de Aprendizaje de Estilo de Juego para la IA
// With login, the active profile belongs to the logged-in account and is stored on the server.
import { authService } from './auth/authService';

export interface LanceStats {
  bets: number;    // Veces que envidó o subió
  checks: number;  // Veces que pasó
  bluffs?: number; // Apuestas con mano débil en este lance
  values?: number; // Apuestas con mano fuerte en este lance
}

export type LanceName = 'grande' | 'chica' | 'pares' | 'juego' | 'punto';

export interface UserPlaystyle {
  totalActions: number;
  musCount: number;         // Veces que pidió mus
  noMusCount: number;       // Veces que cortó el mus
  pasoCount: number;        // Veces que pasó
  envidoCount: number;      // Veces que envidó
  masCount: number;         // Veces que re-envidó ("dos más")
  ordagoCount: number;      // Veces que lanzó órdago
  ordagoFaced: number;      // Veces que un rival le lanzó órdago
  ordagoAccepted: number;   // Veces que aceptó un órdago
  ordagoRefused: number;    // Veces que rechazó un órdago
  bluffBets: number;        // Apuestas realizadas con mano débil (< 5.0 de fuerza)
  valueBets: number;        // Apuestas con mano fuerte (>= 6.0)
  quieroCount?: number;     // Envites (no órdago) aceptados
  noQuieroCount?: number;   // Envites (no órdago) rechazados
  weakFolds?: number;       // Se retiró con mano débil (correcto)
  strongFolds?: number;     // Se retiró con mano buena (se le puede robar)
  lances: {
    grande: LanceStats;
    chica: LanceStats;
    pares: LanceStats;
    juego: LanceStats;
    punto: LanceStats;
  };
}

export interface UserProfile {
  id: string;
  name: string;
  avatarId: string;
  createdAt: number;
  handsPlayed: number;
  matchesWon: number;
  matchesLost: number;
  piedrasWon: number;
  playstyle: UserPlaystyle;
}

export type PlayerArchetype = 
  | 'Amarrategui (Muy Conservador)'
  | 'Prudente Calculador'
  | 'Equilibrado Clásico'
  | 'Agresivo Dominante'
  | 'Farolero Temerario';

export interface TacticalAnalysis {
  aggressiveness: number;     // 0 - 100
  riskTolerance: number;      // 0 - 100
  bluffRate: number;          // 0 - 100
  musTendency: number;        // 0 - 100 (100 = siempre pide mus, 0 = siempre corta)
  archetype: PlayerArchetype;
  description: string;
  aiCounterStrategy: {
    title: string;
    description: string;
    callThresholdShift: number;   // Negativo = paga más fácil (caza faroles), positivo = más selectivo
    raiseTendencyShift: number;   // Ajuste en ganas de subir
    bluffRespectShift: number;    // Si el usuario no farolea nunca, respeta sus apuestas
    trapTendency: number;         // Probabilidad de slow-play / tender trampa
  };
  // Learned per lance: how often the user bluffs there (0-100), null = not enough data
  lanceBluffRate: Record<LanceName, number | null>;
  // How often the user gives up when somebody bets (0-100), null = not enough data
  foldRate: number | null;
}

const STORAGE_PROFILES_KEY = 'pcmus_user_profiles_v1';
const STORAGE_ACTIVE_ID_KEY = 'pcmus_active_user_id_v1';

const defaultPlaystyle = (): UserPlaystyle => ({
  totalActions: 0,
  musCount: 0,
  noMusCount: 0,
  pasoCount: 0,
  envidoCount: 0,
  masCount: 0,
  ordagoCount: 0,
  ordagoFaced: 0,
  ordagoAccepted: 0,
  ordagoRefused: 0,
  bluffBets: 0,
  valueBets: 0,
  quieroCount: 0,
  noQuieroCount: 0,
  weakFolds: 0,
  strongFolds: 0,
  lances: {
    grande: { bets: 0, checks: 0, bluffs: 0, values: 0 },
    chica: { bets: 0, checks: 0, bluffs: 0, values: 0 },
    pares: { bets: 0, checks: 0, bluffs: 0, values: 0 },
    juego: { bets: 0, checks: 0, bluffs: 0, values: 0 },
    punto: { bets: 0, checks: 0, bluffs: 0, values: 0 },
  },
});

// Older saved data may miss fields: complete everything (also the nested lances)
const normalizePlaystyle = (ps: Partial<UserPlaystyle> | undefined): UserPlaystyle => {
  const base = defaultPlaystyle();
  const merged: UserPlaystyle = { ...base, ...(ps || {}), lances: { ...base.lances } };
  (Object.keys(base.lances) as LanceName[]).forEach((l) => {
    merged.lances[l] = { ...base.lances[l], ...((ps?.lances as any)?.[l] || {}) };
  });
  return merged;
};

export const DEFAULT_PROFILES: UserProfile[] = [
  {
    id: 'user_default',
    name: 'Jugador 1',
    avatarId: 'tio_gil',
    createdAt: Date.now(),
    handsPlayed: 0,
    matchesWon: 0,
    matchesLost: 0,
    piedrasWon: 0,
    playstyle: defaultPlaystyle(),
  },
];

class UserProfileEngine {
  private profiles: UserProfile[] = [];
  private activeUserId: string = 'user_default';
  private listeners: Array<() => void> = [];

  constructor() {
    this.load();
  }

  private load(): void {
    try {
      const storedProfiles = localStorage.getItem(STORAGE_PROFILES_KEY);
      if (storedProfiles) {
        const parsed = JSON.parse(storedProfiles);
        this.profiles = (Array.isArray(parsed) ? parsed : [])
          .filter((p: Partial<UserProfile>) => p && typeof p.id === 'string')
          .map((p: UserProfile) => ({ ...p, playstyle: normalizePlaystyle(p.playstyle) }));
        if (this.profiles.length === 0) this.profiles = [...DEFAULT_PROFILES];
      } else {
        this.profiles = [...DEFAULT_PROFILES];
        this.save();
      }

      const activeId = localStorage.getItem(STORAGE_ACTIVE_ID_KEY);
      if (activeId && this.profiles.some((p) => p.id === activeId)) {
        this.activeUserId = activeId;
      } else if (this.profiles.length > 0) {
        this.activeUserId = this.profiles[0].id;
      }
    } catch {
      this.profiles = [...DEFAULT_PROFILES];
      this.activeUserId = this.profiles[0].id;
    }
  }

  // ───────── logged-in account ─────────
  private serverUserId: string | null = null;
  private serverSaveTimer: number | undefined;

  // Use the logged-in user's profile (loaded from the server) as the only active profile
  public attachServerUser(user: { id: string; displayName: string; avatarId: string; createdAt: number }, data: any) {
    const stored = data && typeof data === 'object' ? data : {};
    const profile: UserProfile = {
      id: user.id,
      name: user.displayName,
      avatarId: user.avatarId,
      createdAt: user.createdAt,
      handsPlayed: Number(stored.handsPlayed) || 0,
      matchesWon: Number(stored.matchesWon) || 0,
      matchesLost: Number(stored.matchesLost) || 0,
      piedrasWon: Number(stored.piedrasWon) || 0,
      playstyle: normalizePlaystyle(stored.playstyle),
    };
    this.serverUserId = user.id;
    this.profiles = [profile];
    this.activeUserId = user.id;
    this.notifyListeners();
  }

  public detachServerUser() {
    if (this.serverSaveTimer) window.clearTimeout(this.serverSaveTimer);
    this.serverUserId = null;
    this.profiles = [...DEFAULT_PROFILES];
    this.activeUserId = DEFAULT_PROFILES[0].id;
    this.notifyListeners();
  }

  private pushToServer() {
    if (this.serverSaveTimer) window.clearTimeout(this.serverSaveTimer);
    this.serverSaveTimer = window.setTimeout(() => {
      const u = this.getActiveUser();
      if (!this.serverUserId || u.id !== this.serverUserId) return;
      authService
        .saveProfile({
          handsPlayed: u.handsPlayed,
          matchesWon: u.matchesWon,
          matchesLost: u.matchesLost,
          piedrasWon: u.piedrasWon,
          playstyle: u.playstyle,
        })
        .catch(() => {
          /* will be sent again with the next change */
        });
    }, 1500);
  }

  public save(): void {
    if (this.serverUserId) {
      this.notifyListeners();
      this.pushToServer();
      return;
    }
    try {
      localStorage.setItem(STORAGE_PROFILES_KEY, JSON.stringify(this.profiles));
      localStorage.setItem(STORAGE_ACTIVE_ID_KEY, this.activeUserId);
      this.notifyListeners();
    } catch (e) {
      console.warn('Error saving user profiles:', e);
    }
  }

  public subscribe(listener: () => void): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  private notifyListeners(): void {
    this.listeners.forEach((l) => l());
  }

  public getProfiles(): UserProfile[] {
    return [...this.profiles];
  }

  public getActiveUser(): UserProfile {
    const found = this.profiles.find((p) => p.id === this.activeUserId);
    if (found) return found;
    return this.profiles[0] || DEFAULT_PROFILES[0];
  }

  public setActiveUser(userId: string): void {
    if (this.profiles.some((p) => p.id === userId)) {
      this.activeUserId = userId;
      this.save();
    }
  }

  public createUser(name: string, avatarId: string = 'tio_gil'): UserProfile {
    const trimmed = name.trim() || `Jugador ${this.profiles.length + 1}`;
    const newProfile: UserProfile = {
      id: `usr_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      name: trimmed,
      avatarId,
      createdAt: Date.now(),
      handsPlayed: 0,
      matchesWon: 0,
      matchesLost: 0,
      piedrasWon: 0,
      playstyle: defaultPlaystyle(),
    };
    this.profiles.push(newProfile);
    this.activeUserId = newProfile.id;
    this.save();
    return newProfile;
  }

  public updateUser(userId: string, partial: Partial<Omit<UserProfile, 'id' | 'playstyle'>>): void {
    const idx = this.profiles.findIndex((p) => p.id === userId);
    if (idx !== -1) {
      this.profiles[idx] = { ...this.profiles[idx], ...partial };
      this.save();
    }
  }

  public deleteUser(userId: string): boolean {
    if (this.profiles.length <= 1) return false; // Prevent deleting the last profile
    this.profiles = this.profiles.filter((p) => p.id !== userId);
    if (this.activeUserId === userId) {
      this.activeUserId = this.profiles[0].id;
    }
    this.save();
    return true;
  }

  public resetUserStats(userId: string): void {
    const idx = this.profiles.findIndex((p) => p.id === userId);
    if (idx !== -1) {
      this.profiles[idx].handsPlayed = 0;
      this.profiles[idx].matchesWon = 0;
      this.profiles[idx].matchesLost = 0;
      this.profiles[idx].piedrasWon = 0;
      this.profiles[idx].playstyle = defaultPlaystyle();
      this.save();
    }
  }

  /**
   * Registra una acción del usuario para que el motor de IA aprenda de su patrón
   */
  public recordAction(
    action: 'mus' | 'no_mus' | 'paso' | 'envido' | 'mas' | 'ordago' | 'quiero' | 'no_quiero' | string,
    lance?: 'grande' | 'chica' | 'pares' | 'juego' | 'punto',
    handStrength: number = 5.0, // 0..10
    isRivalOrdago: boolean = false
  ): void {
    const user = this.getActiveUser();
    const ps = user.playstyle;
    ps.totalActions++;

    const baseAction = typeof action === 'string' && action.startsWith('envido')
      ? 'envido'
      : typeof action === 'string' && action.startsWith('mas')
      ? 'mas'
      : action;

    if (baseAction === 'mus') ps.musCount++;
    if (baseAction === 'no_mus') ps.noMusCount++;
    if (baseAction === 'paso') ps.pasoCount++;
    if (baseAction === 'envido') ps.envidoCount++;
    if (baseAction === 'mas') ps.masCount++;
    if (baseAction === 'ordago') ps.ordagoCount++;

    if (isRivalOrdago) {
      ps.ordagoFaced++;
      if (baseAction === 'quiero') ps.ordagoAccepted++;
      if (baseAction === 'no_quiero') ps.ordagoRefused++;
    } else if (baseAction === 'quiero') {
      ps.quieroCount = (ps.quieroCount || 0) + 1;
    } else if (baseAction === 'no_quiero') {
      ps.noQuieroCount = (ps.noQuieroCount || 0) + 1;
      if (handStrength >= 5.5) ps.strongFolds = (ps.strongFolds || 0) + 1;
      else ps.weakFolds = (ps.weakFolds || 0) + 1;
    }

    // Análisis de Farol vs Valor
    const isAggressiveBet = baseAction === 'envido' || baseAction === 'mas' || baseAction === 'ordago';
    if (isAggressiveBet) {
      if (handStrength < 5.0) {
        ps.bluffBets++;
      } else if (handStrength >= 6.0) {
        ps.valueBets++;
      }
    }

    // Tendencia por lances
    if (lance && ps.lances[lance]) {
      if (isAggressiveBet) {
        ps.lances[lance].bets++;
        if (handStrength < 5.0) ps.lances[lance].bluffs = (ps.lances[lance].bluffs || 0) + 1;
        else if (handStrength >= 6.0) ps.lances[lance].values = (ps.lances[lance].values || 0) + 1;
      } else if (action === 'paso') {
        ps.lances[lance].checks++;
      }
    }

    this.save();
  }

  public recordHandFinished(wonPoints: number = 0): void {
    const user = this.getActiveUser();
    user.handsPlayed++;
    if (wonPoints > 0) user.piedrasWon += wonPoints;
    this.save();
  }

  public recordMatchFinished(won: boolean): void {
    const user = this.getActiveUser();
    if (won) {
      user.matchesWon++;
    } else {
      user.matchesLost++;
    }
    this.save();
  }

  /**
   * Realiza un diagnóstico táctico del estilo de juego del usuario actual
   * y calcula cómo debe adaptarse la IA para ganarle.
   */
  public analyzeUser(user: UserProfile = this.getActiveUser()): TacticalAnalysis {
    const ps = normalizePlaystyle(user.playstyle);
    const totalBettingOpportunities = ps.pasoCount + ps.envidoCount + ps.masCount + ps.ordagoCount;
    // Per-lance bluffing and folding, learned from at least a few decisions
    const lanceBluffRate = {} as Record<LanceName, number | null>;
    (Object.keys(ps.lances) as LanceName[]).forEach((l) => {
      const st = ps.lances[l];
      const judged = (st.bluffs || 0) + (st.values || 0);
      lanceBluffRate[l] = judged >= 3 ? Math.round(((st.bluffs || 0) / judged) * 100) : null;
    });
    const answers = (ps.quieroCount || 0) + (ps.noQuieroCount || 0);
    const foldRate = answers >= 4 ? Math.round(((ps.noQuieroCount || 0) / answers) * 100) : null;

    // Si aún no hay suficientes datos (primeras manos), usamos un perfil equilibrado con aprendizaje inicial
    if (totalBettingOpportunities < 4) {
      return {
        aggressiveness: 50,
        riskTolerance: 50,
        bluffRate: 20,
        musTendency: 60,
        archetype: 'Equilibrado Clásico',
        description: 'Fase de observación inicial: La máquina está estudiando tus primeros movimientos para aprender tu estilo.',
        aiCounterStrategy: {
          title: 'Estilo Exploratorio y Cauteloso',
          description: 'La máquina evalúa tus probabilidades de farol y tu respuesta a los primeros envites.',
          callThresholdShift: 0,
          raiseTendencyShift: 0,
          bluffRespectShift: 0,
          trapTendency: 0.2,
        },
        lanceBluffRate,
        foldRate,
      };
    }

    // 1. Agresividad: (Envidos + 1.5*Más + 2.5*Órdagos) / Oportunidades
    const aggressivePoints = ps.envidoCount + ps.masCount * 1.5 + ps.ordagoCount * 2.5;
    const rawAggressiveness = Math.min(100, Math.max(5, Math.round((aggressivePoints / totalBettingOpportunities) * 100)));

    // 2. Nivel de Riesgo (Audacia / Kamikaze)
    const ordagoAcceptRate = ps.ordagoFaced > 0 ? (ps.ordagoAccepted / ps.ordagoFaced) * 100 : 40;
    const musCutRate = (ps.musCount + ps.noMusCount) > 0 ? (ps.noMusCount / (ps.musCount + ps.noMusCount)) * 100 : 30;
    const rawRisk = Math.min(100, Math.max(5, Math.round(rawAggressiveness * 0.4 + ordagoAcceptRate * 0.4 + musCutRate * 0.2)));

    // 3. Tasa de Farol
    const totalBets = ps.bluffBets + ps.valueBets;
    const rawBluff = totalBets > 0 ? Math.min(100, Math.round((ps.bluffBets / totalBets) * 100)) : 20;

    // 4. Tendencia al Mus
    const totalMusActions = ps.musCount + ps.noMusCount;
    const rawMus = totalMusActions > 0 ? Math.round((ps.musCount / totalMusActions) * 100) : 65;

    // 5. Arquetipo
    let archetype: PlayerArchetype = 'Equilibrado Clásico';
    let description = '';
    let aiTitle = '';
    let aiDesc = '';
    let callThresholdShift = 0;
    let raiseTendencyShift = 0;
    let bluffRespectShift = 0;
    let trapTendency = 0.25;

    if (rawAggressiveness >= 65 && rawBluff >= 35) {
      archetype = 'Farolero Temerario';
      description = `Apuestas frecuentemente con cartas débiles e intentas amedrentar a los rivales a base de envites.`;
      aiTitle = 'Estrategia Cazafaroles y Contraenvite';
      aiDesc = 'La IA ha detectado tus faroles: pagará tus envites con manos medias (fuerza 4+) y te castigará con "dos más" para hacerte pagar.';
      callThresholdShift = -2.5; // Paga más fácil para atrapar faroles
      raiseTendencyShift = 0.35;
      bluffRespectShift = -0.4;  // No respeta los envites del usuario
      trapTendency = 0.45;       // Hace slow-play para atraparle
    } else if (rawAggressiveness >= 60) {
      archetype = 'Agresivo Dominante';
      description = `Tomas la iniciativa en la mesa, cortas el mus a menudo y buscas cerrar los lances rápido.`;
      aiTitle = 'Emboscadas con Manas Fuertes';
      aiDesc = 'La IA te dejará hablar primero cuando tenga buenas cartas para meterte órdagos y contras definitivas.';
      callThresholdShift = -1.5;
      raiseTendencyShift = 0.2;
      bluffRespectShift = -0.1;
      trapTendency = 0.5;
    } else if (rawAggressiveness <= 30 && rawRisk <= 35) {
      archetype = 'Amarrategui (Muy Conservador)';
      description = `Juegas sólo con cartas seguras (reyes, 31 o duples). Pasas en la mayoría de manos y pides mus constantemente.`;
      aiTitle = 'Robo Sistemático de Tantos y Respeto a Tus Envites';
      aiDesc = 'La IA sabe que cuando apuestas llevas cartas muy altas: se tirará si envidas, pero te robará las manos pasando tú mediante envites calculados.';
      callThresholdShift = 2.0;  // Se tira si el amarrategui envida (sabe que no va de farol)
      raiseTendencyShift = 0.4;  // Roba cuando el amarrategui pasa
      bluffRespectShift = 0.5;   // Respeta totalmente las apuestas
      trapTendency = 0.1;
    } else if (rawRisk <= 40) {
      archetype = 'Prudente Calculador';
      description = `Prefieres asegurar piedras y minimizar riesgos, declinando órdagos a menos que tengas jugada invencible.`;
      aiTitle = 'Presión con Órdagos Tácticos';
      aiDesc = 'La IA usará órdagos calculados para forzarte a tirar las cartas y llevarse las piedras de tanteo.';
      callThresholdShift = 0.5;
      raiseTendencyShift = 0.25;
      bluffRespectShift = 0.2;
      trapTendency = 0.25;
    } else {
      archetype = 'Equilibrado Clásico';
      description = `Varías entre prudencia y ataque. Juego estándar con alternancia de faroles y manos de valor.`;
      aiTitle = 'Juego Adaptativo Equilibrado';
      aiDesc = 'La IA juega con lectura precisa de probabilidades y lectura de pares/juego según descartes.';
      callThresholdShift = 0;
      raiseTendencyShift = 0;
      bluffRespectShift = 0;
      trapTendency = 0.25;
    }

    return {
      aggressiveness: rawAggressiveness,
      riskTolerance: rawRisk,
      bluffRate: rawBluff,
      musTendency: rawMus,
      archetype,
      description,
      aiCounterStrategy: {
        title: aiTitle,
        description: aiDesc,
        callThresholdShift,
        raiseTendencyShift,
        bluffRespectShift,
        trapTendency,
      },
      lanceBluffRate,
      foldRate,
    };
  }
}

export const userProfileEngine = new UserProfileEngine();
