import React, { useState } from 'react';

interface RulesModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const RulesModal: React.FC<RulesModalProps> = ({ isOpen, onClose }) => {
  const [selectedTab, setSelectedTab] = useState<string>('todos');

  if (!isOpen) return null;

  const tabs = [
    { id: 'todos', label: 'Todo el Reglamento' },
    { id: 'general', label: 'Normas Generales' },
    { id: 'art1', label: 'Art. I: Inicio y Cartas' },
    { id: 'art2', label: 'Art. II: Señas' },
    { id: 'art3', label: 'Art. III: Dar/Quitar Mus' },
    { id: 'art4', label: 'Art. IV: Descarte' },
    { id: 'art5', label: 'Art. V: Envites' },
    { id: 'art6', label: 'Art. VI: Contar Tantos' },
    { id: 'art7', label: 'Art. VII: Pares' },
    { id: 'art8', label: 'Art. VIII & IX: Juego y Punto' },
  ];

  return (
    <div className="fixed inset-0 z-50 bg-black/85 flex items-center justify-center p-2 sm:p-4 select-none">
      <div className="bg-stone-900 border-2 border-amber-600 rounded-3xl max-w-3xl w-full p-4 sm:p-6 shadow-2xl text-stone-100 flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-stone-800 pb-3 mb-3">
          <div className="flex items-center gap-2.5">
            <span className="text-3xl">📜</span>
            <div>
              <h2 className="font-serif font-black text-lg sm:text-xl text-amber-300 leading-tight">
                REGLAMENTO OFICIAL DE MUS
              </h2>
              <p className="text-xs text-amber-200/90 font-mono">
                Normas Generales para el Juego de Mus en Bizkaia y en el Torneo de Txapeldunes
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-stone-400 hover:text-white text-lg font-bold px-3 py-1.5 rounded-xl bg-stone-800 transition cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-2 border-b border-stone-800 text-[11px] font-mono scrollbar-thin">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setSelectedTab(tab.id)}
              className={`px-3 py-1.5 rounded-xl transition whitespace-nowrap border ${
                selectedTab === tab.id
                  ? 'bg-amber-500 text-stone-950 font-black border-amber-300 shadow'
                  : 'bg-stone-800 text-stone-300 border-stone-700 hover:bg-stone-750'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content Body */}
        <div className="overflow-y-auto space-y-4 text-xs sm:text-sm text-stone-300 pr-2 my-2 leading-relaxed font-sans">
          {/* NORMAS GENERALES */}
          {(selectedTab === 'todos' || selectedTab === 'general') && (
            <div className="bg-amber-950/40 p-4 rounded-2xl border border-amber-600/50 space-y-2">
              <h3 className="font-serif font-black text-amber-300 text-base flex items-center gap-2">
                <span>🏆</span> NORMAS GENERALES (BIZKAIA & TORNEO DE TXAPELDUNES)
              </h3>
              <p className="text-xs text-stone-200">
                A fin de unificar criterios, la Organización aconseja que las parejas hablen antes de
                comenzar la partida para acordar y poner claro, de mutuo acuerdo, las dudas que puedan
                tener (señas, si se puede hablar entre partida, etc.). En caso de persistir la duda,
                precisamos que:
              </p>
              <ul className="list-disc list-inside space-y-1 text-xs text-amber-100 font-medium pl-1">
                <li><strong>Se jugará con 40 cartas.</strong></li>
                <li><strong>Las partidas de campeonato se disputarán a 4 JUEGOS de 8 amarracos</strong> (40 piedras por juego).</li>
                <li><strong>Se jugará a 8 reyes y 8 ases</strong> (los 3 equivalen a Reyes y los 2 a Ases).</li>
                <li><strong>Sólo son válidas las señas habituales en el juego de mus en Euskadi.</strong></li>
                <li><strong>Se sorteará la mano</strong>, iniciando la partida el que tenga la <strong>carta menor</strong>.</li>
                <li><strong>Ganan las 31 de mano.</strong></li>
                <li><strong>Ganan los duples que tengan el par mayor.</strong></li>
                <li><strong>«La boca hace ley», nunca se puede mentir.</strong></li>
              </ul>
            </div>
          )}

          {/* ARTÍCULO I */}
          {(selectedTab === 'todos' || selectedTab === 'art1') && (
            <div className="bg-stone-800/60 p-4 rounded-2xl border border-stone-700 space-y-2.5">
              <h4 className="font-serif font-bold text-amber-300 text-sm border-b border-stone-700 pb-1">
                ARTÍCULO I: PARA COMENZAR EL JUEGO
              </h4>
              <div className="space-y-2 text-xs text-stone-300">
                <p><strong>Punto 1.</strong> Al comenzar una partida se aconseja contar las cartas de la baraja por si sobrara o faltara alguna. Si en el transcurso faltara o sobrara, se pediría otra baraja siendo válido todo lo jugado hasta ese momento.</p>
                <p><strong>Punto 2.</strong> El jugador que reparte tendrá la obligación, antes del reparto, de barajar las cartas.</p>
                <p><strong>Punto 3.</strong> Cualquier jugador podrá solicitar barajar, cediendo el mazo de nuevo al que le tocaba repartir para que éste baraje de nuevo y reparta definitivamente.</p>
                <p><strong>Punto 4.</strong> El jugador que corta tiene la obligación de dar un solo corte y no podrá levantar o dejar menos de tres cartas. Queda prohibido sacar cartas de cualquier parte del mazo o hacer varios montones.</p>
                <p><strong>Punto 5.</strong> Las cartas se repartirán por arriba, quedando prohibido cambiar de forma de dar. <em>En la primera jugada cuando se corre la baraja, no se podrán pasar señas hasta que un jugador quite el Mus.</em></p>
                <p><strong>Punto 6.</strong> No se podrán levantar ni mirar las cartas hasta que no estén todas servidas y la baraja en reposo.</p>
                <p><strong>Punto 7.</strong> Todo jugador tiene la obligación ineludible de comprobar que tiene las cuatro cartas antes de comenzar a jugar.</p>
                <p><strong>Punto 8.</strong> Si se descubre una carta mientras se reparte en primeras dadas, se recogen las cartas y el mismo jugador vuelve a repartir de nuevo.</p>
                <p><strong>Punto 9.</strong> Cuando un jugador tenga cartas de más o de menos, si se da cuenta antes de cerrarse la Grande, se vuelve a dar. Si no, su jugada será invalidada y su compañero jugará solo contra la pareja rival.</p>
                <p><strong>Punto 10.</strong> En el descarte, si se advierte tener cartas de más antes de Grande, el jugador de su izquierda le quitará la sobrante al azar; si tiene de menos, se le completará. De no advertirlo a tiempo, su jugada queda invalidada en el mazo.</p>
                <p><strong>Punto 11.</strong> Si una pareja es mano dos veces seguidas por error y se advierte antes de cerrar Grande, se vuelve a dar.</p>
                <p><strong>Punto 12.</strong> No se podrán enseñar las cartas bajo ningún concepto hasta que se haya ventilado el juego o punto, momento en el que es obligatorio enseñar las cuatro cartas de ambos equipos.</p>
                <p><strong>Punto 13.</strong> Quedan prohibidos terminantemente mirones o espectadores si un jugador lo solicita.</p>
              </div>
            </div>
          )}

          {/* ARTÍCULO II */}
          {(selectedTab === 'todos' || selectedTab === 'art2') && (
            <div className="bg-stone-800/60 p-4 rounded-2xl border border-stone-700 space-y-2.5">
              <h4 className="font-serif font-bold text-amber-300 text-sm border-b border-stone-700 pb-1">
                ARTÍCULO II: DE LAS SEÑAS Y EL MODO DE HACERLAS
              </h4>
              <p className="text-xs text-stone-200"><strong>Punto 1. Las únicas señas admitidas y el modo de realizarlas son:</strong></p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                <div className="p-2.5 rounded-xl bg-stone-900 border border-amber-600/40">
                  <div className="font-bold text-amber-200">😬 Dos reyes</div>
                  <div className="text-stone-300 text-[11px]">Morder el labio inferior.</div>
                </div>
                <div className="p-2.5 rounded-xl bg-stone-900 border border-amber-600/40">
                  <div className="font-bold text-amber-200">👅 Dos ases</div>
                  <div className="text-stone-300 text-[11px]">Sacar la punta de la lengua hacia delante.</div>
                </div>
                <div className="p-2.5 rounded-xl bg-stone-900 border border-amber-600/40">
                  <div className="font-bold text-amber-200">👅 Medias de ases</div>
                  <div className="text-stone-300 text-[11px]">Sacar la punta de la lengua hacia un lado.</div>
                </div>
                <div className="p-2.5 rounded-xl bg-stone-900 border border-amber-600/40">
                  <div className="font-bold text-amber-200">😉 Juego de 31 (Treinta y una)</div>
                  <div className="text-stone-300 text-[11px]">Guiñar un ojo.</div>
                </div>
                <div className="p-2.5 rounded-xl bg-stone-900 border border-amber-600/40">
                  <div className="font-bold text-amber-200">😏 Medias de reyes</div>
                  <div className="text-stone-300 text-[11px]">Mover la comisura de los labios hacia un lado.</div>
                </div>
                <div className="p-2.5 rounded-xl bg-stone-900 border border-amber-600/40">
                  <div className="font-bold text-amber-200">😏 Medias (cualquier carta)</div>
                  <div className="text-stone-300 text-[11px]">Mover comisura a un lado (sólo tras cerrarse la Grande).</div>
                </div>
                <div className="p-2.5 rounded-xl bg-stone-900 border border-amber-600/40">
                  <div className="font-bold text-amber-200">🤨 Duples</div>
                  <div className="text-stone-300 text-[11px]">Levantar las cejas.</div>
                </div>
                <div className="p-2.5 rounded-xl bg-stone-900 border border-amber-600/40">
                  <div className="font-bold text-amber-200">😉 Treinta al juego (30 de punto)</div>
                  <div className="text-stone-300 text-[11px]">Guiñar un ojo (sólo tras cantarse «juego no»).</div>
                </div>
                <div className="p-2.5 rounded-xl bg-stone-900 border border-amber-600/40 sm:col-span-2">
                  <div className="font-bold text-amber-200">😑 Ciego o ceguera</div>
                  <div className="text-stone-300 text-[11px]">Cerrar los dos ojos (prohibido pasarla si se tienen pares o juego, o 29 al punto).</div>
                </div>
              </div>
              <div className="space-y-1.5 text-xs text-stone-300 pt-2 border-t border-stone-800">
                <p><strong>Punto 2.</strong> No se podrán pasar señas en la primera mano hasta que se corte mus (arranque con «Mus corrido y sin señas»).</p>
                <p><strong>Punto 3.</strong> La seña es la expresión seria y veraz del Mus; tendrá que ser siempre fidedigna de las cartas que el jugador lleva en su mano.</p>
                <p><strong>Punto 4 y 5.</strong> Se pasarán una vez vistas las cuatro cartas, con la obligación de pasar la seña completa. Se pasará siempre 31 si esta es con dos reyes antes de cortar mus.</p>
                <p><strong>Punto 6 y 7.</strong> Prohibido pasar ciego con 29 o pares. Prohibido pasar señas parciales (ejemplo: si se tienen duples reyes-ases pasar dos reyes).</p>
              </div>
            </div>
          )}

          {/* ARTÍCULO III */}
          {(selectedTab === 'todos' || selectedTab === 'art3') && (
            <div className="bg-stone-800/60 p-4 rounded-2xl border border-stone-700 space-y-2">
              <h4 className="font-serif font-bold text-amber-300 text-sm border-b border-stone-700 pb-1">
                ARTÍCULO III: MODO DE DAR O QUITAR EL MUS
              </h4>
              <p className="text-xs text-stone-300"><strong>Punto 1 y 4.</strong> Podrá quitar el Mus cualquier jugador sin necesidad de hablar por orden correlativo y envidar a las dos (Grande y Chica) si así lo estima conveniente.</p>
              <p className="text-xs text-stone-300"><strong>Punto 2.</strong> Las palabras entre compañeros deberán limitarse a palabras firmes: <em>MUS, QUITA, ENVIDA, METE ÓRDAGO, LLEGÓ A MÍ, ¿QUÉ DIGO?</em> Respuestas claras «sí» o «no».</p>
              <p className="text-xs text-stone-300"><strong>Punto 3.</strong> El jugador que se dé Mus no podrá comenzar el juego hasta que otro lo quite.</p>
              <p className="text-xs text-stone-300"><strong>Punto 5.</strong> No podrá decirse más que con jugada firme la frase <em>«YO JUEGO SOLO»</em> (Medias, Duples o 31).</p>
            </div>
          )}

          {/* ARTÍCULO IV */}
          {(selectedTab === 'todos' || selectedTab === 'art4') && (
            <div className="bg-stone-800/60 p-4 rounded-2xl border border-stone-700 space-y-2">
              <h4 className="font-serif font-bold text-amber-300 text-sm border-b border-stone-700 pb-1">
                ARTÍCULO IV: DESCARTE
              </h4>
              <p className="text-xs text-stone-300"><strong>Punto 1.</strong> El primero en descartarse será la mano, siguiendo el orden por su derecha. No se dan cartas hasta que los cuatro jugadores estén descartados.</p>
              <p className="text-xs text-stone-300"><strong>Punto 2.</strong> En el descarte ningún jugador podrá quedarse con las cuatro cartas, obligatoriamente tendrá que pedir como mínimo una. Si se pasó seña de Dos Reyes y luego se reciben Dos Ases, tendrá que pasarse la seña de Duples completa.</p>
            </div>
          )}

          {/* ARTÍCULO V */}
          {(selectedTab === 'todos' || selectedTab === 'art5') && (
            <div className="bg-stone-800/60 p-4 rounded-2xl border border-stone-700 space-y-2">
              <h4 className="font-serif font-bold text-amber-300 text-sm border-b border-stone-700 pb-1">
                ARTÍCULO V: DE LOS ENVITES
              </h4>
              <p className="text-xs text-stone-300"><strong>Punto 1.</strong> Si se acepta un envite superior a 40 tantos, el juego continúa hasta el final de los lances de esa mano; sólo termina de inmediato al aceptarse un ÓRDAGO.</p>
              <p className="text-xs text-stone-300"><strong>Punto 2.</strong> Cada jugador habla por sí mismo si no pluraliza. La jugada no está cerrada hasta que se diga «queremos» o «no queremos».</p>
              <p className="text-xs text-stone-300"><strong>Punto 3.</strong> Reenvidar a la Chica cierra automáticamente la jugada a Grande.</p>
              <p className="text-xs text-stone-300"><strong>Punto 4 y 5.</strong> Preguntas firmes: «¿Qué llevas a grande?». Sólo se pueden cantar cartas para aceptar envites, nunca para revocar, de mayor a menor o menor a mayor sin omitir cartas de igual valor.</p>
              <p className="text-xs text-stone-300"><strong>Punto 8.</strong> Si una pareja envida distinto número o uno envida y otro mete órdago simultáneamente, el oponente elige el envite.</p>
              <p className="text-xs text-stone-300"><strong>Punto 11.</strong> Un órdago aceptado en jugada posterior anula envites anteriores.</p>
              <p className="text-xs text-stone-300"><strong>Punto 12.</strong> Prohibido con jugada máxima (4 reyes, 4 ases, 31 con 3 reyes o 30 al no juego) decir siendo mano «A mí no me dicen» o «Yo no quiero» para engañar.</p>
            </div>
          )}

          {/* ARTÍCULO VI */}
          {(selectedTab === 'todos' || selectedTab === 'art6') && (
            <div className="bg-stone-800/60 p-4 rounded-2xl border border-stone-700 space-y-2">
              <h4 className="font-serif font-bold text-amber-300 text-sm border-b border-stone-700 pb-1">
                ARTÍCULO VI: PARA CONTAR LOS TANTOS
              </h4>
              <p className="text-xs text-stone-300"><strong>Punto 1.</strong> Los envidados y queridos se contarán por el orden correlativo reglamentario: 1. GRANDE, 2. PEQUEÑA (CHICA), 3. PARES, 4. JUEGO o NO JUEGO. En el no juego se anota primero el «no quiero» y luego el tanto de punto.</p>
              <p className="text-xs text-stone-300"><strong>Punto 3.</strong> Una vez contados, apuntados y metidas las cartas en el mazo, no se podrá reclamar ningún tanto omitido.</p>
              <p className="text-xs text-stone-300"><strong>Punto 4 y 5.</strong> Tras la última jugada es OBLIGATORIO enseñar las cuatro cartas de todos los jugadores.</p>
            </div>
          )}

          {/* ARTÍCULO VII, VIII, IX Y EPÍLOGO */}
          {(selectedTab === 'todos' || selectedTab === 'art7' || selectedTab === 'art8') && (
            <div className="bg-stone-800/60 p-4 rounded-2xl border border-stone-700 space-y-2">
              <h4 className="font-serif font-bold text-amber-300 text-sm border-b border-stone-700 pb-1">
                ARTÍCULOS VII, VIII, IX Y EPÍLOGO: PARES, JUEGO Y NO JUEGO
              </h4>
              <p className="text-xs text-stone-300"><strong>Pares (Art. VII):</strong> Es obligatorio rectificar cualquier error de pares antes de los envites. Si se cantaron pares sin tenerlos, la jugada es nula y los rivales cobran sus pares más la negada correspondiente.</p>
              <p className="text-xs text-stone-300"><strong>Juego (Art. VIII):</strong> Ganan las 31 de mano. Si un jugador canta juego sin tenerlo, su jugada es nula y los contrarios cobran su juego más negadas.</p>
              <p className="text-xs text-stone-300"><strong>No Juego (Art. IX):</strong> Cuando los 4 dicen «no juego» pero al descubrirse alguno tiene juego, se anulan los envites a punto y cobra el juego el mejor juego sin negada.</p>
              <div className="p-3 rounded-xl bg-amber-950/50 border border-amber-500/50 text-xs text-amber-200 italic mt-2">
                <strong>Epílogo:</strong> «Solamente las cartas e intuición musística serán los factores que puedan dar el triunfo a una pareja con el reconocimiento de la pareja perdedora. De surgir alguna duda, se resolverá en buena armonía entre los jugadores.»
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="mt-2 pt-3 border-t border-stone-800 flex items-center justify-between">
          <span className="text-[11px] text-stone-400 font-mono">
            Bizkaiko Mus Federakundea • Torneo de Txapeldunes
          </span>
          <button
            onClick={onClose}
            className="px-6 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-black text-xs sm:text-sm transition cursor-pointer"
          >
            ¡Entendido, jugar con este Reglamento!
          </button>
        </div>
      </div>
    </div>
  );
};
