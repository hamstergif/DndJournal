function normalizeText(value = "") {
  return value
    .toString()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
}

function cleanText(value) {
  const text = value?.toString().trim();
  return text ? text : "";
}

function toNullableInteger(value) {
  if (value === null || value === undefined || value === "") return null;
  const numericValue = Number(String(value).replace(/[^\d.-]/g, ""));
  if (!Number.isFinite(numericValue)) return null;
  return Math.round(numericValue);
}

const CLASS_REFERENCE_MAP = {
  barbarian: { label: "Bárbaro", url: "https://www.dnd5eapi.co/api/2014/classes/barbarian" },
  bard: { label: "Bardo", url: "https://www.dnd5eapi.co/api/2014/classes/bard" },
  cleric: { label: "Clérigo", url: "https://www.dnd5eapi.co/api/2014/classes/cleric" },
  druid: { label: "Druida", url: "https://www.dnd5eapi.co/api/2014/classes/druid" },
  fighter: { label: "Guerrero", url: "https://www.dnd5eapi.co/api/2014/classes/fighter" },
  monk: { label: "Monje", url: "https://www.dnd5eapi.co/api/2014/classes/monk" },
  paladin: { label: "Paladín", url: "https://www.dnd5eapi.co/api/2014/classes/paladin" },
  ranger: { label: "Explorador", url: "https://www.dnd5eapi.co/api/2014/classes/ranger" },
  rogue: { label: "Pícaro", url: "https://www.dnd5eapi.co/api/2014/classes/rogue" },
  sorcerer: { label: "Hechicero", url: "https://www.dnd5eapi.co/api/2014/classes/sorcerer" },
  warlock: { label: "Brujo", url: "https://www.dnd5eapi.co/api/2014/classes/warlock" },
  wizard: { label: "Mago", url: "https://www.dnd5eapi.co/api/2014/classes/wizard" },
};

const CLASS_ALIASES = {
  barbaro: "barbarian",
  barbarian: "barbarian",
  bardo: "bard",
  bard: "bard",
  clerigo: "cleric",
  cleric: "cleric",
  druida: "druid",
  druid: "druid",
  guerrero: "fighter",
  fighter: "fighter",
  monje: "monk",
  monk: "monk",
  paladin: "paladin",
  ranger: "ranger",
  explorador: "ranger",
  picaro: "rogue",
  rogue: "rogue",
  hechicero: "sorcerer",
  sorcerer: "sorcerer",
  brujo: "warlock",
  warlock: "warlock",
  mago: "wizard",
  wizard: "wizard",
};

const RACE_REFERENCE_MAP = {
  dragonborn: { label: "Dracónido", url: "https://www.dnd5eapi.co/api/2014/races/dragonborn" },
  dwarf: { label: "Enano", url: "https://www.dnd5eapi.co/api/2014/races/dwarf" },
  elf: { label: "Elfo", url: "https://www.dnd5eapi.co/api/2014/races/elf" },
  gnome: { label: "Gnomo", url: "https://www.dnd5eapi.co/api/2014/races/gnome" },
  "half-elf": { label: "Semielfo", url: "https://www.dnd5eapi.co/api/2014/races/half-elf" },
  "half-orc": { label: "Semiorco", url: "https://www.dnd5eapi.co/api/2014/races/half-orc" },
  halfling: { label: "Mediano", url: "https://www.dnd5eapi.co/api/2014/races/halfling" },
  human: { label: "Humano", url: "https://www.dnd5eapi.co/api/2014/races/human" },
  tiefling: { label: "Tiefling", url: "https://www.dnd5eapi.co/api/2014/races/tiefling" },
};

const RACE_ALIASES = {
  draconido: "dragonborn",
  dragonborn: "dragonborn",
  enano: "dwarf",
  dwarf: "dwarf",
  elfo: "elf",
  elf: "elf",
  gnomo: "gnome",
  gnome: "gnome",
  semielfo: "half-elf",
  "half elf": "half-elf",
  "half-elf": "half-elf",
  semiorco: "half-orc",
  "half orc": "half-orc",
  "half-orc": "half-orc",
  mediano: "halfling",
  halfling: "halfling",
  humano: "human",
  human: "human",
  tiefling: "tiefling",
};

export async function mergeCharacterDraftWithImport(draft = {}) {
  return {
    name: cleanText(draft.name),
    role_label: cleanText(draft.role_label),
    tag: cleanText(draft.tag),
    summary: cleanText(draft.summary),
    class_name: cleanText(draft.class_name),
    level: toNullableInteger(draft.level),
    race: cleanText(draft.race),
    armor_class: toNullableInteger(draft.armor_class),
    hit_points: toNullableInteger(draft.hit_points),
    speed: cleanText(draft.speed),
    passive_perception: toNullableInteger(draft.passive_perception),
    sheet_reference_url: cleanText(draft.sheet_reference_url),
  };
}

function getReferenceEntry(value, aliases, references) {
  const normalized = normalizeText(value);
  const index = aliases[normalized];
  return index ? references[index] : null;
}

export function getCharacterReferences(character = {}) {
  const references = [];
  const classEntry = getReferenceEntry(character.class_name, CLASS_ALIASES, CLASS_REFERENCE_MAP);
  const raceEntry = getReferenceEntry(character.race, RACE_ALIASES, RACE_REFERENCE_MAP);

  if (classEntry) {
    references.push({
      label: `Clase SRD: ${classEntry.label}`,
      url: classEntry.url,
    });
  }

  if (raceEntry) {
    references.push({
      label: `Raza SRD: ${raceEntry.label}`,
      url: raceEntry.url,
    });
  }

  return references;
}
