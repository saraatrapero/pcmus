import React, { useState } from 'react';
import { CardView } from './CardView';
import { Card } from '../types';
import { sound } from '../sound';
import { PC_MUS_CHARACTERS } from '../characters';

interface InteractiveTutorialProps {
  onBackToMenu: () => void;
  onStartGame: (mode: 'partida' | 'torneo' | 'multijugador') => void;
}

export const InteractiveTutorial: React.FC<InteractiveTutorialProps> = ({
  onBackToMenu,
  onStartGame,
}) => {
  const [currentStep, setCurrentStep] = useState<number>(1);
  const totalSteps = 6;

  // Step 1: Card Quiz state
  const [step1SelectedCard, setStep1SelectedCard] = useState<string | null>(null);
  const [step1Feedback, setStep1Feedback] = useState<string | null>(null);

  // Step 2: Discard state
  const [step2Cards, setStep2Cards] = useState<Card[]>([
    { id: 'c-4-oros', suit: 'oros', number: 4 },
    { id: 'c-5-espadas', suit: 'espadas', number: 5 },
    { id: 'c-12-copas', suit: 'copas', number: 12 }, // Rey
    { id: 'c-3-oros', suit: 'oros', number: 3 }, // 3 = Rey en 8 Reyes
  ]);
  const [step2SelectedIndices, setStep2SelectedIndices] = useState<number[]>([]);
  const [step2Discarded, setStep2Discarded] = useState<boolean>(false);
  const [step2Feedback, setStep2Feedback] = useState<string | null>(null);

  // Step 3: Lances quiz state
  const [step3Lance, setStep3Lance] = useState<'grande' | 'chica' | 'pares' | 'juego'>('grande');
  const [step3Answer, setStep3Answer] = useState<string | null>(null);
  const [step3Feedback, setStep3Feedback] = useState<string | null>(null);

  // Step 4: Señas state
  const [step4SelectedSeña, setStep4SelectedSeña] = useState<string | null>(null);
  const [step4Feedback, setStep4Feedback] = useState<string | null>(null);
  const [step4CharacterId, setStep4CharacterId] = useState<string>('tio_gil');

  // Step 5: Betting simulation
  const [step5BetStakes, setStep5BetStakes] = useState<number>(2);
  const [step5RivalAction, setStep5RivalAction] = useState<string>('¡Envido 2 piedras a la Grande!');
  const [step5UserDecision, setStep5UserDecision] = useState<string | null>(null);
  const [step5Result, setStep5Result] = useState<string | null>(null);

  const character = PC_MUS_CHARACTERS.find((c) => c.id === step4CharacterId) || PC_MUS_CHARACTERS[0];

  const handleNextStep = () => {
    sound.playCard();
    if (currentStep < totalSteps) {
      setCurrentStep((prev) => prev + 1);
    }
  };

  const handlePrevStep = () => {
    sound.playCard();
    if (currentStep > 1) {
      setCurrentStep((prev) => prev - 1);
    }
  };

  return (
    <div className="max-w-5xl mx-auto my-3 p-4 sm:p-6 bg-stone-900 border-2 border-amber-600 rounded-3xl shadow-2xl text-stone-100 font-sans">
      {/* Top Header & Navigation */}
      <div className="flex flex-col sm:flex-row items-center justify-between border-b border-stone-800 pb-4 mb-4 gap-3">
        <div className="flex items-center gap-3">
          <button
            onClick={onBackToMenu}
            className="px-3 py-1.5 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-300 text-xs font-bold transition flex items-center gap-1 border border-stone-700"
          >
            ← Menú Principal
          </button>
          <div>
            <span className="text-[10px] font-mono tracking-widest text-amber-400 uppercase font-bold">
              Academia Oficial de Musolari
            </span>
            <h1 className="text-xl sm:text-2xl font-black font-serif text-amber-300">
              Tutorial Interactivo de Mus
            </h1>
          </div>
        </div>

        {/* Progress pills */}
        <div className="flex items-center gap-1.5 bg-stone-950 px-3 py-1.5 rounded-2xl border border-stone-800">
          {[1, 2, 3, 4, 5, 6].map((num) => (
            <button
              key={num}
              onClick={() => {
                sound.playCard();
                setCurrentStep(num);
              }}
              className={`w-7 h-7 rounded-lg text-xs font-bold flex items-center justify-center transition ${
                currentStep === num
                  ? 'bg-amber-500 text-stone-950 shadow scale-105'
                  : currentStep > num
                  ? 'bg-emerald-900/60 text-emerald-300 border border-emerald-700/50'
                  : 'bg-stone-850 text-stone-500 hover:text-stone-300'
              }`}
            >
              {num === 6 ? '🎓' : num}
            </button>
          ))}
          <span className="text-xs text-stone-400 ml-1 font-mono">
            {currentStep}/{totalSteps}
          </span>
        </div>
      </div>

      {/* STEP 1: FUNDAMENTOS Y BARAJA (8 REYES) */}
      {currentStep === 1 && (
        <div className="space-y-4">
          <div className="bg-stone-950/70 p-4 rounded-2xl border border-stone-800">
            <div className="inline-block px-2.5 py-0.5 bg-amber-950 border border-amber-600 text-amber-300 text-[10px] font-mono font-bold rounded mb-1">
              PASO 1 DE 6 • FUNDAMENTOS
            </div>
            <h2 className="text-lg sm:text-xl font-bold font-serif text-amber-400">
              La Baraja Española y la Modalidad de "8 Reyes"
            </h2>
            <p className="text-xs text-stone-300 mt-1 leading-relaxed">
              El mus se juega entre <strong>4 personas divididas en dos parejas</strong> enfrentadas (Norte y Sur contra Este y Oeste) con una baraja española tradicional de <strong>40 naipes</strong>.
              En la modalidad más extendida (<strong>8 Reyes</strong>), las cartas tienen una jerarquía muy especial:
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 my-3">
              <div className="p-3 bg-stone-900 rounded-xl border border-stone-800 text-center">
                <span className="text-2xl mb-1 block">👑</span>
                <h3 className="font-serif font-bold text-amber-300 text-sm">Los 8 Reyes</h3>
                <p className="text-[11px] text-stone-300 mt-1">
                  Los <strong>4 Reyes (12)</strong> y los <strong>4 Treses (3)</strong> son equivalentes y valen <strong>10 puntos</strong> cada uno.
                </p>
              </div>

              <div className="p-3 bg-stone-900 rounded-xl border border-stone-800 text-center">
                <span className="text-2xl mb-1 block">🗡️</span>
                <h3 className="font-serif font-bold text-amber-300 text-sm">Los 8 Ases</h3>
                <p className="text-[11px] text-stone-300 mt-1">
                  Los <strong>4 Ases (1)</strong> y los <strong>4 Doses (2)</strong> son equivalentes y valen <strong>1 punto</strong> cada uno.
                </p>
              </div>

              <div className="p-3 bg-stone-900 rounded-xl border border-stone-800 text-center">
                <span className="text-2xl mb-1 block">🏇</span>
                <h3 className="font-serif font-bold text-amber-300 text-sm">Figuras Intermedias</h3>
                <p className="text-[11px] text-stone-300 mt-1">
                  Caballos (11) y Sotas (10) valen 10. Las cartas 4, 5, 6 y 7 valen su valor numérico nominal.
                </p>
              </div>
            </div>

            {/* Hierarchy Scale */}
            <div className="bg-stone-900/90 p-3 rounded-xl border border-amber-600/30 text-center">
              <div className="text-[11px] font-bold text-amber-300 uppercase tracking-wide mb-1">
                Jerarquía de Mayor a Menor en el Mus:
              </div>
              <div className="text-xs font-mono text-emerald-400 font-bold">
                [Rey / 3] &gt; [Caballo (11)] &gt; [Sota (10)] &gt; 7 &gt; 6 &gt; 5 &gt; 4 &gt; [As / 2]
              </div>
            </div>
          </div>

          {/* Interactive Challenge 1 */}
          <div className="bg-gradient-to-br from-amber-950/40 via-stone-950 to-stone-950 p-4 rounded-2xl border-2 border-amber-500/50">
            <h3 className="font-serif font-bold text-amber-300 text-sm flex items-center gap-2 mb-2">
              <span>🎯</span> Reto Práctico: ¿Cuál de estas dos cartas es SUPERIOR a la Grande?
            </h3>
            <p className="text-xs text-stone-300 mb-3">
              Recuerda la regla de los 8 Reyes: ¿Qué naipe manda sobre el otro? Haz clic en la carta que consideres ganadora:
            </p>

            <div className="flex justify-center items-center gap-6 py-2">
              <div className="flex flex-col items-center">
                <div
                  onClick={() => {
                    setStep1SelectedCard('3_copas');
                    setStep1Feedback('¡CORRECTO! En el Mus de 8 Reyes, el 3 equivale a un Rey, superando al Caballo.');
                    sound.playVictory();
                  }}
                  className={`cursor-pointer transition transform hover:scale-105 ${
                    step1SelectedCard === '3_copas' ? 'ring-4 ring-emerald-400 rounded-xl' : ''
                  }`}
                >
                  <CardView card={{ id: 't1-3', suit: 'copas', number: 3 }} size="lg" />
                </div>
                <span className="text-xs font-bold text-amber-300 mt-2">Tres de Copas (3)</span>
              </div>

              <span className="text-lg font-black text-stone-500">VS</span>

              <div className="flex flex-col items-center">
                <div
                  onClick={() => {
                    setStep1SelectedCard('caballo_oros');
                    setStep1Feedback('Incorrecto. Aunque en otros juegos el Caballo sea figura alta, en el Mus de 8 Reyes el Tres es Rey y le gana.');
                    sound.playCard();
                  }}
                  className={`cursor-pointer transition transform hover:scale-105 ${
                    step1SelectedCard === 'caballo_oros' ? 'ring-4 ring-rose-500 rounded-xl' : ''
                  }`}
                >
                  <CardView card={{ id: 't1-11', suit: 'oros', number: 11 }} size="lg" />
                </div>
                <span className="text-xs font-bold text-amber-300 mt-2">Caballo de Oros (11)</span>
              </div>
            </div>

            {step1Feedback && (
              <div
                className={`mt-3 p-3 rounded-xl text-xs font-bold text-center ${
                  step1SelectedCard === '3_copas'
                    ? 'bg-emerald-950/80 border border-emerald-500 text-emerald-200'
                    : 'bg-rose-950/80 border border-rose-600 text-rose-200'
                }`}
              >
                {step1Feedback}
              </div>
            )}
          </div>
        </div>
      )}

      {/* STEP 2: MUS Y DESCARTES */}
      {currentStep === 2 && (
        <div className="space-y-4">
          <div className="bg-stone-950/70 p-4 rounded-2xl border border-stone-800">
            <div className="inline-block px-2.5 py-0.5 bg-amber-950 border border-amber-600 text-amber-300 text-[10px] font-mono font-bold rounded mb-1">
              PASO 2 DE 6 • DINÁMICA DE LA MANO
            </div>
            <h2 className="text-lg sm:text-xl font-bold font-serif text-amber-400">
              La Consulta del Mus y los Descartes
            </h2>
            <p className="text-xs text-stone-300 mt-1 leading-relaxed">
              Cada jugador recibe 4 cartas. Empezando por la <strong>Mano</strong> (el primer jugador a la derecha del que reparte), cada jugador responde por orden:
            </p>
            <ul className="list-disc list-inside text-xs text-stone-300 space-y-1 my-2">
              <li>
                <strong>"Mus"</strong>: Deseas cambiar cartas descartándote de 1 a 4 cartas.
              </li>
              <li>
                <strong>"No hay mus" / "Corto"</strong>: Consideras tu mano suficientemente buena y cortas para pasar directamente a las apuestas.
              </li>
              <li>
                <strong>¡Regla de oro!</strong>: Para que haya descarte deben querer mus <strong>los 4 jugadores unánimemente</strong>. Si solo uno corta, ¡no hay mus para nadie!
              </li>
            </ul>
          </div>

          {/* Interactive Challenge 2 */}
          <div className="bg-gradient-to-br from-amber-950/40 via-stone-950 to-stone-950 p-4 rounded-2xl border-2 border-amber-500/50">
            <h3 className="font-serif font-bold text-amber-300 text-sm flex items-center gap-2 mb-2">
              <span>🎯</span> Reto Práctico: Descarte Estratégico
            </h3>
            <p className="text-xs text-stone-300 mb-3">
              Tienes en tu mano: <strong>4 de Oros</strong>, <strong>5 de Espadas</strong>, <strong>Rey de Copas</strong> y <strong>3 de Oros</strong> (que vale como otro Rey).
              <br />
              Tus dos Reyes son muy valiosos. Selecciona las <strong>cartas sobrantes</strong> que deseas cambiar haciendo clic sobre ellas:
            </p>

            <div className="flex justify-center items-center gap-3 py-2">
              {step2Cards.map((card, index) => {
                const isSelected = step2SelectedIndices.includes(index);
                return (
                  <div
                    key={card.id}
                    onClick={() => {
                      if (step2Discarded) return;
                      sound.playCard();
                      if (isSelected) {
                        setStep2SelectedIndices((prev) => prev.filter((i) => i !== index));
                      } else {
                        setStep2SelectedIndices((prev) => [...prev, index]);
                      }
                    }}
                    className={`cursor-pointer transition transform ${
                      isSelected ? '-translate-y-3 ring-4 ring-amber-400 rounded-xl shadow-lg' : 'hover:-translate-y-1'
                    }`}
                  >
                    <CardView card={card} size="md" />
                  </div>
                );
              })}
            </div>

            <div className="flex justify-center gap-3 mt-3">
              {!step2Discarded ? (
                <button
                  onClick={() => {
                    // Correct discard is indices 0 and 1 (4 and 5)
                    const has4 = step2SelectedIndices.includes(0);
                    const has5 = step2SelectedIndices.includes(1);
                    const hasRey = step2SelectedIndices.includes(2);
                    const hasTres = step2SelectedIndices.includes(3);

                    if (has4 && has5 && !hasRey && !hasTres) {
                      sound.playVictory();
                      setStep2Cards([
                        { id: 'c-12-bastos', suit: 'bastos', number: 12 }, // Another king!
                        { id: 'c-1-oros', suit: 'oros', number: 1 }, // Ace!
                        { id: 'c-12-copas', suit: 'copas', number: 12 },
                        { id: 'c-3-oros', suit: 'oros', number: 3 },
                      ]);
                      setStep2Discarded(true);
                      setStep2SelectedIndices([]);
                      setStep2Feedback('¡PERFECTO! Has mantenido tus dos Reyes (Rey y 3) y el mazo te ha concedido un tercer Rey y un As. ¡Mano ganadora de Medias de Reyes!');
                    } else {
                      sound.playCard();
                      setStep2Feedback('Pista: Mantén el Rey (12) y el 3 (que equivale a un Rey). Descarta únicamente el 4 y el 5.');
                    }
                  }}
                  className="px-6 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold text-xs shadow-lg transition"
                >
                  Descartar Cartas Seleccionadas ({step2SelectedIndices.length})
                </button>
              ) : (
                <button
                  onClick={() => {
                    setStep2Cards([
                      { id: 'c-4-oros', suit: 'oros', number: 4 },
                      { id: 'c-5-espadas', suit: 'espadas', number: 5 },
                      { id: 'c-12-copas', suit: 'copas', number: 12 },
                      { id: 'c-3-oros', suit: 'oros', number: 3 },
                    ]);
                    setStep2SelectedIndices([]);
                    setStep2Discarded(false);
                    setStep2Feedback(null);
                  }}
                  className="px-4 py-1.5 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-300 text-xs font-bold transition"
                >
                  Reiniciar Descarte
                </button>
              )}
            </div>

            {step2Feedback && (
              <div
                className={`mt-3 p-3 rounded-xl text-xs font-bold text-center ${
                  step2Discarded
                    ? 'bg-emerald-950/80 border border-emerald-500 text-emerald-200'
                    : 'bg-amber-950/80 border border-amber-600 text-amber-200'
                }`}
              >
                {step2Feedback}
              </div>
            )}
          </div>
        </div>
      )}

      {/* STEP 3: LOS 4 LANCES (GRANDE, CHICA, PARES, JUEGO/PUNTO) */}
      {currentStep === 3 && (
        <div className="space-y-4">
          <div className="bg-stone-950/70 p-4 rounded-2xl border border-stone-800">
            <div className="inline-block px-2.5 py-0.5 bg-amber-950 border border-amber-600 text-amber-300 text-[10px] font-mono font-bold rounded mb-1">
              PASO 3 DE 6 • LOS 4 LANCES
            </div>
            <h2 className="text-lg sm:text-xl font-bold font-serif text-amber-400">
              Los Cuatro Lances del Mus
            </h2>
            <p className="text-xs text-stone-300 mt-1 leading-relaxed">
              Cada mano de mus se disputa siempre en el mismo orden inmutable a través de 4 fases o lances:
            </p>

            <div className="flex bg-stone-900 p-1 rounded-xl border border-stone-700 my-3">
              {[
                { id: 'grande', label: '1. A la Grande' },
                { id: 'chica', label: '2. A la Chica' },
                { id: 'pares', label: '3. A los Pares' },
                { id: 'juego', label: '4. Al Juego / Punto' },
              ].map((lance) => (
                <button
                  key={lance.id}
                  onClick={() => {
                    sound.playCard();
                    setStep3Lance(lance.id as any);
                    setStep3Answer(null);
                    setStep3Feedback(null);
                  }}
                  className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition ${
                    step3Lance === lance.id
                      ? 'bg-amber-500 text-stone-950 shadow'
                      : 'text-stone-400 hover:text-white'
                  }`}
                >
                  {lance.label}
                </button>
              ))}
            </div>

            {step3Lance === 'grande' && (
              <div className="p-3 bg-stone-900/90 rounded-xl border border-stone-800 text-xs space-y-1">
                <h4 className="font-bold text-amber-300">1. Lance de Grande:</h4>
                <p className="text-stone-300">
                  Gana la mano con cartas de mayor valor comparadas una por una. (Ejemplo: Rey-Rey-Sota-4 gana a Rey-Caballo-Caballo-7).
                </p>
              </div>
            )}

            {step3Lance === 'chica' && (
              <div className="p-3 bg-stone-900/90 rounded-xl border border-stone-800 text-xs space-y-1">
                <h4 className="font-bold text-amber-300">2. Lance de Chica:</h4>
                <p className="text-stone-300">
                  Gana la mano con cartas de menor valor comparadas de menor a mayor. ¡Aquí los Ases y Doses valen oro! (Ejemplo: As-As-4-7 gana a As-4-5-6).
                </p>
              </div>
            )}

            {step3Lance === 'pares' && (
              <div className="p-3 bg-stone-900/90 rounded-xl border border-stone-800 text-xs space-y-1">
                <h4 className="font-bold text-amber-300">3. Lance de Pares:</h4>
                <p className="text-stone-300">
                  Solo apuestan quienes lleven al menos una pareja. Jerarquía de Pares:
                </p>
                <div className="grid grid-cols-3 gap-2 mt-2 font-mono text-[11px] text-center">
                  <div className="p-2 bg-stone-950 rounded border border-stone-800">
                    <span className="text-amber-400 font-bold block">PAR (1 piedra)</span>
                    2 cartas iguales
                  </div>
                  <div className="p-2 bg-stone-950 rounded border border-stone-800">
                    <span className="text-amber-400 font-bold block">MEDIAS (2 piedras)</span>
                    3 cartas iguales
                  </div>
                  <div className="p-2 bg-stone-950 rounded border border-stone-800">
                    <span className="text-amber-400 font-bold block">DUPLES (3 piedras)</span>
                    2 parejas o 4 iguales
                  </div>
                </div>
              </div>
            )}

            {step3Lance === 'juego' && (
              <div className="p-3 bg-stone-900/90 rounded-xl border border-stone-800 text-xs space-y-1">
                <h4 className="font-bold text-amber-300">4. Lance de Juego o Punto:</h4>
                <p className="text-stone-300">
                  Se suman los valores: Figuras y 3s valen 10; Ases y 2s valen 1; 4,5,6,7 su valor.
                </p>
                <p className="text-stone-300">
                  Se tiene <strong>Juego</strong> con 31 o más. El orden del juego es: <strong>¡31 (la mejor de todas)!</strong> &gt; 32 &gt; 40 &gt; 37 &gt; 36 &gt; 35 &gt; 34 &gt; 33.
                </p>
                <p className="text-stone-300">
                  Si nadie tiene 31 o más, se disputa <strong>Al Punto</strong>: gana quien más se aproxime a 30 (30 &gt; 29 &gt; 28...).
                </p>
              </div>
            )}
          </div>

          {/* Interactive Challenge 3 */}
          <div className="bg-gradient-to-br from-amber-950/40 via-stone-950 to-stone-950 p-4 rounded-2xl border-2 border-amber-500/50">
            <h3 className="font-serif font-bold text-amber-300 text-sm flex items-center gap-2 mb-2">
              <span>🎯</span> Reto Práctico: Identifica la Jugada Reina
            </h3>
            <p className="text-xs text-stone-300 mb-2">
              Mira esta mano: <strong>Rey (10)</strong>, <strong>Tres (10)</strong>, <strong>Sota (10)</strong> y <strong>As (1)</strong>:
            </p>

            <div className="flex justify-center gap-3 my-2">
              <CardView card={{ id: 'c3-1', suit: 'oros', number: 12 }} size="sm" />
              <CardView card={{ id: 'c3-2', suit: 'copas', number: 3 }} size="sm" />
              <CardView card={{ id: 'c3-3', suit: 'espadas', number: 10 }} size="sm" />
              <CardView card={{ id: 'c3-4', suit: 'bastos', number: 1 }} size="sm" />
            </div>

            <p className="text-xs text-center text-amber-300 font-bold mb-3">
              ¿Cuál es la puntuación exacta de Juego de esta mano?
            </p>

            <div className="grid grid-cols-3 gap-3">
              {[
                { val: '21', label: '21 (No tiene juego)' },
                { val: '31', label: '31 (¡La jugada reina del Juego!)' },
                { val: '40', label: '40 (La suma máxima)' },
              ].map((opt) => (
                <button
                  key={opt.val}
                  onClick={() => {
                    setStep3Answer(opt.val);
                    if (opt.val === '31') {
                      sound.playVictory();
                      setStep3Feedback('¡EXCELENTE! 10 (Rey) + 10 (3) + 10 (Sota) + 1 (As) = 31. Es la 31, ¡la jugada más alta posible en el lance de Juego!');
                    } else {
                      sound.playCard();
                      setStep3Feedback('Recuerda: Rey vale 10, Tres vale 10, Sota vale 10 y As vale 1. Suma 10 + 10 + 10 + 1.');
                    }
                  }}
                  className={`p-2.5 rounded-xl border text-xs font-bold transition ${
                    step3Answer === opt.val
                      ? opt.val === '31'
                        ? 'bg-emerald-950 border-emerald-400 text-emerald-200 ring-2 ring-emerald-400'
                        : 'bg-rose-950 border-rose-500 text-rose-200'
                      : 'bg-stone-900 border-stone-800 hover:border-amber-500 text-stone-200'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>

            {step3Feedback && (
              <div
                className={`mt-3 p-3 rounded-xl text-xs font-bold text-center ${
                  step3Answer === '31'
                    ? 'bg-emerald-950/80 border border-emerald-500 text-emerald-200'
                    : 'bg-rose-950/80 border border-rose-600 text-rose-200'
                }`}
              >
                {step3Feedback}
              </div>
            )}
          </div>
        </div>
      )}

      {/* STEP 4: LAS SEÑAS TRADICIONALES */}
      {currentStep === 4 && (
        <div className="space-y-4">
          <div className="bg-stone-950/70 p-4 rounded-2xl border border-stone-800">
            <div className="inline-block px-2.5 py-0.5 bg-amber-950 border border-amber-600 text-amber-300 text-[10px] font-mono font-bold rounded mb-1">
              PASO 4 DE 6 • ARTE DE LA COMUNICACIÓN
            </div>
            <h2 className="text-lg sm:text-xl font-bold font-serif text-amber-400">
              El Código de las Señas Reglamentarias
            </h2>
            <p className="text-xs text-stone-300 mt-1 leading-relaxed">
              El mus es el único juego de naipes donde <strong>las señas a tu compañero están legalizadas y reglamentadas</strong>. Solo se pueden hacer gestos oficiales y debes pasarlas cuando los rivales estén distraídos para no ser descubierto.
            </p>

            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 my-3 text-center">
              {[
                { icon: '👁️', title: 'Levantar cejas', desc: 'Dos Reyes (o 3s)' },
                { icon: '👄', title: 'Morderse el labio', desc: 'Dos Ases (o 2s)' },
                { icon: '😬', title: 'Torcer la boca', desc: 'Medias (Trío)' },
                { icon: '👅', title: 'Sacar la lengua', desc: 'Duples (2 parejas)' },
                { icon: '😉', title: 'Guiñar el ojo', desc: 'La 31 (Juego Reina)' },
              ].map((s) => (
                <div key={s.title} className="p-2.5 bg-stone-900 rounded-xl border border-stone-800">
                  <span className="text-2xl mb-1 block">{s.icon}</span>
                  <div className="font-bold text-amber-300 text-xs">{s.title}</div>
                  <div className="text-[10px] text-stone-400 mt-0.5">{s.desc}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Interactive Challenge 4 */}
          <div className="bg-gradient-to-br from-amber-950/40 via-stone-950 to-stone-950 p-4 rounded-2xl border-2 border-amber-500/50">
            <h3 className="font-serif font-bold text-amber-300 text-sm flex items-center gap-2 mb-2">
              <span>🎯</span> Reto Práctico: Pasa la Seña Adecuada a tu Pareja
            </h3>
            <p className="text-xs text-stone-300 mb-2">
              Observa las cartas que acabas de recibir en la mesa:
            </p>

            <div className="flex justify-center gap-3 my-2">
              <CardView card={{ id: 's4-1', suit: 'oros', number: 12 }} size="sm" />
              <CardView card={{ id: 's4-2', suit: 'copas', number: 12 }} size="sm" />
              <CardView card={{ id: 's4-3', suit: 'espadas', number: 5 }} size="sm" />
              <CardView card={{ id: 's4-4', suit: 'bastos', number: 4 }} size="sm" />
            </div>

            <p className="text-xs text-center text-amber-300 font-bold mb-3">
              Tienes 2 Reyes (Rey de Oros y Rey de Copas). ¿Qué seña reglamentaria debes enviarle a tu compañero?
            </p>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {[
                { id: 'cejas', label: '👁️ Levantar las cejas', correct: true },
                { id: 'labio', label: '👄 Morderse el labio', correct: false },
                { id: 'lengua', label: '👅 Sacar la lengua', correct: false },
                { id: 'ojo', label: '😉 Guiñar el ojo', correct: false },
              ].map((opt) => (
                <button
                  key={opt.id}
                  onClick={() => {
                    setStep4SelectedSeña(opt.id);
                    if (opt.correct) {
                      sound.playVictory();
                      setStep4Feedback('¡CLAVADO! Levantas las cejas discretamente. Tu compañero asiente: sabe que lleváis dos Reyes de cara a la Grande.');
                    } else {
                      sound.playCard();
                      setStep4Feedback('Esa seña corresponde a otra jugada (Ases, Duples o 31). Para dos Reyes, la seña oficial es levantar las cejas.');
                    }
                  }}
                  className={`p-2 rounded-xl border text-xs font-bold transition text-center ${
                    step4SelectedSeña === opt.id
                      ? opt.correct
                        ? 'bg-emerald-950 border-emerald-400 text-emerald-200 ring-2 ring-emerald-400'
                        : 'bg-rose-950 border-rose-500 text-rose-200'
                      : 'bg-stone-900 border-stone-800 hover:border-amber-500 text-stone-200'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>

            {step4Feedback && (
              <div
                className={`mt-3 p-3 rounded-xl text-xs font-bold text-center ${
                  step4SelectedSeña === 'cejas'
                    ? 'bg-emerald-950/80 border border-emerald-500 text-emerald-200'
                    : 'bg-rose-950/80 border border-rose-600 text-rose-200'
                }`}
              >
                {step4Feedback}
              </div>
            )}
          </div>
        </div>
      )}

      {/* STEP 5: APUESTAS Y EL ÓRDAGO */}
      {currentStep === 5 && (
        <div className="space-y-4">
          <div className="bg-stone-950/70 p-4 rounded-2xl border border-stone-800">
            <div className="inline-block px-2.5 py-0.5 bg-amber-950 border border-amber-600 text-amber-300 text-[10px] font-mono font-bold rounded mb-1">
              PASO 5 DE 6 • EL ARTE DEL ENVITE
            </div>
            <h2 className="text-lg sm:text-xl font-bold font-serif text-amber-400">
              Las Apuestas, los Envítes y el Temido ¡Órdago!
            </h2>
            <p className="text-xs text-stone-300 mt-1 leading-relaxed">
              En cada lance los equipos deciden si envidar piedras al marcador:
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 my-3 text-xs">
              <div className="p-3 bg-stone-900 rounded-xl border border-stone-800">
                <span className="font-bold text-amber-400 block mb-1">Paso / Envido</span>
                <strong>Paso</strong>: No se apuesta. Si todos pasan, se cobrará 1 piedra en diferido.
                <br />
                <strong>Envido</strong>: Apuesta básica de 2 piedras.
              </div>

              <div className="p-3 bg-stone-900 rounded-xl border border-stone-800">
                <span className="font-bold text-emerald-400 block mb-1">Quiero / No Quiero</span>
                <strong>Quiero</strong>: Se acepta el envite (se cobrará en el tanteador al final de la mano).
                <br />
                <strong>No quiero</strong>: Se rechaza; el rival cobra 1 piedra de deje de inmediato.
              </div>

              <div className="p-3 bg-stone-900 rounded-xl border border-amber-600/60 bg-amber-950/20">
                <span className="font-bold text-yellow-300 block mb-1">¡Órdago! ("Ahí está")</span>
                Se juegan <strong>todas las piedras de la partida</strong>. Si se acepta, se descubren las cartas en el acto y quien gane ese lance se corona campeón.
              </div>
            </div>
          </div>

          {/* Interactive Challenge 5 */}
          <div className="bg-gradient-to-br from-amber-950/40 via-stone-950 to-stone-950 p-4 rounded-2xl border-2 border-amber-500/50">
            <h3 className="font-serif font-bold text-amber-300 text-sm flex items-center gap-2 mb-2">
              <span>🎯</span> Reto Práctico: Simulador de Apuestas en Directo
            </h3>
            <p className="text-xs text-stone-300 mb-2">
              Estás en el lance de Grande. Llevas una mano formidable: <strong>[Rey, Rey, Rey, Caballo]</strong>.
              <br />
              Tu rival te mira fijamente a los ojos y grita:
            </p>

            <div className="p-3 bg-stone-950 rounded-xl border border-amber-500/40 my-3 text-center">
              <span className="text-xs font-mono text-stone-400 block">El Rival (Tío Gil):</span>
              <span className="text-base font-serif font-bold text-amber-300 italic">
                "{step5RivalAction}"
              </span>
            </div>

            <p className="text-xs text-stone-300 mb-3 text-center">
              ¿Cómo quieres responder? Prueba las distintas opciones para ver el desenlace táctico:
            </p>

            <div className="flex flex-wrap justify-center gap-3">
              <button
                onClick={() => {
                  sound.playChip();
                  setStep5UserDecision('quiero');
                  setStep5Result('Has dicho "QUIERO". La apuesta de 2 piedras queda aceptada. Al final de la mano en el tanteador, tus 3 Reyes superarán la mano del rival y os llevaréis 2 piedras.');
                }}
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow transition"
              >
                ✓ Quiero (Aceptar 2 piedras)
              </button>

              <button
                onClick={() => {
                  sound.playChip();
                  setStep5UserDecision('mas');
                  setStep5Result('Has dicho "MÁS (Reenvido cuatro más)". El rival se echa a temblar ante tu poderío y dice "No quiero". Os lleváis de inmediato 2 piedras de tanteo.');
                }}
                className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow transition"
              >
                + Más (Reenvidar)
              </button>

              <button
                onClick={() => {
                  sound.playOrdago();
                  setStep5UserDecision('ordago');
                  setStep5Result('¡¡¡ÓRDAGO A LA GRANDE!!! La mesa se paraliza. El rival acepta a temblar, descubrís las cartas y tus 3 Reyes vencen. ¡¡¡VICTORIA INMEDIATA DE LA PARTIDA!!!');
                }}
                className="px-5 py-2 rounded-xl bg-gradient-to-r from-red-600 to-amber-600 hover:from-red-500 hover:to-amber-500 text-white font-black text-xs shadow-lg transition animate-pulse"
              >
                ⚡ ¡ÓRDAGO!
              </button>

              <button
                onClick={() => {
                  sound.playCard();
                  setStep5UserDecision('no_quiero');
                  setStep5Result('Has dicho "NO QUIERO". Al retirarte con 3 Reyes has regalado 1 piedra de rechazo al rival. ¡Con tan buena mano hay que plantar cara!');
                }}
                className="px-4 py-2 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-400 font-bold text-xs shadow transition"
              >
                ✗ No quiero (Retirarse)
              </button>
            </div>

            {step5Result && (
              <div
                className={`mt-3 p-3 rounded-xl text-xs font-bold text-center ${
                  step5UserDecision === 'ordago'
                    ? 'bg-amber-950 border-2 border-yellow-400 text-yellow-200'
                    : step5UserDecision === 'no_quiero'
                    ? 'bg-rose-950 border border-rose-600 text-rose-200'
                    : 'bg-emerald-950 border border-emerald-500 text-emerald-200'
                }`}
              >
                {step5Result}
              </div>
            )}
          </div>
        </div>
      )}

      {/* STEP 6: DIPLOMA Y FINALIZACIÓN */}
      {currentStep === 6 && (
        <div className="space-y-4 text-center">
          <div className="bg-gradient-to-b from-amber-950/60 to-stone-950 p-6 rounded-3xl border-2 border-amber-500 shadow-2xl max-w-xl mx-auto">
            <span className="text-4xl mb-2 block">🎓</span>
            <div className="inline-block px-3 py-1 bg-amber-500 text-stone-950 font-mono font-bold text-xs rounded-full mb-3 uppercase tracking-widest">
              CERTIFICADO OFICIAL
            </div>
            <h2 className="text-2xl sm:text-3xl font-black font-serif text-amber-300">
              ¡Graduado en Mus Español!
            </h2>
            <p className="text-xs text-stone-300 mt-2 leading-relaxed">
              Has completado con éxito todos los conceptos del Mus tradicional: la baraja de 8 Reyes, la regla del Mus y descartes, la jerarquía de los 4 Lances (Grande, Chica, Pares y Juego de 31), el código de señas y la estrategia de apuestas y órdagos.
            </p>

            <div className="p-4 bg-stone-900/90 rounded-2xl border border-amber-500/30 my-4 text-left font-serif text-xs text-amber-200/90 space-y-1">
              <div className="text-[10px] uppercase font-mono text-stone-400">Declaración de los 90s:</div>
              <p className="italic">
                "Por la presente, Tío Gil, El Marqués y Doña Norma dan fe de que estás plenamente preparado para sentarte a la mesa verde y cantar los cuatro lances."
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
              <button
                onClick={() => onStartGame('partida')}
                className="px-6 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-black text-xs shadow-lg transition active:scale-95"
              >
                🃏 Jugar Partida Rápida
              </button>
              <button
                onClick={() => onStartGame('torneo')}
                className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs shadow-lg transition active:scale-95"
              >
                🏆 Jugar Torneo
              </button>
              <button
                onClick={() => onStartGame('multijugador')}
                className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-xs shadow-lg transition active:scale-95"
              >
                🌐 Ir al Multijugador Online
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bottom Step Controls */}
      <div className="flex items-center justify-between border-t border-stone-800 pt-4 mt-6">
        <button
          disabled={currentStep === 1}
          onClick={handlePrevStep}
          className={`px-4 py-2 rounded-xl text-xs font-bold border transition ${
            currentStep === 1
              ? 'opacity-30 cursor-not-allowed border-stone-800 text-stone-600'
              : 'border-stone-700 bg-stone-800 hover:bg-stone-700 text-stone-200'
          }`}
        >
          ← Paso Anterior
        </button>

        {currentStep < totalSteps ? (
          <button
            onClick={handleNextStep}
            className="px-6 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold text-xs shadow-lg transition active:scale-95 flex items-center gap-1.5"
          >
            <span>Siguiente Paso</span>
            <span>→</span>
          </button>
        ) : (
          <button
            onClick={onBackToMenu}
            className="px-6 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-stone-950 font-bold text-xs shadow-lg transition active:scale-95"
          >
            Volver al Menú Principal
          </button>
        )}
      </div>
    </div>
  );
};
