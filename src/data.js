export const campaigns = [
  {
    id: 1,
    name: "Las Cenizas del Circo",
    status: "Activa",
    setting: "Fantasía oscura",
    lastSession: "Sesión 12 · hace 3 días",
    summary:
      "Una campaña marcada por secretos, animales liberados, una noble cruel y un pasado que vuelve para cobrarse deudas.",
    focus:
      "El grupo volvió al circo en ruinas y confirmó que alguien retiró jaulas y documentos antes que ellos.",
    nextMove: "Decidir si persiguen el carruaje negro o si vuelven a la capilla para contrastar pistas.",
    stats: [
      { label: "Misiones activas", value: "2" },
      { label: "Secretos vivos", value: "4" },
      { label: "Objetos clave", value: "7" },
      { label: "Notas del diario", value: "18" },
    ],
    accent: "from-amber-500/30 via-orange-500/15 to-rose-500/20",
  },
  {
    id: 2,
    name: "La Corona de Hielo",
    status: "Pausada",
    setting: "Intriga política",
    lastSession: "Sesión 5 · hace 18 días",
    summary:
      "Nobles en guerra fría, pactos viejos y una reliquia que nadie debería encontrar primero.",
    focus:
      "Tres casas compiten por una pieza de hielo vivo vinculada a la corona del reino.",
    nextMove: "Resolver qué facción recibe la información obtenida en el monasterio.",
    stats: [
      { label: "Frentes abiertos", value: "3" },
      { label: "Contactos nobles", value: "8" },
      { label: "Amenazas veladas", value: "5" },
      { label: "Sesiones cerradas", value: "5" },
    ],
    accent: "from-sky-400/25 via-cyan-500/10 to-indigo-500/20",
  },
  {
    id: 3,
    name: "Ruidos Bajo la Montaña",
    status: "Finalizada",
    setting: "Exploración y horror",
    lastSession: "Sesión 21 · finalizada",
    summary:
      "Túneles olvidados, ecos imposibles y una ciudad que respiraba bajo piedra viva.",
    focus:
      "La expedición selló el pozo principal, pero dejó preguntas abiertas sobre lo que despertó abajo.",
    nextMove: "Revisar legado, tesoros y consecuencias a largo plazo para una futura secuela.",
    stats: [
      { label: "Mapas trazados", value: "12" },
      { label: "Reliquias", value: "9" },
      { label: "Bajas evitadas", value: "6" },
      { label: "Sesiones", value: "21" },
    ],
    accent: "from-emerald-400/20 via-lime-400/10 to-stone-400/20",
  },
];

export const characters = [
  {
    name: "Aryn",
    role: "PJ · Druida",
    note: "Lleva el peso de un pasado ligado a un circo cruel. Protege a los animales por encima de todo.",
    tag: "Protagonista",
  },
  {
    name: "Melissandre",
    role: "NPC · Antagonista",
    note: "Elegante, peligrosa y siempre un paso adelante. Su influencia persiste incluso ausente.",
    tag: "Villana",
  },
  {
    name: "Benedicto",
    role: "PJ · Clérigo",
    note: "Voz de fe, calma tensa y sostén del grupo en sus peores decisiones.",
    tag: "Aliado",
  },
  {
    name: "Lía del Sauce",
    role: "NPC · Informante",
    note: "Sabe moverse entre carrozas, establos y cuchicheos de feria sin llamar la atención.",
    tag: "Red de apoyo",
  },
];

export const quests = [
  {
    title: "Encontrar el carruaje negro",
    status: "Activa",
    detail: "Se vio partir al amanecer hacia el bosque viejo con jaulas cubiertas por lona.",
  },
  {
    title: "Descifrar el diario del domador",
    status: "Investigando",
    detail: "Varias páginas están arrancadas. La tinta parece reaccionar al fuego feérico.",
  },
  {
    title: "Liberar a los cautivos del pabellón este",
    status: "Completada",
    detail: "El grupo logró sacar a tres bestias y una niña con marcas rituales en el cuello.",
  },
];

export const locations = [
  {
    title: "Circo Volánther",
    type: "Locación clave",
    detail: "Carpas rojas, barro negro y música donde no debería haberla.",
  },
  {
    title: "Bosque del Sauce Hueco",
    type: "Zona visitada",
    detail: "Hay huellas de carros, restos de fogatas y símbolos tallados en corteza húmeda.",
  },
  {
    title: "Capilla de San Telmo",
    type: "Refugio",
    detail: "Pocos la visitan, pero adentro siempre parece haber alguien esperando.",
  },
];

export const knowledge = [
  {
    title: "Solo Aryn sabe esto",
    text: "Fue él quien liberó a los animales la noche del incendio.",
    kind: "Privado",
  },
  {
    title: "Conocimiento del grupo",
    text: "Melissandre sigue viva y todavía mueve gente desde las sombras.",
    kind: "Grupo",
  },
  {
    title: "Rumor",
    text: "Dicen que el carruaje negro cruza pueblos sin dejar huellas en el barro.",
    kind: "Rumor",
  },
];

export const sessions = [
  {
    title: "Sesión 12 · La carpa vacía",
    detail: "El grupo volvió al terreno del circo y encontró huellas recientes, una jaula rota y un nombre repetido en las lonas.",
  },
  {
    title: "Sesión 11 · Cenizas en el barro",
    detail: "Descubrieron que uno de los sobrevivientes del incendio seguía trabajando para la misma mujer.",
  },
  {
    title: "Sesión 10 · El domador mentía",
    detail: "Una conversación a media luz confirmó que el incendio no había sido un accidente.",
  },
];

export const inventory = [
  { name: "Amuleto de hueso", meta: "Objeto personal", holder: "Aryn" },
  { name: "Llave de hierro ennegrecida", meta: "Objeto de misión", holder: "Grupo" },
  { name: "312 de oro", meta: "Tesoro compartido", holder: "Grupo" },
  { name: "Mapa quemado del circo", meta: "Pista", holder: "Lía del Sauce" },
];

export const navItems = [
  { id: "dashboard", label: "Resumen" },
  { id: "characters", label: "Personajes" },
  { id: "quests", label: "Misiones" },
  { id: "locations", label: "Locaciones" },
  { id: "knowledge", label: "Conocimiento" },
  { id: "sessions", label: "Sesiones" },
  { id: "inventory", label: "Objetos" },
  { id: "creatures", label: "Mascotas" },
];

export const journalPlaceholders = {
  1: [
    "Sesión 12. La carpa vacía no estaba abandonada: alguien llegó antes, revisó jaulas y dejó huellas recientes sobre el barro quemado.",
    "Melissandre no está ausente. Está presente en cada rastro que alguien intenta borrar antes de que el grupo llegue.",
    "Aryn evitó contar toda la verdad sobre la noche del incendio. La reacción al ver las cadenas fue demasiado personal.",
  ],
  2: [
    "Las familias nobles miden cada palabra. Ninguna quiere mostrar necesidad, pero todas temen la reliquia.",
    "El monje guardián no mintió: ocultó la mitad del juramento para proteger el sello de hielo.",
    "La próxima sesión debería empezar con una audiencia, no con combate. La tensión está en la mesa, no en el mapa.",
  ],
  3: [
    "Bajo la montaña no había silencio: había respiración. El eco respondía con intención.",
    "Sellar la grieta no resolvió el origen. Solo ganó tiempo para que la superficie olvide.",
    "Quedó suficiente material para volver con una campaña secuela basada en culto, minería y memoria distorsionada.",
  ],
};

export const featuredTransformationIndices = [
  "cat",
  "badger",
  "bat",
  "eagle",
  "owl",
  "wolf",
  "panther",
  "boar",
  "goat",
  "black-bear",
  "elk",
  "ape",
  "crocodile",
  "constrictor-snake",
  "poisonous-snake",
  "quipper",
  "hunter-shark",
  "reef-shark",
  "giant-owl",
  "giant-eagle",
  "giant-badger",
  "giant-boar",
  "brown-bear",
  "lion",
  "giant-spider",
  "giant-toad",
  "giant-octopus",
  "giant-shark",
  "giant-constrictor-snake",
  "giant-poisonous-snake",
  "giant-crocodile",
  "giant-vulture",
  "giant-elk",
  "polar-bear",
  "giant-ape",
  "dire-wolf",
  "tiger",
];

export const featuredElementalIndices = [
  "air-elemental",
  "earth-elemental",
  "fire-elemental",
  "water-elemental",
];

export const featuredCompanionIndices = [
  "badger",
  "bat",
  "baboon",
  "cat",
  "camel",
  "crab",
  "deer",
  "frog",
  "goat",
  "hawk",
  "jackal",
  "lizard",
  "mastiff",
  "mule",
  "octopus",
  "wolf",
  "panther",
  "owl",
  "raven",
  "hawk",
  "blood-hawk",
  "pony",
  "poisonous-snake",
  "quipper",
  "rat",
  "giant-rat",
  "riding-horse",
  "draft-horse",
  "warhorse",
  "sea-horse",
  "giant-sea-horse",
  "weasel",
  "giant-weasel",
  "pseudodragon",
  "blink-dog",
  "giant-owl",
  "giant-eagle",
  "giant-badger",
  "ape",
  "sprite",
];
