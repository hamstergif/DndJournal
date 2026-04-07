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

let monsterIndexPromise = null;
const monsterDetailsCache = new Map();

function normalizeText(value = "") {
  return value.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
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
    .map(([key, value]) => `${key.replaceAll("_", " ")} ${value}`)
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
      const type = entry.damage_type?.name || "";
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
    name: monster.name,
    size: monster.size,
    type: monster.type,
    alignment: monster.alignment,
    armorClass: getArmorClassValue(monster.armor_class),
    hitPoints: monster.hit_points,
    hitDice: monster.hit_dice,
    speed: formatSpeed(monster.speed),
    challengeValue,
    challengeLabel: formatChallengeRating(challengeValue),
    sourceUrl: `${SRD_SITE_ROOT}${monster.url}`,
    imageUrl: monster.image ? `${SRD_SITE_ROOT}${monster.image}` : "",
    snippet,
    traits: (monster.special_abilities || []).slice(0, 2).map((trait) => trait.name),
  };
}

function mapMonsterToDetail(monster) {
  const base = mapMonsterToCard(monster);

  return {
    ...base,
    abilityScores: {
      strength: monster.strength,
      dexterity: monster.dexterity,
      constitution: monster.constitution,
      intelligence: monster.intelligence,
      wisdom: monster.wisdom,
      charisma: monster.charisma,
    },
    senses: formatSenses(monster.senses),
    languages: monster.languages,
    specialAbilities: (monster.special_abilities || []).map((item) => ({
      name: item.name,
      desc: item.desc,
    })),
    actions: (monster.actions || []).map((item) => ({
      name: item.name,
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

async function searchMonsterIndices(query, limit = 24) {
  const normalizedQuery = normalizeText(query);
  if (!normalizedQuery) return [];

  const response = await getMonsterIndex();
  return response.results
    .filter((monster) => normalizeText(monster.name).includes(normalizedQuery))
    .slice(0, limit)
    .map((monster) => monster.index);
}

export async function getCreatureDetail(index) {
  const monster = await getMonsterDetails(index);
  return mapMonsterToDetail(monster);
}

export async function loadWildshapeCards(query, maxChallengeRating, featuredIndices) {
  const indices = query ? await searchMonsterIndices(query, 36) : featuredIndices;
  const cards = await getMonsterCardsByIndices(indices);

  return cards
    .filter((creature) => creature.type === "beast" && creature.challengeValue <= maxChallengeRating)
    .sort((first, second) => {
      if (first.challengeValue !== second.challengeValue) {
        return first.challengeValue - second.challengeValue;
      }

      return first.name.localeCompare(second.name);
    })
    .slice(0, 12);
}

export async function loadCompanionCards(query, featuredIndices) {
  const indices = query ? await searchMonsterIndices(query, 24) : featuredIndices;
  const cards = await getMonsterCardsByIndices(indices);

  return cards.sort((first, second) => first.name.localeCompare(second.name)).slice(0, 12);
}
