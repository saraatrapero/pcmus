export interface CharacterInfo {
  id: string;
  name: string;
  realName: string;
  presentation: string;
  description: string;
  role: string;
  aggressiveness: number; // 0.1 to 0.9
  bluffRate: number; // 0.1 to 0.9
  dialogs: {
    mus: string[];
    noMus: string[];
    envido: string[];
    ordago: string[];
    quiero: string[];
    noQuiero: string[];
    win: string[];
    lose: string[];
    señaSent: string[];
    señaSeen: string[];
  };
  visual: {
    bgColor: string;
    badgeColor: string;
    tag: string;
    emoji: string;
  };
}

export const PC_MUS_CHARACTERS: CharacterInfo[] = [
  {
    id: 'tio_gil',
    name: 'Tío Gil',
    realName: 'Jesús Gil y Gil',
    presentation: 'Y yo soy el tío Gil y tal y tal',
    description: 'Empresario y alcalde marbellí. Famoso por sus baños en jacuzzi, sus fichajes sonados y sus arrebatos en las mesas de juego.',
    role: 'Magnate de Marbella',
    aggressiveness: 0.85,
    bluffRate: 0.65,
    dialogs: {
      mus: [
        '¡Venga, mus y tal y tal!',
        'A repartir otra vez, que esto no me gusta.',
        'Mus, pero rapidito que tengo junta de accionistas.'
      ],
      noMus: [
        '¡Aquí no hay mus que valga!',
        '¡Corto el mus y tal y tal!',
        '¡Se acabó el recreo, a jugar!'
      ],
      envido: [
        '¡Dos piedras y tal y tal!',
        '¡Envido! ¡Que se vea el poderío marbellí!',
        '¡Envido dos más, que para eso hay parné!'
      ],
      ordago: [
        '¡¡ÓRDAGO Y TAL Y TAL!! ¡A la piscina todos!',
        '¡Órdago con dos bemoles! ¡A ver quién me tose!',
        '¡El órdago de mi vida! ¡Aquí se acaba la farsa!'
      ],
      quiero: [
        '¡Quiero! ¡A mí no me achanta nadie!',
        '¡Quiero y veo lo que traes!',
        '¡Venga ese quiero!'
      ],
      noQuiero: [
        'Paso de rollos, me guardo para la siguiente.',
        'No quiero, que hoy me pillas templado.',
        'Por una vez te la paso... ¡pero ojo al piojo!'
      ],
      win: [
        '¡Qué gran victoria y tal y tal! ¡Esto lo celebro en Puerto Banús!',
        '¡El Atlético gana siempre!'
      ],
      lose: [
        '¡Esto es una conspiración de la federación y los árbitros!',
        '¡Menudo atraco a mano armada!'
      ],
      señaSent: [
        '*Tío Gil hace un guiño exagerado mientras enciende un puro*',
        '*Mueve las cejas como dos orugas en el jacuzzi*'
      ],
      señaSeen: [
        '¡He visto esa seña y tal y tal! ¡No me seais golfos!',
        '¡Eh, que os he cazado el teatrillo!'
      ]
    },
    visual: {
      bgColor: 'from-amber-600 to-amber-900',
      badgeColor: 'bg-amber-500 text-stone-900',
      tag: '¡Y TAL Y TAL!',
      emoji: '🏊‍♂️'
    }
  },
  {
    id: 'el_marques',
    name: 'El Marqués',
    realName: 'Mario Conde',
    presentation: 'Yo soy el Marqués y tengo muy mal perder',
    description: 'El banquero más elegante de los 90. Gomina impecable, traje a medida y una frialdad matemática para calcular probabilidades de cartas.',
    role: 'Banquero Elegante',
    aggressiveness: 0.55,
    bluffRate: 0.4,
    dialogs: {
      mus: [
        'La prudencia financiera aconseja... mus.',
        'Acepto nuevo reparto de liquidez.',
        'Mus. Reestructuremos la cartera de naipes.'
      ],
      noMus: [
        'No hay mus. El mercado está maduro.',
        'Corto la negociación. Se juega.',
        'Basta de concesiones: ¡no hay mus!'
      ],
      envido: [
        'Envido con solvencia contrastada.',
        'Pongo dos piedras sobre el balance.',
        'Subo la apuesta dos puntos porcentuales.'
      ],
      ordago: [
        '¡Órdago absoluto! OPA hostil a la mesa.',
        '¡Órdago! Quien no arriesga no dirige un banco.',
        'Todo o nada. Así se ganan los imperios.'
      ],
      quiero: [
        'Acepto la transacción: ¡Quiero!',
        'Operación aprobada. Quiero.',
        'Veamos tus cartas, no me impresionas.'
      ],
      noQuiero: [
        'Riesgo no rentable. No quiero.',
        'Prefiero amortizar una pérdida menor. No voy.',
        'Desestimo la propuesta.'
      ],
      win: [
        'Impecable ejecución estratégica. El éxito era inevitable.',
        'La banca siempre gana, caballeros.'
      ],
      lose: [
        '¡Inadmisible! ¡Tengo muy mal perder y esto no se quedará así!',
        '¡Un descalabro financiero intolerable!'
      ],
      señaSent: [
        '*El Marqués se recoloca la gomina con un guiño imperceptible*',
        '*Muerde con finura su labio inferior mirando al horizonte*'
      ],
      señaSeen: [
        'He detectado una flagrante irregularidad gestual entre ustedes.',
        'Esa seña es contraria a la ley del juego.'
      ]
    },
    visual: {
      bgColor: 'from-blue-700 to-indigo-950',
      badgeColor: 'bg-cyan-400 text-stone-900',
      tag: 'MAL PERDER',
      emoji: '💼'
    }
  },
  {
    id: 'el_isidoro',
    name: 'El Isidoro',
    realName: 'Felipe González',
    presentation: 'Yo soy Isidoro el descamisado',
    description: 'Veterano estadista en pana y vaqueros. Gran dialéctica, pausado, reflexivo y capaz de darle la vuelta a un lance con un discurso magistral.',
    role: 'El Descamisado',
    aggressiveness: 0.5,
    bluffRate: 0.35,
    dialogs: {
      mus: [
        'Por consiguiente... pidamos mus.',
        'Conviene modernizar la mano; mus.',
        'El consenso pasa por darnos mus.'
      ],
      noMus: [
        'No hay mus. Ha llegado el momento del cambio.',
        'Por consiguiente, corto el mus.',
        'España no puede esperar más: ¡se juega!'
      ],
      envido: [
        'Envido dos piedras con sentido de Estado.',
        'Dos más, por responsabilidad histórica.',
        'Aceptemos el reto: envido.'
      ],
      ordago: [
        '¡Órdago! ¡El pueblo español decide aquí y ahora!',
        '¡Por consiguiente: ÓRDAGO!',
        'Un órdago para clarificar el panorama.'
      ],
      quiero: [
        'Asumo la responsabilidad: ¡Quiero!',
        'Por consiguiente, quiero verlas.',
        'Adelante, acepto la consulta.'
      ],
      noQuiero: [
        'Hay que saber retirarse a tiempo. No quiero.',
        'No procede entrar en esta espiral. No quiero.',
        'Prudencia democrática: no voy.'
      ],
      win: [
        'Por consiguiente, hemos ganado por abrumadora mayoría.',
        'Un gran triunfo para la concordia y el progreso.'
      ],
      lose: [
        'Acepto el veredicto con dignidad... pero volveremos a gobernar la mesa.',
        'La oposición ha jugado sus cartas, nada más.'
      ],
      señaSent: [
        '*Isidoro alza una ceja reflexivamente mientras da una calada imaginaria*',
        '*Muestra la punta de la lengua con aire intelectual*'
      ],
      señaSeen: [
        'Por consiguiente, he presenciado un guiño nada protocolario.',
        '¡Ese tic de la boca no cuela en este Parlamento!'
      ]
    },
    visual: {
      bgColor: 'from-red-700 to-rose-950',
      badgeColor: 'bg-rose-400 text-stone-900',
      tag: 'POR CONSIGUIENTE',
      emoji: '🌹'
    }
  },
  {
    id: 'tio_mateo',
    name: 'Tío Mateo',
    realName: 'José María Ruiz-Mateos',
    presentation: 'Aquí está el rey del juego, me llaman tío Mateo',
    description: 'El empresario del disfraz y la abeja. Capaz de cantar órdagos a grito pelado y desafiar a cualquier ministro en la mesa de juego.',
    role: 'El Rey de la Abeja',
    aggressiveness: 0.9,
    bluffRate: 0.75,
    dialogs: {
      mus: [
        '¡Mus para mis hijitos y mis abejitas!',
        'Mus, que el imperio Rumasa necesita liquidez.',
        'Mus, pero que nadie toque mis empresas.'
      ],
      noMus: [
        '¡¡QUE TE PEGO, LECHE!! ¡No hay mus!',
        '¡Corto el mus! ¡Aquí mando yo!',
        '¡Ni un solo descarte más! ¡A la batalla!'
      ],
      envido: [
        '¡Envido con dos alas de abeja obrera!',
        '¡Dos piedras por la justicia divina!',
        '¡Envido, y tiemblen los ministros!'
      ],
      ordago: [
        '¡¡ÓRDAGO DE SUPERMÁN!! ¡¡QUE TE PEGO, LECHE!!',
        '¡Órdago con todo el holding Rumasa detrás!',
        '¡A pecho descubierto! ¡¡ÓRDAGO!!'
      ],
      quiero: [
        '¡¡Quiero!! ¡A mí no me amedrenta el fiscal general!',
        '¡Quiero y te demuestro quién es el rey!',
        '¡Aceptado con orgullo y fe!'
      ],
      noQuiero: [
        '¡Expropiadores! Por esta vez me retiro.',
        'No quiero, que huele a trampa estatal.',
        'Paso, pero preparo la querella.'
      ],
      win: [
        '¡¡Victoria de la verdad y de Rumasa!! ¡Justicia!',
        '¡Aquí está el rey del juego, nadie me tose!'
      ],
      lose: [
        '¡¡Conspiración! ¡Esto ha sido una expropiación en toda regla!',
        '¡Me vestiré de presidiario para la revancha!'
      ],
      señaSent: [
        '*Tío Mateo tuerce la boca de forma estrambótica*',
        '*Abre y cierra los ojos como Supermán a punto de volar*'
      ],
      señaSeen: [
        '¡¡TE HE VISTO LA SEÑA, LECHE!! ¡¡QUE TE PEGO!!',
        '¡Una seña ilegal! ¡Llamen al juez!'
      ]
    },
    visual: {
      bgColor: 'from-yellow-600 to-amber-950',
      badgeColor: 'bg-yellow-400 text-stone-900',
      tag: '¡QUE TE PEGO!',
      emoji: '🐝'
    }
  },
  {
    id: 'dona_norma',
    name: 'Doña Norma',
    realName: 'Norma Duval',
    presentation: 'Soy Norma, poco cerebro y siempre en forma',
    description: 'La gran vedette de revista y televisión. Lentejuelas, glamour, sonrisas deslumbrantes y una destreza sorprendente jugando a la chica y al juego.',
    role: 'La Gran Vedette',
    aggressiveness: 0.45,
    bluffRate: 0.3,
    dialogs: {
      mus: [
        '¡Ay cariño, mus para retocarme las plumas!',
        'Mus, que necesito cartas más monas.',
        'Un poquito de mus con glamour, por favor.'
      ],
      noMus: [
        '¡Se abre el telón! ¡No hay mus, bombones!',
        '¡Corto el mus, que empieza el espectáculo!',
        '¡A jugar, que las plumas no esperan!'
      ],
      envido: [
        '¡Envido con mucha clase y mucho brillo!',
        'Dos piedrecitas para el joyero.',
        '¡Envido, corazón!'
      ],
      ordago: [
        '¡¡ÓRDAGO de vedette!! ¡Arriba el telón!',
        '¡Un órdago con todas las luces encendidas!',
        '¡A escena completa! ¡Órdago!'
      ],
      quiero: [
        '¡Quiero, mi amor! ¡No me asustas nada!',
        '¡Quiero y bailo un pasodoble!',
        '¡Adelante, vamos a verlas!'
      ],
      noQuiero: [
        'Uy no, esa jugada no me combina con el vestido.',
        'Paso, bombón. No quiero arriesgar.',
        'Una retirada a tiempo es pura elegancia.'
      ],
      win: [
        '¡Beso, aplausos y flores para la ganadora!',
        '¡Siempre en forma y siempre reina de la pista!'
      ],
      lose: [
        '¡Qué poco caballeroso hacerme perder a mí!',
        'En fin, lo importante es lucir impecable.'
      ],
      señaSent: [
        '*Doña Norma lanza un beso al aire y parpadea seductora*',
        '*Muerde el labio con una pícara sonrisa de vedette*'
      ],
      señaSeen: [
        '¡Uy, cariño, ese gesto ha sido más evidente que mi escote!',
        '¡Te pillé la seña, pillo!'
      ]
    },
    visual: {
      bgColor: 'from-fuchsia-600 to-pink-950',
      badgeColor: 'bg-pink-400 text-stone-900',
      tag: 'SIEMPRE EN FORMA',
      emoji: '💃'
    }
  },
  {
    id: 'senorita_rosa',
    name: 'Señorita Rosa',
    realName: 'Rossy de Palma',
    presentation: 'Yo soy Rosita, la más lista y la más bonita',
    description: 'Musa del cine vanguardista y la moda de pasarela. Carismática, audaz, con un perfil picassiano y jugadas llenas de ingenio y desparpajo.',
    role: 'Musa Vanguardista',
    aggressiveness: 0.6,
    bluffRate: 0.5,
    dialogs: {
      mus: [
        '¡Mus! Que estas cartas son un bodrio surrealista.',
        'Mus, cariño, que necesito inspiración.',
        'Dame mus antes de que monte un drama de Almodóvar.'
      ],
      noMus: [
        '¡No hay mus! ¡Que empiece la movida!',
        'Corto el mus. Estoy divina para jugar.',
        '¡Basta de charla y a los naipes!'
      ],
      envido: [
        '¡Envido con todo mi arte y mi perfil!',
        'Dos piedras porque lo valgo y punto.',
        '¡Envido! A ver quién tiene narices.'
      ],
      ordago: [
        '¡¡ÓRDAGO de diseño!! ¡A morir en la pasarela!',
        '¡¡ÓRDAGO!! ¡Mujeres al borde de un ataque de mus!',
        '¡Todo o nada, que para medias tintas ya están otros!'
      ],
      quiero: [
        '¡Quiero! ¡Que yo de miedo no entiendo!',
        '¡Quiero! Enséñame tu obra de arte.',
        '¡Adelante, acepto el reto!'
      ],
      noQuiero: [
        'Cariño, ese farol no tiene estilo. No quiero.',
        'Paso, que hoy no estoy para mamarrachadas.',
        'No quiero, prefiero guardar la compostura.'
      ],
      win: [
        '¡Os lo dije! ¡La más lista y la más bonita!',
        '¡Esto es arte moderno, señores!'
      ],
      lose: [
        '¡Menuda tragedia de vestuario! Me voy a París.',
        'Bueno, da igual, el glamour lo pongo yo.'
      ],
      señaSent: [
        '*Rosita tuerce los labios con pose de alta costura*',
        '*Muestra una sonrisa picassiana levantando ambas cejas*'
      ],
      señaSeen: [
        '¡Menudo cuadro! ¡Te he visto la seña desde el museo del Prado!',
        '¡Ese ojo guiñado lo ha visto toda España, cariño!'
      ]
    },
    visual: {
      bgColor: 'from-emerald-600 to-teal-950',
      badgeColor: 'bg-emerald-400 text-stone-900',
      tag: 'LA MÁS LISTA',
      emoji: '🎨'
    }
  },
  {
    id: 'cabo_don_luis',
    name: 'Cabo Don Luis',
    realName: 'Luis Roldán',
    presentation: 'Yo soy el cabo D. Luis ¡jo***!',
    description: 'El ex-director de la Benemérita con maletines en Laos. Nervioso, desconfiado, farolero consumado con un ojo puesto en la puerta de salida.',
    role: 'El Cabo a la Fuga',
    aggressiveness: 0.7,
    bluffRate: 0.7,
    dialogs: {
      mus: [
        'Mus, mus... que tengo que hacer una llamada a Vientián.',
        'Mus rápido, antes de que llegue la policía judicial.',
        'Cambiemos de cartas, como quien cambia de pasaporte.'
      ],
      noMus: [
        '¡¡No hay mus, jo***!! ¡A pecho descubierto!',
        '¡Corto el mus! ¡Que aquí no se escapa nadie!',
        '¡Firmes! ¡No hay mus!'
      ],
      envido: [
        '¡Envido dos piedras de los fondos reservados!',
        '¡Envido, jo***! ¡Que todavía queda dinero en la maleta!',
        'Dos más sobre la mesa.'
      ],
      ordago: [
        '¡¡ÓRDAGO, JO***!! ¡O me forro o me voy a Laos!',
        '¡¡Órdago con la maleta entera!!',
        '¡A tumba abierta! ¡Órdago!'
      ],
      quiero: [
        '¡Quiero, jo***! ¡No me asusta ni la Interpol!',
        '¡Quiero! ¡Veamos ese informe!',
        '¡Acepto el desafío!'
      ],
      noQuiero: [
        '¡Me doy a la fuga! No quiero.',
        'No quiero, que esto huele a trampa de los periódicos.',
        'Una retirada estratégica a tiempo salva un millón.'
      ],
      win: [
        '¡¡Ganamos, jo***!! ¡A brindar con champán en París!',
        '¡Los fondos reservados han dado su fruto!'
      ],
      lose: [
        '¡¡Maldición, jo***! ¡Tengo que salir pitando por la frontera!',
        '¡Esto es una encerrona de Interior!'
      ],
      señaSent: [
        '*Don Luis mira a los lados nervioso y guiña un ojo tembloroso*',
        '*Se muerde el labio mientras aprieta su maletín imaginario*'
      ],
      señaSeen: [
        '¡Alto a la autoridad! ¡He visto esa seña, jo***!',
        '¡Pillados con las manos en la masa!'
      ]
    },
    visual: {
      bgColor: 'from-slate-700 to-stone-950',
      badgeColor: 'bg-green-600 text-stone-100',
      tag: '¡JO***!',
      emoji: '🧳'
    }
  },
  {
    id: 'camarero_navarra',
    name: 'El Camarero de Navarra',
    realName: 'Patxi, el Tabernero de Navarra',
    presentation: '¡Aquí está Patxi, el camarero de Navarra! ¡Vino tinto y órdago a la grande!',
    description: 'El alma de la taberna. Boina calada, pañuelo rojo de San Fermín al cuello, delantal blanco y un vozarrón que retumba en toda la merindad. Noble, bruto, amante del juego recio y de cantar órdagos sin temblarle el pulso.',
    role: 'Tabernero de Navarra',
    aggressiveness: 0.8,
    bluffRate: 0.5,
    dialogs: {
      mus: [
        '¡Aúpa! Échame otro vaso de clarete y... ¡mus!',
        'Mus, que con estas cartas no gano ni para los Sanfermines.',
        'Venga, mus y baraja de nuevo, que la cuadrilla tiene sed.'
      ],
      noMus: [
        '¡¡Mecagüen diez!! ¡Aquí no hay mus que valga!',
        '¡Corto el mus! ¡Que empiece el jaleo en el mostrador!',
        '¡Se juega, rediós! ¡A los naipes todo el mundo!'
      ],
      envido: [
        '¡Envido dos piedras de la cuenca de Pamplona!',
        '¡Envido! ¡Que se note la casta de Navarra!',
        '¡Dos piedras más al montón, aúpa!'
      ],
      ordago: [
        '¡¡ÓRDAGO LA GRANDE!! ¡¡POR SAN FERMÍN Y TODA NAVARRA!!',
        '¡¡ÓRDAGO A LA MESA!! ¡¡El que tenga bemoles que lo quiera!!',
        '¡¡A tumba abierta, mecagüen sos!! ¡¡ÓRDAGO!!'
      ],
      quiero: [
        '¡¡Quiero!! ¡A un navarro no se le achanta con farolicos!',
        '¡Quiero y veo lo que traes en esos naipes!',
        '¡Aceptado con dos cojones! ¡Quiero!'
      ],
      noQuiero: [
        'No quiero, que los dineros del bar hay que guardarlos pal pacharán.',
        'Paso por ahora, pero prepárate para la siguiente mano.',
        'No quiero, zagal. Otra vez será.'
      ],
      win: [
        '¡¡Aúpa Navarra!! ¡Esto se celebra con pacharán y chistorra para todos!',
        '¡Gana la casa! ¡Ronda gratis de vino de la bota para la peña!'
      ],
      lose: [
        '¡Mecachis en la mar! Me habéis pillado bien... ¡pero la revancha está servida!',
        '¡Buena jugada, rediós! A la siguiente no te escapas.'
      ],
      señaSent: [
        '*Patxi se ajusta la boina y guiña el ojo con picardía navarra*',
        '*Se atusa el bigote y levanta una ceja con contundencia*'
      ],
      señaSeen: [
        '¡Epa, que te he visto mover las cejas desde detrás de los grifos!',
        '¡Esa seña la ha visto todo el encierro de Pamplona!'
      ]
    },
    visual: {
      bgColor: 'from-red-800 to-stone-950',
      badgeColor: 'bg-red-600 text-white',
      tag: '¡AÚPA NAVARRA!',
      emoji: '🍷'
    }
  },
  {
    id: 'don_julian',
    name: 'Don Julián',
    realName: 'Don Julián el de la Boina',
    presentation: 'Buenas noches. Sesenta años jugando al mus en la taberna y los números no me fallan.',
    description: 'El paisano tradicional de la taberna. Con su boina calada, su vaso de vino y el pan de pueblo, conoce cada seña, los números exactos del juego y no regala ni media piedra.',
    role: 'Maestro Tradicional de Taberna',
    aggressiveness: 0.65,
    bluffRate: 0.4,
    dialogs: {
      mus: [
        'Mus y paciencia, que la noche es joven.',
        'A cortar y repartir, que se enfrían los chatos.',
        'Mus tranquilo de los de toda la vida.'
      ],
      noMus: [
        '¡No hay mus! Que de noche se ven bien las caras.',
        '¡Corto el mus! A ver qué números traéis.',
        '¡Se acabó el mus, a jugar como en el pueblo!'
      ],
      envido: [
        '¡Envido dos más! Con pan y vino se anda el camino.',
        'Dos piedras van... los números cantan solos.',
        '¡Envido! Que no se diga que aflojo.'
      ],
      ordago: [
        '¡¡ÓRDAGO A LA GRANDE!! ¡El pan y el vino encima de la mesa!',
        '¡Órdago con fundamento y todas las de la ley!',
        '¡Aquí se juega el juego entero! ¡Órdago!'
      ],
      quiero: [
        '¡Quiero! Enséñame esos números.',
        '¡Quiero verlos, que a perro viejo no se le engaña!',
        '¡Visto y querido! ¡A ver qué llevas!'
      ],
      noQuiero: [
        'No quiero, que el que espera no desespera.',
        'Paso, que más vale piedra en mano.',
        'Tuyas son... de momento.'
      ],
      win: [
        '¡Los números no engañan! ¡Bien jugado, pareja!',
        '¡Para nosotros los amarracos! ¡Patxi, saca más pan y vino!'
      ],
      lose: [
        '¡Mecachis! Pero la noche de taberna aún es larga.',
        'Bien jugado, mozo. Ya vendrán los pares.'
      ],
      señaSent: [
        'Guiño el ojo disimulando tras la boina...',
        'Me toco el labio con miga de pan...',
        'Miro de reojo las piedras del tanteador...'
      ],
      señaSeen: [
        'He pillado tu seña como agua de mayo.',
        'Recibido, compañero. Los números son nuestros.'
      ]
    },
    visual: {
      bgColor: 'bg-amber-950',
      badgeColor: 'bg-amber-800 text-amber-200 border-amber-600',
      tag: 'TRADICIONAL',
      emoji: '👴'
    }
  }
];

export interface Cameo {
  name: string;
  avatar: string;
  quote: string;
  subquote: string;
  color: string;
}

export const CAMEOS: Record<string, Cameo[]> = {
  ordago: [
    {
      name: 'Chiquito de la Calzada',
      avatar: '🤠',
      quote: '¡¡¡A CAN DE MOR! ¡¡FISTRO PECADOR DE LA PRADERA!! ¡¡AL ATAQUER!!',
      subquote: '¡¡Ese peazo de órdago que me deha patidifuso!! ¡¿Cómo te da cuen?! ¡No puedor, no puedor!',
      color: 'bg-purple-900 border-yellow-400'
    },
    {
      name: 'Karlos Arguiñano',
      avatar: '👨‍🍳',
      quote: '¡Rico, rico y con fundamento!',
      subquote: '¡Menudo órdago han servido en la mesa! ¡A esto le falta un poco de perejil para rematar la jugada!',
      color: 'bg-amber-900 border-amber-400'
    }
  ],
  farol: [
    {
      name: 'Chiquito de la Calzada',
      avatar: '🤠',
      quote: '¡¡Por la gloria de mi madre!! ¡Menudo farol cobarde!',
      subquote: '¡Te mueves más que los precios en el Pryca, pecador!',
      color: 'bg-purple-900 border-yellow-400'
    }
  ],
  win: [
    {
      name: 'Karlos Arguiñano',
      avatar: '👨‍🍳',
      quote: '¡Plato limpio y cinco amarracos al saco!',
      subquote: 'Y ahora un chiste: Dice el camarero... ¿Le ha gustado el mus? ¡Rico, rico!',
      color: 'bg-amber-900 border-amber-400'
    }
  ]
};

export function getCharacterLine(charId: string, dialogType: keyof CharacterInfo['dialogs']): string {
  const char = PC_MUS_CHARACTERS.find((c) => c.id === charId) || PC_MUS_CHARACTERS[0];
  const list = char.dialogs[dialogType];
  if (!list || list.length === 0) return '';
  return list[Math.floor(Math.random() * list.length)];
}

