const SRD_API_ROOT = "https://www.dnd5eapi.co/api/2014";
const SRD_SITE_ROOT = "https://www.dnd5eapi.co";

const challengeRatingValues = {
  "0": 0,
  "1/8": 0.125,
  "1/4": 0.25,
  "1/2": 0.5,
  0: 0,
  0.125: 0.125,
  0.25: 0.25,
  0.5: 0.5,
};

const speedLabels = {
  walk: "Caminar",
  fly: "Volar",
  swim: "Nadar",
  burrow: "Excavar",
  climb: "Trepar",
};

const senseLabels = {
  blindsight: "Vista ciega",
  darkvision: "Visión en la oscuridad",
  tremorsense: "Sentido sísmico",
  truesight: "Vista verdadera",
  passive_perception: "Percepción pasiva",
};

const sizeTranslations = {
  Tiny: "Diminuto",
  Small: "Pequeño",
  Medium: "Mediano",
  Large: "Grande",
  Huge: "Enorme",
  Gargantuan: "Gargantuesco",
};

const typeTranslations = {
  aberration: "Aberración",
  beast: "Bestia",
  celestial: "Celestial",
  construct: "Constructo",
  dragon: "Dragón",
  elemental: "Elemental",
  fey: "Feérico",
  fiend: "Infernal",
  giant: "Gigante",
  humanoid: "Humanoide",
  monstrosity: "Monstruosidad",
  ooze: "Cieno",
  plant: "Planta",
  undead: "No muerto",
};

const alignmentTranslations = {
  unaligned: "Sin alineamiento",
  "lawful good": "Legal bueno",
  "neutral good": "Neutral bueno",
  "chaotic good": "Caótico bueno",
  "lawful neutral": "Legal neutral",
  neutral: "Neutral",
  "chaotic neutral": "Caótico neutral",
  "lawful evil": "Legal maligno",
  "neutral evil": "Neutral maligno",
  "chaotic evil": "Caótico maligno",
  "any alignment": "Cualquier alineamiento",
};

const creatureNameTranslations = {
  ape: "Simio",
  "air elemental": "Elemental de aire",
  "black bear": "Oso negro",
  "blink dog": "Perro intermitente",
  boar: "Jabalí",
  "brown bear": "Oso pardo",
  cat: "Gato",
  crocodile: "Cocodrilo",
  "dire wolf": "Lobo terrible",
  "draft horse": "Caballo de tiro",
  "earth elemental": "Elemental de tierra",
  elk: "Alce",
  "fire elemental": "Elemental de fuego",
  "giant badger": "Tejón gigante",
  "giant boar": "Jabalí gigante",
  "giant constrictor snake": "Serpiente constrictora gigante",
  "giant eagle": "Águila gigante",
  "giant elk": "Alce gigante",
  "giant hyena": "Hiena gigante",
  "giant octopus": "Pulpo gigante",
  "giant owl": "Búho gigante",
  "giant spider": "Araña gigante",
  "giant toad": "Sapo gigante",
  "giant vulture": "Buitre gigante",
  lion: "León",
  mastiff: "Mastín",
  owl: "Búho",
  panther: "Pantera",
  pseudodragon: "Pseudodragón",
  rat: "Rata",
  raven: "Cuervo",
  "riding horse": "Caballo de montar",
  sprite: "Sprite",
  tiger: "Tigre",
  "water elemental": "Elemental de agua",
  wolf: "Lobo",
};

let monsterIndexPromise = null;
const monsterDetailsCache = new Map();

function normalizeText(value = "") {
  return value.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

function translateName(name = "") {
  const translated = creatureNameTranslations[normalizeText(name)];
  return translated || name;
}

function translateSize(size = "") {
  return sizeTranslations[size] || size || "Sin tamaño";
}

function translateType(type = "") {
  return typeTranslations[type] || type || "Sin tipo";
}

function translateAlignment(alignment = "") {
  return alignmentTranslations[normalizeText(alignment)] || alignment || "";
}

function translateActionName(name = "") {
  const actionTranslations = {
    bite: "Mordisco",
    claw: "Garra",
    slam: "Golpe",
    multiattack: "Ataque múltiple",
    "fire form": "Forma ígnea",
    whirlwind: "Torbellino",
    engulf: "Engullir",
    touch: "Toque",
  };

  return actionTranslations[normalizeText(name)] || name;
}

function getArmorClassValue(armorClass) {
  if (Array.isArray(armorClass)) {
    const firstEntry = armorClass[0];
    if (typeof firstEntry === "number") return firstEntry;
    return firstEntry?.value ?? "—";
  }

  return armorClass ?? "—";
}

function formatSpeed(speed = {}) {
  const entries = Object.entries(speed);
  if (!entries.length) return "Sin dato";

  return entries
    .map(([key, value]) => `${speedLabels[key] || key} ${String(value).replace(/\.$/, "")}`)
    .join(" · ");
}

function formatSenses(senses = {}) {
  const entries = Object.entries(senses);
  if (!entries.length) return "";

  return entries
    .map(([key, value]) => `${senseLabels[key] || key.replaceAll("_", " ")} ${value}`)
    .join(" · ");
}

function toChallengeRatingValue(challengeRating) {
  if (typeof challengeRating === "number") return challengeRating;
  if (challengeRatingValues[challengeRating] !== undefined) return challengeRatingValues[challengeRating];

  const numericValue = Number(challengeRating);
  return Number.isFinite(numericValue) ? numericValue : 0;
}

export function formatChallengeRating(challengeRating) {
  if (challengeRating === 0.125) return "1/8";
  if (challengeRating === 0.25) return "1/4";
  if (challengeRating === 0.5) return "1/2";
  return String(challengeRating);
}

async function fetchJson(url) {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`La solicitud a ${url} devolvió ${response.status}.`);
  }

  return response.json();
}

async function getMonsterIndex() {
  if (!monsterIndexPromise) {
    monsterIndexPromise = fetchJson(`${SRD_API_ROOT}/monsters`).catch((error) => {
      monsterIndexPromise = null;
      throw error;
    });
  }

  return monsterIndexPromise;
}

async function getMonsterDetails(index) {
  if (!monsterDetailsCache.has(index)) {
    const request = fetchJson(`${SRD_API_ROOT}/monsters/${index}`).catch((error) => {
      monsterDetailsCache.delete(index);
      throw error;
    });

    monsterDetailsCache.set(index, request);
  }

  return monsterDetailsCache.get(index);
}

function formatDamage(action) {
  if (!action?.damage?.length) return "";

  return action.damage
    .map((entry) => {
      const type = translateType(entry.damage_type?.name || "");
      return `${entry.damage_dice || ""} ${type}`.trim();
    })
    .join(" · ");
}

function mapMonsterToCard(monster) {
  const challengeValue = toChallengeRatingValue(monster.challenge_rating);
  const snippet =
    monster.special_abilities?.[0]?.desc ||
    monster.actions?.[0]?.desc ||
    "Sin una descripción breve disponible en la fuente SRD.";

  return {
    index: monster.index,
    name: translateName(monster.name),
    originalName: monster.name,
    size: translateSize(monster.size),
    type: translateType(monster.type),
    typeKey: monster.type,
    alignment: translateAlignment(monster.alignment),
    armorClass: getArmorClassValue(monster.armor_class),
    hitPoints: monster.hit_points,
    hitDice: monster.hit_dice,
    speed: formatSpeed(monster.speed),
    movementModes: Object.keys(monster.speed || {}),
    challengeValue,
    challengeLabel: formatChallengeRating(challengeValue),
    sourceUrl: `${SRD_SITE_ROOT}${monster.url}`,
    imageUrl: monster.image ? `${SRD_SITE_ROOT}${monster.image}` : "",
    snippet,
    traits: (monster.special_abilities || []).slice(0, 2).map((trait) => translateActionName(trait.name)),
    abilityScores: {
      strength: monster.strength,
      dexterity: monster.dexterity,
      constitution: monster.constitution,
      intelligence: monster.intelligence,
      wisdom: monster.wisdom,
      charisma: monster.charisma,
    },
    passivePerception: monster.senses?.passive_perception ?? null,
  };
}

function mapMonsterToDetail(monster) {
  const base = mapMonsterToCard(monster);

  return {
    ...base,
    senses: formatSenses(monster.senses),
    languages: monster.languages || "Sin dato",
    specialAbilities: (monster.special_abilities || []).map((item) => ({
      name: translateActionName(item.name),
      desc: item.desc,
    })),
    actions: (monster.actions || []).map((item) => ({
      name: translateActionName(item.name),
      desc: item.desc,
      attackBonus: item.attack_bonus ?? null,
      damageText: formatDamage(item),
    })),
  };
}

async function getMonsterCardsByIndices(indices) {
  const uniqueIndices = [...new Set(indices)];
  const results = await Promise.allSettled(uniqueIndices.map((index) => getMonsterDetails(index)));

  return results
    .filter((result) => result.status === "fulfilled")
    .map((result) => mapMonsterToCard(result.value));
}

async function searchMonsterIndices(query, limit = 48) {
  const normalizedQuery = normalizeText(query);
  if (!normalizedQuery) return [];

  const response = await getMonsterIndex();
  return response.results
    .filter((monster) => {
      const translatedName = translateName(monster.name);
      return (
        normalizeText(monster.name).includes(normalizedQuery) ||
        normalizeText(translatedName).includes(normalizedQuery)
      );
    })
    .slice(0, limit)
    .map((monster) => monster.index);
}

export async function getCreatureDetail(index) {
  const monster = await getMonsterDetails(index);
  return mapMonsterToDetail(monster);
}

export async function loadWildshapeCards(
  query,
  { maxChallengeRating, featuredIndices, elementalIndices = [], includeElementals = false },
) {
  const indices = query
    ? await searchMonsterIndices(query, 60)
    : [...featuredIndices, ...(includeElementals ? elementalIndices : [])];
  const cards = await getMonsterCardsByIndices(indices);

  return cards
    .filter((creature) => {
      if (creature.typeKey === "beast") return creature.challengeValue <= maxChallengeRating;
      if (includeElementals && creature.typeKey === "elemental") return true;
      return false;
    })
    .sort((first, second) => {
      if (first.typeKey !== second.typeKey) {
        return first.typeKey.localeCompare(second.typeKey);
      }

      if (first.challengeValue !== second.challengeValue) {
        return first.challengeValue - second.challengeValue;
      }

      return first.name.localeCompare(second.name);
    })
    .slice(0, query ? 48 : 24);
}

export async function loadCompanionCards(query, featuredIndices) {
  const indices = query ? await searchMonsterIndices(query, 48) : featuredIndices;
  const cards = await getMonsterCardsByIndices(indices);

  return cards
    .sort((first, second) => {
      if (first.challengeValue !== second.challengeValue) {
        return first.challengeValue - second.challengeValue;
      }

      return first.name.localeCompare(second.name);
    })
    .slice(0, query ? 36 : 24);
}
