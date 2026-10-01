// userProfileEngine.ts - Control de Usuarios y Motor de Aprendizaje de Estilo de Juego para la IA

export interface LanceStats {
  bets: number;    // Veces que envidó o subió
  checks: number;  // Veces que pasó
}

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
  lances: {
    grande: { bets: 0, checks: 0 },
    chica: { bets: 0, checks: 0 },
    pares: { bets: 0, checks: 0 },
    juego: { bets: 0, checks: 0 },
    punto: { bets: 0, checks: 0 },
  },
});

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
          .map((p: UserProfile) => ({ ...p, playstyle: { ...defaultPlaystyle(), ...(p.playstyle || {}) } }));
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

  public save(): void {
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
    action: 'mus' | 'no_mus' | 'paso' | 'envido' | 'mas' | 'ordago' | 'quiero' | 'no_quiero',
    lance?: 'grande' | 'chica' | 'pares' | 'juego' | 'punto',
    handStrength: number = 5.0, // 0..10
    isRivalOrdago: boolean = false
  ): void {
    const user = this.getActiveUser();
    const ps = user.playstyle;
    ps.totalActions++;

    if (action === 'mus') ps.musCount++;
    if (action === 'no_mus') ps.noMusCount++;
    if (action === 'paso') ps.pasoCount++;
    if (action === 'envido') ps.envidoCount++;
    if (action === 'mas') ps.masCount++;
    if (action === 'ordago') ps.ordagoCount++;

    if (isRivalOrdago) {
      ps.ordagoFaced++;
      if (action === 'quiero') ps.ordagoAccepted++;
      if (action === 'no_quiero') ps.ordagoRefused++;
    }

    // Análisis de Farol vs Valor
    const isAggressiveBet = action === 'envido' || action === 'mas' || action === 'ordago';
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
    const ps = user.playstyle;
    const totalBettingOpportunities = ps.pasoCount + ps.envidoCount + ps.masCount + ps.ordagoCount;

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
    };
  }
}

export const userProfileEngine = new UserProfileEngine();
