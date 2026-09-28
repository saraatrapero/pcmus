import React from 'react';

interface RulesModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const RulesModal: React.FC<RulesModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-stone-900 border-2 border-amber-600 rounded-3xl max-w-2xl w-full p-6 shadow-2xl text-stone-100 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-stone-800 pb-3 mb-4">
          <div className="flex items-center gap-2">
            <span className="text-2xl">📜</span>
            <div>
              <h2 className="font-serif font-black text-xl text-amber-300">
                REGLAS DEL MUS & HISTORIA DE PC MUS (1996)
              </h2>
              <p className="text-xs text-stone-400">
                Guía completa para jugar con maestría al clásico español
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-stone-400 hover:text-white text-lg font-bold px-2.5 py-1 rounded-lg bg-stone-800"
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="overflow-y-auto space-y-4 text-xs sm:text-sm text-stone-300 pr-2 leading-relaxed font-sans">
          {/* History */}
          <div className="bg-amber-950/40 p-3.5 rounded-2xl border border-amber-600/40">
            <h3 className="font-serif font-bold text-amber-300 text-sm mb-1">
              🎮 El clásico: PC Mus (Círculo ASM, 1996)
            </h3>
            <p className="text-xs text-stone-300">
              Desarrollado por el equipo español <strong>Círculo ASM</strong> y distribuido
              originalmente por LIT para PC MS-DOS en disquete de 3½ y CD (y reeditado por Dinamic
              Multimedia en El Mundo en 1998). Es célebre por incorporar a los 7 personajes
              emblemáticos de la España de los 90 (Tío Gil, El Marqués, Isidoro, Tío Mateo, Doña
              Norma, Rossy de Palma y el cabo Don Luis), con cameos hilarantes de Arguiñano y
              Chiquito de la Calzada.
            </p>
          </div>

          {/* 8 Reyes Mus */}
          <div>
            <h3 className="font-serif font-bold text-amber-300 text-sm mb-1">
              🃏 Baraja y Modalidad de 8 Reyes
            </h3>
            <p>
              Se juega con baraja española de 40 cartas (Oros, Copas, Espadas y Bastos). En la
              modalidad tradicional de <strong>8 Reyes</strong>:
            </p>
            <ul className="list-disc list-inside mt-1 space-y-0.5 text-stone-300 pl-1">
              <li>
                Los <strong>Treses (3)</strong> equivalen a <strong>Reyes</strong> (valor 10 en la
                suma y rango máximo).
              </li>
              <li>
                Los <strong>Doses (2)</strong> equivalen a <strong>Ases</strong> (valor 1 en la suma
                y rango mínimo).
              </li>
              <li>
                Las <strong>Figuras (Sota, Caballo, Rey)</strong> valen 10 puntos en la suma.
              </li>
              <li>
                Las cartas 4, 5, 6 y 7 tienen su valor nominal.
              </li>
            </ul>
          </div>

          {/* Los 4 Lances */}
          <div>
            <h3 className="font-serif font-bold text-amber-300 text-sm mb-1">
              ⚔️ Los Cuatro Lances del Mus
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2">
              <div className="p-2.5 rounded-xl bg-stone-800/80 border border-stone-700">
                <div className="font-bold text-amber-200">1. Grande</div>
                <div className="text-[11px] text-stone-300">
                  Gana la mano con las cartas más altas (Reyes/3 &gt; Caballo &gt; Sota &gt; 7...).
                </div>
              </div>
              <div className="p-2.5 rounded-xl bg-stone-800/80 border border-stone-700">
                <div className="font-bold text-amber-200">2. Chica</div>
                <div className="text-[11px] text-stone-300">
                  Gana la mano con las cartas más bajas (Ases/2 &lt; 4 &lt; 5 &lt; 6 &lt; 7...).
                </div>
              </div>
              <div className="p-2.5 rounded-xl bg-stone-800/80 border border-stone-700">
                <div className="font-bold text-amber-200">3. Pares</div>
                <div className="text-[11px] text-stone-300">
                  Duples (dobles parejas/póker) &gt; Medias (trío) &gt; Par simple.
                </div>
              </div>
              <div className="p-2.5 rounded-xl bg-stone-800/80 border border-stone-700">
                <div className="font-bold text-amber-200">4. Juego o Punto</div>
                <div className="text-[11px] text-stone-300">
                  Suma de cartas: 31 es la mejor, luego 32, 40, 37... Si nadie tiene &gt;= 31, se
                  juega a <strong>Punto</strong> (el más cercano a 30).
                </div>
              </div>
            </div>
          </div>

          {/* Apuestas y Órdago */}
          <div>
            <h3 className="font-serif font-bold text-amber-300 text-sm mb-1">
              🪙 Voces, Apuestas y el Famoso ÓRDAGO
            </h3>
            <ul className="list-disc list-inside space-y-1 pl-1">
              <li>
                <strong>Paso:</strong> No se apuesta de momento en ese lance.
              </li>
              <li>
                <strong>Envido:</strong> Se apuestan 2 piedras (el rival puede decir "Quiero",
                "No quiero", reenvidar o cantar órdago).
              </li>
              <li>
                <strong>¡Órdago!:</strong> ¡Se juega todo el juego de golpe! Si se acepta, se
                muestran las cartas inmediatamente y quien tenga la mejor jugada gana la partida.
              </li>
            </ul>
          </div>

          {/* Señas */}
          <div>
            <h3 className="font-serif font-bold text-amber-300 text-sm mb-1">
              🤫 Señas Tradicionales
            </h3>
            <p>
              El mus permite avisar al compañero con gestos fijados por reglamento: levantar cejas (2
              reyes), morderse el labio (2 ases), torcer la boca (medias), sacar la lengua (duples) o
              guiñar el ojo (31). Pero atención: ¡si los rivales te ven la seña pueden pillarte!
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-4 pt-3 border-t border-stone-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold text-sm transition"
          >
            ¡Entendido, a jugar!
          </button>
        </div>
      </div>
    </div>
  );
};
