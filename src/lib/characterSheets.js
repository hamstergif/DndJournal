let pdfJsPromise = null;

async function getPdfJsLib() {
  if (!pdfJsPromise) {
    pdfJsPromise = Promise.all([
      import("pdfjs-dist/build/pdf.mjs"),
      import("pdfjs-dist/build/pdf.worker.min.mjs?url"),
    ]).then(([pdfjsLib, workerModule]) => {
      pdfjsLib.GlobalWorkerOptions.workerSrc = workerModule.default;
      return pdfjsLib;
    });
  }

  return pdfJsPromise;
}

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

function collapseWhitespace(value = "") {
  return value.toString().replace(/\s+/g, " ").trim();
}

function escapeRegExp(value = "") {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
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

const BASE_STOP_LABELS = [
  "nombre",
  "name",
  "character name",
  "nombre del personaje",
  "clase",
  "class",
  "class & level",
  "class and level",
  "clase y nivel",
  "nivel",
  "level",
  "raza",
  "linaje",
  "race",
  "species",
  "ca",
  "armor class",
  "clase de armadura",
  "ac",
  "pg",
  "hp",
  "hit points",
  "hit point maximum",
  "current hit points",
  "velocidad",
  "speed",
  "percepcion pasiva",
  "percepción pasiva",
  "passive wisdom (perception)",
  "passive perception",
];

function buildEmptyImport() {
  return {
    name: "",
    class_name: "",
    level: null,
    race: "",
    armor_class: null,
    hit_points: null,
    speed: "",
    passive_perception: null,
    sheet_reference_url: "",
    summary: "",
  };
}

function mergeImportValues(base, next) {
  const merged = { ...base };

  for (const [key, value] of Object.entries(next || {})) {
    const hasValue = value !== null && value !== undefined && value !== "";
    if (hasValue) merged[key] = value;
  }

  return merged;
}

function extractLabeledValue(source, labels) {
  const compactSource = collapseWhitespace(source);
  const stopPattern = BASE_STOP_LABELS.map(escapeRegExp).join("|");

  for (const label of labels) {
    const pattern = new RegExp(
      `${escapeRegExp(label)}\\s*[:\\-]\\s*(.+?)(?=\\s(?:${stopPattern})\\s*[:\\-]|$)`,
      "i",
    );
    const match = compactSource.match(pattern);
    if (match?.[1]) return match[1].trim();
  }

  return "";
}

function extractFieldValue(source, labels, stopLabels = []) {
  const compactSource = collapseWhitespace(source);
  if (!compactSource) return "";

  const labelPattern = labels.map(escapeRegExp).join("|");
  const stopPattern = stopLabels.length ? stopLabels.map(escapeRegExp).join("|") : "";
  const pattern = stopPattern
    ? new RegExp(
        `(?:${labelPattern})\\s*[:\\-]?\\s*(.+?)(?=\\s+(?:${stopPattern})\\b|$)`,
        "i",
      )
    : new RegExp(`(?:${labelPattern})\\s*[:\\-]?\\s*(.+)$`, "i");

  const match = compactSource.match(pattern);
  return match?.[1]?.trim() || "";
}

function extractNumericValue(source, labels) {
  const compactSource = collapseWhitespace(source);
  if (!compactSource) return null;

  const labelPattern = labels.map(escapeRegExp).join("|");
  const match = compactSource.match(
    new RegExp(`(?:${labelPattern})\\s*[:\\-]?\\s*(\\d{1,4})`, "i"),
  );

  return match?.[1] ? toNullableInteger(match[1]) : null;
}

function extractSpeedValue(source) {
  const explicitValue = cleanText(extractLabeledValue(source, ["velocidad", "speed"]));
  if (explicitValue) return explicitValue;

  const windowValue = cleanText(
    extractFieldValue(
      source,
      ["speed", "velocidad"],
      [
        "current hit points",
        "hit points",
        "hit point maximum",
        "armor class",
        "initiative",
        "passive wisdom",
        "passive perception",
        "proficiency bonus",
        "hit dice",
        "attacks and spellcasting",
        "personality traits",
      ],
    ),
  );
  if (windowValue) return windowValue;

  const compactSource = collapseWhitespace(source);
  const match = compactSource.match(
    /(?:speed|velocidad)\s*[:\-]?\s*((?:(?:walk|caminar|fly|volar|swim|nadar|climb|trepar|burrow|excavar)\s+)?\d{1,3}\s*(?:ft|feet|pie|pies|m|metros?)(?:\.|)?(?:\s*[,/·]\s*(?:(?:walk|caminar|fly|volar|swim|nadar|climb|trepar|burrow|excavar)\s+)?\d{1,3}\s*(?:ft|feet|pie|pies|m|metros?)(?:\.|)?)*)/i,
  );

  return cleanText(match?.[1] || "");
}

function splitClassAndLevel(value = "") {
  const cleanValue = collapseWhitespace(value)
    .replace(/\b(?:level|lvl\.?|nivel)\b/gi, "")
    .trim();

  if (!cleanValue) {
    return {
      class_name: "",
      level: null,
    };
  }

  const trailingLevelMatch = cleanValue.match(/^(.*?)[\s,/-]+(\d{1,2})$/);
  if (trailingLevelMatch) {
    return {
      class_name: cleanText(trailingLevelMatch[1]),
      level: toNullableInteger(trailingLevelMatch[2]),
    };
  }

  const leadingLevelMatch = cleanValue.match(/^(\d{1,2})[\s,/-]+(.*)$/);
  if (leadingLevelMatch) {
    return {
      class_name: cleanText(leadingLevelMatch[2]),
      level: toNullableInteger(leadingLevelMatch[1]),
    };
  }

  return {
    class_name: cleanText(cleanValue),
    level: null,
  };
}

function parseImportedJson(source) {
  try {
    const parsed = JSON.parse(source);
    const firstClass = Array.isArray(parsed.classes) ? parsed.classes[0] : parsed.class;
    const className =
      parsed.class_name ||
      parsed.className ||
      parsed.class ||
      firstClass?.definition?.name ||
      firstClass?.name ||
      "";
    const level = parsed.level ?? firstClass?.level ?? parsed.currentLevel ?? null;
    const race =
      parsed.race?.fullName ||
      parsed.race?.baseRaceName ||
      parsed.race?.name ||
      parsed.race_name ||
      parsed.raceName ||
      parsed.race ||
      "";
    const armorClass = parsed.armor_class ?? parsed.armorClass ?? parsed.ac ?? null;
    const hitPoints =
      parsed.hit_points ?? parsed.hitPoints ?? parsed.hp ?? parsed.baseHitPoints ?? null;
    const passivePerception =
      parsed.passive_perception ??
      parsed.passivePerception ??
      parsed.passiveWisdomPerception ??
      null;

    let speed = parsed.speed || parsed.walk_speed || "";
    if (!speed && parsed.race?.weightSpeeds?.normal?.walk) {
      speed = `${parsed.race.weightSpeeds.normal.walk} ft.`;
    }

    return {
      name: cleanText(parsed.name),
      class_name: cleanText(className),
      level: toNullableInteger(level),
      race: cleanText(race),
      armor_class: toNullableInteger(armorClass),
      hit_points: toNullableInteger(hitPoints),
      speed: cleanText(speed),
      passive_perception: toNullableInteger(passivePerception),
      sheet_reference_url: cleanText(parsed.url || parsed.sheet_reference_url || parsed.sheetUrl),
      summary: cleanText(parsed.summary || parsed.notes || parsed.note),
    };
  } catch {
    return null;
  }
}

function parseImportedText(source) {
  const rawName =
    cleanText(extractLabeledValue(source, ["nombre", "character name", "name"])) ||
    cleanText(
      extractFieldValue(source, ["character name", "nombre del personaje"], [
        "class & level",
        "class and level",
        "clase y nivel",
        "background",
        "trasfondo",
        "player name",
        "jugador",
        "race",
        "species",
        "raza",
        "linaje",
        "alignment",
      ]),
    );
  const rawClassLevel =
    cleanText(extractLabeledValue(source, ["clase", "class"])) ||
    cleanText(
      extractFieldValue(source, ["class & level", "class and level", "clase y nivel"], [
        "background",
        "trasfondo",
        "player name",
        "jugador",
        "race",
        "species",
        "raza",
        "linaje",
        "alignment",
        "experience points",
      ]),
    );
  const classLevel = splitClassAndLevel(rawClassLevel);
  const rawRace =
    cleanText(extractLabeledValue(source, ["raza", "linaje", "race"])) ||
    cleanText(
      extractFieldValue(source, ["race", "species", "raza", "linaje"], [
        "alignment",
        "experience points",
        "background",
        "trasfondo",
        "player name",
        "jugador",
        "inspiration",
        "proficiency bonus",
      ]),
    );

  return {
    name: rawName,
    class_name: classLevel.class_name,
    level:
      toNullableInteger(extractLabeledValue(source, ["nivel", "level"])) ?? classLevel.level ?? null,
    race: rawRace,
    armor_class:
      toNullableInteger(extractLabeledValue(source, ["armor class", "ca", "ac"])) ??
      extractNumericValue(source, ["armor class", "clase de armadura", "ca", "ac"]),
    hit_points:
      toNullableInteger(
        extractLabeledValue(source, ["hit point maximum", "current hit points", "hit points", "pg", "hp"]),
      ) ??
      extractNumericValue(source, [
        "hit point maximum",
        "current hit points",
        "hit points",
        "puntos de golpe",
        "pg",
        "hp",
      ]),
    speed: extractSpeedValue(source),
    passive_perception:
      toNullableInteger(
        extractLabeledValue(source, ["percepcion pasiva", "percepción pasiva", "passive perception"]),
      ) ??
      extractNumericValue(source, [
        "passive wisdom (perception)",
        "passive perception",
        "percepcion pasiva",
        "percepción pasiva",
      ]),
    sheet_reference_url: cleanText(source.match(/https?:\/\/\S+/)?.[0] || ""),
    summary: "",
  };
}

export function parseCharacterSheetImport(source = "") {
  const cleanSource = source.trim();
  if (!cleanSource) return buildEmptyImport();

  return parseImportedJson(cleanSource) || parseImportedText(cleanSource);
}

async function extractTextFromPdfFile(file) {
  if (!file) return "";

  const pdfjsLib = await getPdfJsLib();
  const pdfBytes = new Uint8Array(await file.arrayBuffer());
  const loadingTask = pdfjsLib.getDocument({ data: pdfBytes });
  const pdf = await loadingTask.promise;
  const pages = [];

  for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber += 1) {
    const page = await pdf.getPage(pageNumber);
    const textContent = await page.getTextContent();
    const text = textContent.items
      .map((item) => item.str)
      .join(" ")
      .replace(/\s+/g, " ")
      .trim();

    if (text) pages.push(text);
  }

  return pages.join("\n");
}

export async function mergeCharacterDraftWithImport(draft = {}) {
  let imported = buildEmptyImport();

  if (draft.sheet_pdf) {
    const pdfText = await extractTextFromPdfFile(draft.sheet_pdf);
    imported = mergeImportValues(imported, parseCharacterSheetImport(pdfText));
  }

  if (draft.sheet_import) {
    imported = mergeImportValues(imported, parseCharacterSheetImport(draft.sheet_import));
  }

  return {
    name: cleanText(draft.name) || imported.name || "",
    role_label: cleanText(draft.role_label) || "",
    tag: cleanText(draft.tag) || "",
    summary: cleanText(draft.summary) || imported.summary || "",
    class_name: cleanText(draft.class_name) || imported.class_name || "",
    level: toNullableInteger(draft.level ?? imported.level),
    race: cleanText(draft.race) || imported.race || "",
    armor_class: toNullableInteger(draft.armor_class ?? imported.armor_class),
    hit_points: toNullableInteger(draft.hit_points ?? imported.hit_points),
    speed: cleanText(draft.speed) || imported.speed || "",
    passive_perception: toNullableInteger(
      draft.passive_perception ?? imported.passive_perception,
    ),
    sheet_reference_url:
      cleanText(draft.sheet_reference_url) || imported.sheet_reference_url || "",
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
