// Web Speech Synthesis engine with tailored Spanish vocal acting for PC Mus 1996 characters

export interface CharacterVoiceProfile {
  id: string;
  name: string;
  pitch: number;
  rate: number;
  volume: number;
  lang: string;
  voiceGender: 'male' | 'female';
  acousticToneFreq?: number;
  signaturePhrases: string[];
}

export const CHARACTER_VOICE_PROFILES: Record<string, CharacterVoiceProfile> = {
  camarero_navarra: {
    id: 'camarero_navarra',
    name: 'El Camarero de Navarra',
    pitch: 0.82,
    rate: 1.08,
    volume: 1.0,
    lang: 'es-ES',
    voiceGender: 'male',
    acousticToneFreq: 140, // Hearty tavern baritone
    signaturePhrases: [
      '¡Aquí está Patxi, el camarero de Navarra! ¡Vino tinto y órdago!',
      '¡¡Mecagüen diez!! ¡Aquí no hay mus que valga!',
      '¡¡ÓRDAGO la grande, por San Fermín y toda Navarra!!',
      '¡Aúpa! ¡Ronda de clarete navarro para la peña!',
      '¡Quiero y veo lo que traes en esos naipes!'
    ]
  },
  don_julian: {
    id: 'don_julian',
    name: 'Don Julián',
    pitch: 0.74,
    rate: 0.88,
    volume: 1.0,
    lang: 'es-ES',
    voiceGender: 'male',
    acousticToneFreq: 120, // Low rustic elder resonance
    signaturePhrases: [
      'Buenas noches. Don Julián a su servicio... con pan y vino se anda el camino.',
      '¡Corto el mus! Que de noche todos los números cantan solos.',
      '¡¡Órdago a la grande con todas las de la ley!!',
      '¡Quiero ver esos números, mozo!',
      '¡Para nosotros las piedras! ¡Patxi, saca más pan de pueblo!'
    ]
  },
  tio_gil: {
    id: 'tio_gil',
    name: 'Tío Gil',
    pitch: 0.65,
    rate: 0.90,
    volume: 1.0,
    lang: 'es-ES',
    voiceGender: 'male',
    acousticToneFreq: 105, // Deep gruff bass
    signaturePhrases: [
      '¡Y yo soy el tío Gil y tal y tal!',
      '¡Aquí no hay mus que valga, y tal y tal!',
      '¡¡Órdago a la grande!! ¡A la piscina todos!',
      '¡Quiero! ¡A mí no me achanta nadie!',
      '¡Esto lo celebro en Puerto Banús y tal y tal!'
    ]
  },
  el_marques: {
    id: 'el_marques',
    name: 'El Marqués',
    pitch: 1.02,
    rate: 0.86,
    volume: 0.92,
    lang: 'es-ES',
    voiceGender: 'male',
    acousticToneFreq: 220, // Clear aristocratic tenor
    signaturePhrases: [
      'Yo soy el Marqués... y tengo muy mal perder.',
      'La prudencia financiera aconseja mus.',
      'Envido con solvencia contrastada.',
      '¡Órdago absoluto! OPA hostil a la mesa.',
      'La banca siempre gana, caballeros.'
    ]
  },
  el_isidoro: {
    id: 'el_isidoro',
    name: 'El Isidoro',
    pitch: 0.78,
    rate: 0.84,
    volume: 0.95,
    lang: 'es-ES',
    voiceGender: 'male',
    acousticToneFreq: 130, // Raspy thoughtful baritone
    signaturePhrases: [
      'Por consiguiente... pidamos mus.',
      'España no puede esperar más: ¡se juega!',
      'Dos más por responsabilidad histórica.',
      '¡Por consiguiente: ÓRDAGO!',
      'Hemos ganado por abrumadora mayoría.'
    ]
  },
  tio_mateo: {
    id: 'tio_mateo',
    name: 'Tío Mateo',
    pitch: 1.34,
    rate: 1.26,
    volume: 1.0,
    lang: 'es-ES',
    voiceGender: 'male',
    acousticToneFreq: 260, // Shrill frantic comic tone
    signaturePhrases: [
      '¡¡QUE TE PEGO, LECHE!! ¡¡QUE TE PEGO!!',
      '¡Mus para mis abejitas obreras!',
      '¡¡Órdago de Supermán!! ¡¡A pecho descubierto!!',
      '¡¡Quiero!! ¡A mí no me amedrenta nadie!',
      '¡¡Victoria de Rumasa y de la verdad!!'
    ]
  },
  dona_norma: {
    id: 'dona_norma',
    name: 'Doña Norma',
    pitch: 1.38,
    rate: 1.02,
    volume: 0.98,
    lang: 'es-ES',
    voiceGender: 'female',
    acousticToneFreq: 330, // Melodic cabaret soprano
    signaturePhrases: [
      '¡Soy Norma, poco cerebro y siempre en forma, cariño!',
      '¡Se abre el telón! ¡No hay mus, bombones!',
      '¡Envido con mucho glamour y brillantes!',
      '¡¡ÓRDAGO de vedette!! ¡Arriba las plumas!',
      '¡Beso, aplausos y flores para la ganadora!'
    ]
  },
  senorita_rosa: {
    id: 'senorita_rosa',
    name: 'Señorita Rosa',
    pitch: 1.18,
    rate: 1.12,
    volume: 0.95,
    lang: 'es-ES',
    voiceGender: 'female',
    acousticToneFreq: 290,
    signaturePhrases: [
      '¡Yo soy Rosita, la más lista y la más bonita!',
      '¡No hay mus! ¡Que empiece la movida!',
      '¡Envido con todo mi arte y mi perfil picassiano!',
      '¡¡ÓRDAGO de diseño!! ¡A morir en la pasarela!',
      '¡Esto es arte moderno, señores!'
    ]
  },
  cabo_don_luis: {
    id: 'cabo_don_luis',
    name: 'Cabo Don Luis',
    pitch: 0.96,
    rate: 1.16,
    volume: 0.95,
    lang: 'es-ES',
    voiceGender: 'male',
    acousticToneFreq: 160,
    signaturePhrases: [
      '¡Yo soy el cabo Don Luis, jo***!',
      '¡No hay mus, jo***! ¡A pecho descubierto!',
      '¡Envido dos piedras de los fondos reservados!',
      '¡¡ÓRDAGO con la maleta entera!!',
      '¡¡Ganamos, jo***!! ¡A brindar con champán!'
    ]
  },
  chiquito: {
    id: 'chiquito',
    name: 'Chiquito de la Calzada',
    pitch: 1.54,
    rate: 1.20,
    volume: 1.0,
    lang: 'es-ES',
    voiceGender: 'male',
    acousticToneFreq: 310, // Staccato flamenco
    signaturePhrases: [
      '¡¡A can de mor! ¡Fistro pecador de la pradera!',
      '¡¡Al ataquer!! ¡¿Cómo te da cuen?!',
      '¡¡No puedor, no puedor!!',
      '¡Por la gloria de mi madre, menudoo órdago cobarde!',
      '¡Sabes más de mus que la Gemio del fisto sexual!'
    ]
  },
  karlos: {
    id: 'karlos',
    name: 'Karlos Arguiñano',
    pitch: 0.96,
    rate: 1.06,
    volume: 0.98,
    lang: 'es-ES',
    voiceGender: 'male',
    acousticToneFreq: 175,
    signaturePhrases: [
      '¡Rico, rico y con fundamento!',
      '¡Menudo órdago con una ramita de perejil fresco!',
      '¡Plato limpio y cinco amarracos al saco!',
      '¡Otro chato de vino y a ganar la partida!'
    ]
  }
};

class VoiceEngineController {
  public enabled: boolean = true;
  public volume: number = 0.95;
  private maleVoices: SpeechSynthesisVoice[] = [];
  private femaleVoices: SpeechSynthesisVoice[] = [];
  private spanishVoices: SpeechSynthesisVoice[] = [];
  private currentSpeakerId: string | null = null;
  private onSpeakingChangeCallbacks: Set<(isSpeaking: boolean, charId: string | null) => void> = new Set();
  private audioCtx: AudioContext | null = null;

  constructor() {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      this.initVoices();
      if (window.speechSynthesis.onvoiceschanged !== undefined) {
        window.speechSynthesis.onvoiceschanged = () => this.initVoices();
      }
    }
  }

  private initVoices() {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    const voices = window.speechSynthesis.getVoices();
    this.spanishVoices = voices.filter(
      (v) => v.lang.toLowerCase().startsWith('es') || v.lang.toLowerCase().includes('spanish')
    );

    // Filter female vs male by common system voice identifiers
    const femaleKeywords = ['monica', 'mónica', 'helena', 'elena', 'laura', 'paulina', 'lucia', 'lucía', 'conchita', 'paloma', 'carmen', 'rosa', 'female', 'sabina', 'sofia'];
    
    this.femaleVoices = this.spanishVoices.filter((v) =>
      femaleKeywords.some((k) => v.name.toLowerCase().includes(k))
    );
    this.maleVoices = this.spanishVoices.filter(
      (v) => !femaleKeywords.some((k) => v.name.toLowerCase().includes(k))
    );

    if (this.spanishVoices.length === 0 && voices.length > 0) {
      this.spanishVoices = voices;
      this.maleVoices = voices;
    }
  }

  // Play retro character acoustic tone using Web Audio API
  private playCharacterStinger(freq: number = 180, charId: string) {
    if (!this.enabled || typeof window === 'undefined') return;
    try {
      if (!this.audioCtx) {
        const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
        if (AudioContextClass) this.audioCtx = new AudioContextClass();
      }
      if (this.audioCtx && this.audioCtx.state === 'suspended') {
        this.audioCtx.resume();
      }
      if (!this.audioCtx) return;

      const now = this.audioCtx.currentTime;
      const osc = this.audioCtx.createOscillator();
      const gain = this.audioCtx.createGain();

      // Custom timbre depending on character
      if (charId === 'tio_mateo' || charId === 'chiquito') {
        osc.type = 'sawtooth';
      } else if (charId === 'dona_norma' || charId === 'el_marques') {
        osc.type = 'sine';
      } else {
        osc.type = 'triangle';
      }

      osc.frequency.setValueAtTime(freq, now);
      if (charId === 'tio_mateo') {
        osc.frequency.exponentialRampToValueAtTime(freq * 1.5, now + 0.12);
      } else if (charId === 'chiquito') {
        osc.frequency.setValueAtTime(freq * 1.3, now);
        osc.frequency.exponentialRampToValueAtTime(freq * 0.9, now + 0.15);
      } else if (charId === 'camarero_navarra') {
        // Robust two-tone tavern bell
        osc.frequency.setValueAtTime(freq, now);
        osc.frequency.setValueAtTime(freq * 1.25, now + 0.08);
      }

      gain.gain.setValueAtTime(0.08 * this.volume, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);

      osc.connect(gain);
      gain.connect(this.audioCtx.destination);

      osc.start(now);
      osc.stop(now + 0.2);
    } catch {
      // AudioContext failure gracefully ignored
    }
  }

  public registerSpeakingListener(callback: (isSpeaking: boolean, charId: string | null) => void) {
    this.onSpeakingChangeCallbacks.add(callback);
    return () => {
      this.onSpeakingChangeCallbacks.delete(callback);
    };
  }

  private notifySpeaking(isSpeaking: boolean, charId: string | null) {
    this.currentSpeakerId = isSpeaking ? charId : null;
    this.onSpeakingChangeCallbacks.forEach((cb) => cb(isSpeaking, charId));
  }

  // Preprocess text with character inflections and rhythm
  private formatTextForCharacter(charId: string, text: string): string {
    let clean = text
      .replace(/\*[^*]+\*/g, '')
      .replace(/[\u{1F300}-\u{1F9FF}]/gu, '')
      .trim();

    if (charId === 'tio_gil') {
      if (!clean.includes('tal y tal') && Math.random() > 0.4) {
        clean = `${clean}... ¡y tal y tal!`;
      }
    } else if (charId === 'camarero_navarra') {
      if (!clean.startsWith('¡Aúpa') && !clean.startsWith('¡¡')) {
        clean = `¡Aúpa! ${clean}`;
      }
    } else if (charId === 'don_julian') {
      if (!clean.includes('pan') && !clean.includes('números') && Math.random() > 0.45) {
        clean = `${clean}... ¡con pan y vino se anda el camino!`;
      }
    } else if (charId === 'el_isidoro') {
      if (!clean.includes('consiguiente') && Math.random() > 0.5) {
        clean = `Por consiguiente... ${clean}`;
      }
    } else if (charId === 'tio_mateo') {
      clean = clean.toUpperCase();
    }

    return clean;
  }

  public speakCharacter(characterId: string, text: string) {
    if (!this.enabled || typeof window === 'undefined' || !('speechSynthesis' in window)) {
      return;
    }

    try {
      window.speechSynthesis.cancel();

      const profile = CHARACTER_VOICE_PROFILES[characterId] || {
        id: characterId,
        name: characterId,
        pitch: 1.0,
        rate: 1.0,
        volume: 0.95,
        lang: 'es-ES',
        voiceGender: 'male',
        acousticToneFreq: 180,
        signaturePhrases: []
      };

      const speechText = this.formatTextForCharacter(characterId, text);
      if (!speechText) return;

      // Play acoustic intro stinger for character
      this.playCharacterStinger(profile.acousticToneFreq || 180, characterId);

      const utterance = new SpeechSynthesisUtterance(speechText);

      // Select matching voice
      if (this.spanishVoices.length === 0) {
        this.initVoices();
      }

      let voice: SpeechSynthesisVoice | undefined;
      if (profile.voiceGender === 'female' && this.femaleVoices.length > 0) {
        voice = this.femaleVoices[0];
      } else if (profile.voiceGender === 'male' && this.maleVoices.length > 0) {
        // Pick among male voices if multiple available
        voice = this.maleVoices[0];
      }

      if (!voice) {
        voice = this.spanishVoices[0] || window.speechSynthesis.getVoices()[0];
      }

      if (voice) {
        utterance.voice = voice;
      }

      utterance.lang = profile.lang || 'es-ES';
      utterance.pitch = profile.pitch;
      utterance.rate = profile.rate;
      utterance.volume = profile.volume * this.volume;

      utterance.onstart = () => {
        this.notifySpeaking(true, characterId);
      };

      utterance.onend = () => {
        this.notifySpeaking(false, null);
      };

      utterance.onerror = () => {
        this.notifySpeaking(false, null);
      };

      window.speechSynthesis.speak(utterance);
    } catch {
      this.notifySpeaking(false, null);
    }
  }

  public testVoice(characterId: string) {
    const profile = CHARACTER_VOICE_PROFILES[characterId];
    if (!profile) return;
    const phrase = profile.signaturePhrases[Math.floor(Math.random() * profile.signaturePhrases.length)];
    this.speakCharacter(characterId, phrase);
  }

  public stop() {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      this.notifySpeaking(false, null);
    }
  }
}

export const voiceEngine = new VoiceEngineController();
