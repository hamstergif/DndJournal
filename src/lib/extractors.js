function normalizeText(value = "") {
  return value.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

const missionSignals = [
  "encontrar",
  "buscar",
  "investigar",
  "rescatar",
  "salvar",
  "recuperar",
  "hablar con",
  "seguir",
  "derrotar",
  "descifrar",
  "explorar",
  "proteger",
  "llevar",
];

const knowledgeSignals = [
  "rumor",
  "secreto",
  "descubri",
  "sabemos",
  "pista",
  "importante",
  "revelo",
  "revelo",
  "dice que",
  "aparentemente",
  "confirma",
  "confirmo",
];

const locationSignals = [
  "bosque",
  "capilla",
  "circo",
  "castillo",
  "taberna",
  "torre",
  "ruinas",
  "cueva",
  "templo",
  "camino",
  "aldea",
  "ciudad",
  "fortaleza",
  "cripta",
  "carpa",
];

const inventorySignals = [
  "llave",
  "amuleto",
  "espada",
  "lanza",
  "daga",
  "oro",
  "gema",
  "mapa",
  "diario",
  "pergamino",
  "reliquia",
  "anillo",
  "carta",
  "frasco",
  "pocion",
  "jaula",
];

const stopNames = new Set([
  "El",
  "La",
  "Los",
  "Las",
  "Un",
  "Una",
  "Al",
  "Del",
  "En",
  "Desde",
  "Hacia",
  "Durante",
  "Luego",
  "Pero",
  "Aunque",
  "Cuando",
  "Sesion",
]);

function toSentences(noteText) {
  return noteText
    .split(/\n+/)
    .flatMap((line) =>
      line
        .split(/(?<=[\.\!\?])\s+/)
        .map((entry) => entry.trim())
        .filter((entry) => entry.length > 12),
    );
}

function extractProperNames(line) {
  const matches = line.match(/[A-ZÁÉÍÓÚÑ][a-záéíóúñ]+(?:\s+[A-ZÁÉÍÓÚÑ][a-záéíóúñ]+){0,2}/g) || [];
  return matches.filter((name) => !stopNames.has(name));
}

function extractLocationTitle(line) {
  const properNames = extractProperNames(line);
  const locationByName = properNames.find((name) => {
    const normalized = normalizeText(name);
    return locationSignals.some((signal) => normalized.includes(signal));
  });

  if (locationByName) return locationByName;

  const byKeyword = locationSignals.find((signal) => normalizeText(line).includes(signal));
  if (!byKeyword) return "";

  const regex = new RegExp(
    `(?:en|hacia|desde|hasta|cerca de|bajo|sobre)\\s+(?:la|el|los|las)?\\s*([A-ZÁÉÍÓÚÑ][^\\.,;:]+)`,
  );
  const match = line.match(regex);
  return match?.[1]?.trim() || line.trim().slice(0, 60);
}

function extractInventoryTitle(line) {
  const normalized = normalizeText(line);
  const keyword = inventorySignals.find((signal) => normalized.includes(signal));
  if (!keyword) return "";

  const words = line.split(/\s+/);
  const keywordIndex = words.findIndex((word) => normalizeText(word).includes(keyword));
  if (keywordIndex === -1) return "";

  return words.slice(Math.max(0, keywordIndex - 2), Math.min(words.length, keywordIndex + 4)).join(" ").replace(/[.,;:]$/, "");
}

function formatTitleFromLine(line, fallback) {
  const cleanLine = line.replace(/^[-*]\s*/, "").trim();
  if (!cleanLine) return fallback;
  return cleanLine.length > 72 ? `${cleanLine.slice(0, 69).trim()}...` : cleanLine;
}

export function extractStructuredSuggestions(noteText, existingData) {
  const sentences = toSentences(noteText);
  const taken = {
    characters: new Set((existingData.characters || []).map((item) => normalizeText(item.name))),
    quests: new Set((existingData.quests || []).map((item) => normalizeText(item.title))),
    locations: new Set((existingData.locations || []).map((item) => normalizeText(item.title))),
    knowledge: new Set((existingData.knowledge || []).map((item) => normalizeText(item.title))),
    inventory: new Set((existingData.inventory || []).map((item) => normalizeText(item.name))),
  };

  const suggestions = [];
  const seen = new Set();

  for (const line of sentences) {
    const normalized = normalizeText(line);

    const pushSuggestion = (kind, title, detail = line) => {
      const normalizedTitle = normalizeText(title);
      if (!normalizedTitle) return;
      if (taken[kind].has(normalizedTitle)) return;

      const key = `${kind}:${normalizedTitle}`;
      if (seen.has(key)) return;
      seen.add(key);

      suggestions.push({
        id: key,
        kind,
        title,
        detail,
        sourceLine: line,
      });
    };

    if (missionSignals.some((signal) => normalized.includes(signal))) {
      pushSuggestion("quests", formatTitleFromLine(line, "Nueva misión"));
    }

    if (knowledgeSignals.some((signal) => normalized.includes(signal))) {
      pushSuggestion("knowledge", formatTitleFromLine(line, "Conocimiento importante"));
    }

    if (locationSignals.some((signal) => normalized.includes(signal))) {
      pushSuggestion("locations", extractLocationTitle(line) || formatTitleFromLine(line, "Nueva locación"));
    }

    if (inventorySignals.some((signal) => normalized.includes(signal))) {
      pushSuggestion("inventory", extractInventoryTitle(line) || formatTitleFromLine(line, "Nuevo objeto"));
    }

    const properNames = extractProperNames(line);
    for (const name of properNames) {
      if (name.split(" ").length <= 3 && !locationSignals.some((signal) => normalizeText(name).includes(signal))) {
        pushSuggestion("characters", name, line);
      }
    }
  }

  return suggestions.slice(0, 12);
}
