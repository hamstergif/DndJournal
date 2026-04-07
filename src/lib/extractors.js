function normalizeText(value = "") {
  return value.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

const explicitPatterns = [
  { kind: "characters", pattern: /^(npc|pj|personaje)\s*[:\-]\s*(.+)$/i },
  { kind: "quests", pattern: /^(mision|misión|quest|objetivo)\s*[:\-]\s*(.+)$/i },
  { kind: "locations", pattern: /^(lugar|locacion|locación|sitio)\s*[:\-]\s*(.+)$/i },
  { kind: "knowledge", pattern: /^(pista|rumor|secreto|conocimiento|hecho)\s*[:\-]\s*(.+)$/i },
  { kind: "inventory", pattern: /^(objeto|item|tesoro|loot)\s*[:\-]\s*(.+)$/i },
];

const missionSignals = [
  "objetivo:",
  "tenemos que",
  "hay que",
  "debemos",
  "buscar ",
  "investigar ",
  "rescatar ",
  "recuperar ",
  "derrotar ",
  "seguir ",
  "explorar ",
];

const knowledgeSignals = ["pista:", "rumor:", "secreto:", "hecho:", "dato importante:"];
const locationSignals = ["llegamos a", "fuimos a", "entramos en", "acampamos en"];
const inventorySignals = ["conseguimos", "obtuvimos", "encontramos", "saqueamos"];

function toLines(noteText) {
  return noteText
    .split(/\r?\n+/)
    .map((line) => line.trim())
    .filter((line) => line.length > 4);
}

function cleanTitle(rawTitle) {
  const trimmed = rawTitle.trim().replace(/^[-*]\s*/, "");
  if (!trimmed) return "";

  const [head] = trimmed.split(/[.;]/);
  return head.trim().length > 90 ? `${head.trim().slice(0, 87)}...` : head.trim();
}

function pushSuggestion({
  suggestions,
  seen,
  taken,
  kind,
  title,
  detail,
  sourceLine,
}) {
  const normalizedTitle = normalizeText(title);
  if (!normalizedTitle || taken[kind].has(normalizedTitle)) return;

  const key = `${kind}:${normalizedTitle}`;
  if (seen.has(key)) return;

  seen.add(key);
  suggestions.push({
    id: key,
    kind,
    title,
    detail,
    sourceLine,
  });
}

export function extractStructuredSuggestions(noteText, existingData) {
  const lines = toLines(noteText);
  const taken = {
    characters: new Set((existingData.characters || []).map((item) => normalizeText(item.name))),
    quests: new Set((existingData.quests || []).map((item) => normalizeText(item.title))),
    locations: new Set((existingData.locations || []).map((item) => normalizeText(item.title))),
    knowledge: new Set((existingData.knowledge || []).map((item) => normalizeText(item.title))),
    inventory: new Set((existingData.inventory || []).map((item) => normalizeText(item.name))),
  };

  const suggestions = [];
  const seen = new Set();

  for (const line of lines) {
    let matchedExplicit = false;

    for (const { kind, pattern } of explicitPatterns) {
      const match = line.match(pattern);
      if (!match?.[2]) continue;

      matchedExplicit = true;
      const title = cleanTitle(match[2]);
      pushSuggestion({
        suggestions,
        seen,
        taken,
        kind,
        title,
        detail: match[2].trim(),
        sourceLine: line,
      });
    }

    if (matchedExplicit) continue;

    const normalizedLine = normalizeText(line);

    if (missionSignals.some((signal) => normalizedLine.startsWith(signal))) {
      pushSuggestion({
        suggestions,
        seen,
        taken,
        kind: "quests",
        title: cleanTitle(line),
        detail: line,
        sourceLine: line,
      });
      continue;
    }

    if (knowledgeSignals.some((signal) => normalizedLine.startsWith(signal))) {
      pushSuggestion({
        suggestions,
        seen,
        taken,
        kind: "knowledge",
        title: cleanTitle(line),
        detail: line,
        sourceLine: line,
      });
      continue;
    }

    if (locationSignals.some((signal) => normalizedLine.startsWith(signal))) {
      pushSuggestion({
        suggestions,
        seen,
        taken,
        kind: "locations",
        title: cleanTitle(line.replace(/^(llegamos a|fuimos a|entramos en|acampamos en)\s+/i, "")),
        detail: line,
        sourceLine: line,
      });
      continue;
    }

    if (inventorySignals.some((signal) => normalizedLine.startsWith(signal))) {
      pushSuggestion({
        suggestions,
        seen,
        taken,
        kind: "inventory",
        title: cleanTitle(line),
        detail: line,
        sourceLine: line,
      });
    }
  }

  return suggestions.slice(0, 8);
}
