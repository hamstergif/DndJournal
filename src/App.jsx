import React, { startTransition, useDeferredValue, useEffect, useMemo, useState } from "react";
import {
  BookOpen,
  Brain,
  Compass,
  LayoutGrid,
  LogOut,
  MapPin,
  Package,
  PawPrint,
  ScrollText,
  Search,
  Shield,
  Sparkles,
  Swords,
  Users,
} from "lucide-react";
import { BookOverlay } from "./components/BookOverlay";
import { CampaignEditorPanel } from "./components/CampaignEditorPanel";
import { CreatureCard, SavedCreatureCard } from "./components/CreatureCard";
import { CreatureDetailModal } from "./components/CreatureDetailModal";
import { EditableSection } from "./components/EditableSection";
import { LoginScreen } from "./components/LoginScreen";
import { SearchGroupPanel } from "./components/SearchGroupPanel";
import { SectionErrorBoundary } from "./components/SectionErrorBoundary";
import { BadgePill, ButtonPill, MetricCard, Panel, SectionTitle } from "./components/ui";
import {
  featuredCompanionIndices,
  featuredElementalIndices,
  featuredTransformationIndices,
} from "./data";
import {
  getCharacterReferences,
  mergeCharacterDraftWithImport,
} from "./lib/characterSheets";
import { extractStructuredSuggestions } from "./lib/extractors";
import {
  formatChallengeRating,
  getCreatureDetail,
  importCreatureCardFromReference,
  loadCompanionCards,
  loadWildshapeCards,
} from "./lib/srd";
import { downloadTextFile, readStorage, writeStorage } from "./lib/storage";
import { getAuthRedirectUrl, isSupabaseConfigured, supabase } from "./lib/supabase";

const SELECTED_CAMPAIGN_KEY = "dyd-selected-campaign-supabase-v1";

const EMPTY_COLLECTIONS = {
  characters: [],
  quests: [],
  locations: [],
  knowledge: [],
  sessions: [],
  inventory: [],
  savedCreatures: [],
  journalEntries: [],
};

const NAV_ITEMS = [
  { id: "dashboard", label: "Resumen", icon: LayoutGrid },
  { id: "characters", label: "Personajes", icon: Users },
  { id: "quests", label: "Misiones", icon: Swords },
  { id: "locations", label: "Locaciones", icon: MapPin },
  { id: "knowledge", label: "Conocimiento", icon: Brain },
  { id: "sessions", label: "Sesiones", icon: ScrollText },
  { id: "inventory", label: "Objetos", icon: Package },
  { id: "creatures", label: "Mascotas y formas", icon: PawPrint },
];

const QUEST_STATUS_OPTIONS = [
  { value: "active", label: "Activa" },
  { value: "investigating", label: "Investigando" },
  { value: "completed", label: "Completada" },
  { value: "paused", label: "Pausada" },
  { value: "failed", label: "Fallida" },
];

const KNOWLEDGE_KIND_OPTIONS = [
  { value: "group", label: "Grupo" },
  { value: "rumor", label: "Rumor" },
  { value: "fact", label: "Hecho" },
  { value: "private", label: "Privado" },
];

const COLLECTION_TABLES = {
  characters: "characters",
  quests: "quests",
  locations: "locations",
  knowledge: "knowledge_entries",
  sessions: "session_logs",
  inventory: "inventory_items",
};

const CAMPAIGN_STATUS_OPTIONS = [
  { value: "active", label: "Activa" },
  { value: "paused", label: "Pausada" },
  { value: "finished", label: "Finalizada" },
  { value: "archived", label: "Archivada" },
];

const CAMPAIGN_ACCENTS = [
  "from-amber-500/30 via-orange-500/15 to-rose-500/20",
  "from-sky-400/25 via-cyan-500/10 to-indigo-500/20",
  "from-emerald-400/20 via-lime-400/10 to-stone-400/20",
  "from-red-500/25 via-orange-500/15 to-amber-400/20",
  "from-fuchsia-500/20 via-rose-500/10 to-orange-400/20",
];

function normalizeText(value = "") {
  return value
    .toString()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function getEmptyCampaignDraft() {
  return {
    title: "",
    status: "active",
    setting: "",
    summary: "",
    focus: "",
    next_move: "",
    last_session_label: "",
  };
}

function buildCampaignDraft(campaign) {
  if (!campaign) return getEmptyCampaignDraft();

  return {
    title: campaign.title || "",
    status: campaign.status || "active",
    setting: campaign.setting || "",
    summary: campaign.summary || "",
    focus: campaign.focus || "",
    next_move: campaign.next_move || "",
    last_session_label: campaign.last_session_label || "",
  };
}

function getCampaignAccent(seed = "") {
  const normalizedSeed = normalizeText(seed);
  if (!normalizedSeed) return CAMPAIGN_ACCENTS[0];

  const hash = [...normalizedSeed].reduce(
    (accumulator, char) => accumulator + char.charCodeAt(0),
    0,
  );

  return CAMPAIGN_ACCENTS[hash % CAMPAIGN_ACCENTS.length];
}

function getSavedCreatureKindLabel(usageKind) {
  return usageKind === "wildshape" ? "Forma" : "Mascota";
}

function getCampaignStatusLabel(status) {
  return (
    {
      active: "Activa",
      paused: "Pausada",
      finished: "Finalizada",
      archived: "Archivada",
    }[status] || "Activa"
  );
}

function getQuestStatusLabel(status) {
  return (
    {
      active: "Activa",
      investigating: "Investigando",
      completed: "Completada",
      paused: "Pausada",
      failed: "Fallida",
    }[status] || "Activa"
  );
}

function getKnowledgeKindLabel(kind) {
  return (
    {
      group: "Grupo",
      rumor: "Rumor",
      fact: "Hecho",
      private: "Privado",
    }[kind] || "Grupo"
  );
}

function getKnowledgeVisibilityLabel(item) {
  if (item.visibility === "private") return "Solo vos";
  return "Campaña";
}

function getSuggestionKindLabel(kind) {
  return (
    {
      characters: "Personaje",
      quests: "Misión",
      locations: "Locación",
      knowledge: "Conocimiento",
      inventory: "Objeto",
    }[kind] || "Dato"
  );
}

function getSuggestionCreateLabel(kind) {
  return (
    {
      characters: "Crear personaje",
      quests: "Crear misión",
      locations: "Crear locación",
      knowledge: "Guardar conocimiento",
      inventory: "Guardar objeto",
    }[kind] || "Crear"
  );
}

function toNumber(value, fallback = 0) {
  const numericValue = Number(value);
  return Number.isFinite(numericValue) ? numericValue : fallback;
}

function formatDate(dateValue) {
  if (!dateValue) return "Sin fecha";

  try {
    return new Intl.DateTimeFormat("es-AR", {
      year: "numeric",
      month: "short",
      day: "numeric",
    }).format(new Date(dateValue));
  } catch {
    return dateValue;
  }
}

function toDisplayText(value, fallback = "") {
  if (value === null || value === undefined) return fallback;
  if (typeof value === "string") return value;
  if (typeof value === "number") return String(value);
  if (Array.isArray(value)) return value.join(", ");
  if (typeof value === "object") {
    return value.name || value.label || value.title || fallback;
  }
  return fallback;
}

function toDisplayInteger(value) {
  const numericValue = Number(value);
  return Number.isFinite(numericValue) ? Math.round(numericValue) : null;
}

function normalizeCharacterRecord(item = {}) {
  return {
    ...item,
    name: toDisplayText(item.name, "Sin nombre"),
    class_name: toDisplayText(item.class_name),
    level: toDisplayInteger(item.level),
    race: toDisplayText(item.race),
    armor_class: toDisplayInteger(item.armor_class),
    hit_points: toDisplayInteger(item.hit_points),
    speed: toDisplayText(item.speed),
    passive_perception: toDisplayInteger(item.passive_perception),
    role_label: toDisplayText(item.role_label),
    tag: toDisplayText(item.tag),
    summary: toDisplayText(item.summary),
    sheet_reference_url: toDisplayText(item.sheet_reference_url),
  };
}

function normalizeSectionItem(sectionKey, item) {
  if (sectionKey === "characters") {
    return normalizeCharacterRecord(item);
  }

  return item;
}

function normalizeSectionItems(sectionKey, items = []) {
  return sortByOrder(items.map((item) => normalizeSectionItem(sectionKey, item)));
}

function clampLevel(value, minimum = 1, maximum = 20) {
  if (value === null || value === undefined || value === "") {
    return { value: null, overflow: false };
  }

  const numericValue = Number(value);
  if (!Number.isFinite(numericValue)) {
    return { value: null, overflow: false };
  }

  const roundedValue = Math.round(numericValue);
  return {
    value: Math.min(maximum, Math.max(minimum, roundedValue)),
    overflow: roundedValue > maximum,
  };
}

function prepareCharacterForStorage(character = {}) {
  const { value: level, overflow } = clampLevel(character.level, 1, 20);

  return {
    character: {
      ...character,
      level,
    },
    levelOverflow: overflow,
  };
}

function getLevelOverflowMessage() {
  return "JAJ flashaste pa. Nivel 20 y ya estamos negociando con dioses.";
}

function shouldIncludeMoonElementals(level, isMoonDruid) {
  return isMoonDruid && level >= 10;
}

function getMoonWildshapeMaxChallenge(level) {
  if (level >= 18) return 6;
  if (level >= 15) return 5;
  if (level >= 12) return 4;
  if (level >= 9) return 3;
  if (level >= 6) return 2;
  return 1;
}

function getStandardWildshapeMaxChallenge(level) {
  if (level >= 8) return 1;
  if (level >= 4) return 0.5;
  return 0.25;
}

function getWildshapeMaxChallenge(level, isMoonDruid) {
  return isMoonDruid
    ? getMoonWildshapeMaxChallenge(level)
    : getStandardWildshapeMaxChallenge(level);
}

function matchesCreatureMoment(creature, filter) {
  switch (filter) {
    case "tank":
      return (creature.hitPoints || 0) >= 30 || (creature.armorClass || 0) >= 13;
    case "scout":
      return (
        (creature.abilityScores?.dexterity || 0) >= 14 ||
        (creature.passivePerception || 0) >= 13 ||
        creature.movementModes?.includes("climb")
      );
    case "fly":
      return creature.movementModes?.includes("fly");
    case "swim":
      return creature.movementModes?.includes("swim");
    case "climb":
      return creature.movementModes?.includes("climb");
    case "elemental":
      return creature.typeKey === "elemental";
    default:
      return true;
  }
}

function matchesChallengeFilter(creature, filter) {
  if (!filter || filter === "any" || filter === "compatible") return true;
  return creature.challengeLabel === filter;
}

function sortCreatures(items, sortBy) {
  return [...items].sort((first, second) => {
    switch (sortBy) {
      case "hp":
        return (second.hitPoints || 0) - (first.hitPoints || 0) || first.name.localeCompare(second.name);
      case "ac":
        return (second.armorClass || 0) - (first.armorClass || 0) || first.name.localeCompare(second.name);
      case "name":
        return first.name.localeCompare(second.name);
      case "cr":
      default:
        if (first.challengeValue !== second.challengeValue) {
          return first.challengeValue - second.challengeValue;
        }

        return first.name.localeCompare(second.name);
    }
  });
}

function mapSavedCreatureRow(row) {
  const challengeValue = row.challenge_value ?? 0;

  return {
    id: row.id,
    index: row.source_index,
    usageKind: row.usage_kind,
    name: row.name,
    type: row.creature_type || "Sin tipo",
    size: row.size || "Sin tamano",
    alignment: row.alignment || "",
    armorClass: row.armor_class ?? "-",
    hitPoints: row.hit_points ?? "-",
    hitDice: row.hit_dice || "-",
    speed: row.speed || "Sin movimiento",
    challengeValue,
    challengeLabel: row.challenge_label || formatChallengeRating(challengeValue),
    sourceUrl: row.source_url || "",
    imageUrl: row.image_url || "",
    snippet: row.snippet || "Sin descripcion guardada.",
    traits: Array.isArray(row.traits) ? row.traits : [],
    notes: row.notes || "",
  };
}

function sortByOrder(items) {
  return [...items].sort((first, second) => {
    if ((first.sort_order ?? 0) !== (second.sort_order ?? 0)) {
      return (first.sort_order ?? 0) - (second.sort_order ?? 0);
    }

    return new Date(first.created_at || 0).getTime() - new Date(second.created_at || 0).getTime();
  });
}

function swapItems(items, itemId, direction) {
  const currentIndex = items.findIndex((item) => item.id === itemId);
  if (currentIndex === -1) return items;

  const nextIndex = direction === "up" ? currentIndex - 1 : currentIndex + 1;
  if (nextIndex < 0 || nextIndex >= items.length) return items;

  const reordered = [...items];
  [reordered[currentIndex], reordered[nextIndex]] = [reordered[nextIndex], reordered[currentIndex]];

  return reordered.map((item, index) => ({
    ...item,
    sort_order: index,
  }));
}

function createSearchGroups(query, collections, journalBody) {
  const normalizedQuery = normalizeText(query);
  if (!normalizedQuery) return [];

  const groups = [
    {
      title: "Personajes",
      icon: Users,
      items: collections.characters
        .filter((item) =>
          [
            item.name,
            item.role_label,
            item.tag,
            item.summary,
            item.class_name,
            item.race,
            item.speed,
          ]
            .filter(Boolean)
            .some((value) => normalizeText(value).includes(normalizedQuery)),
        )
        .map((item) => ({
          title: item.name,
          badge:
            item.class_name && item.level
              ? `${item.class_name} ${item.level}`
              : item.tag || "Personaje",
          meta: item.race || item.role_label || "Sin rol",
          text: item.summary || "Sin nota aún.",
        })),
    },
    {
      title: "Misiones",
      icon: Swords,
      items: collections.quests
        .filter((item) =>
          [item.title, item.detail, getQuestStatusLabel(item.status)]
            .filter(Boolean)
            .some((value) => normalizeText(value).includes(normalizedQuery)),
        )
        .map((item) => ({
          title: item.title,
          badge: getQuestStatusLabel(item.status),
          meta: "Agenda viva",
          text: item.detail || "Sin detalle.",
        })),
    },
    {
      title: "Locaciones",
      icon: MapPin,
      items: collections.locations
        .filter((item) =>
          [item.title, item.location_type, item.detail]
            .filter(Boolean)
            .some((value) => normalizeText(value).includes(normalizedQuery)),
        )
        .map((item) => ({
          title: item.title,
          badge: item.location_type || "Locación",
          meta: "Mapa de campaña",
          text: item.detail || "Sin detalle.",
        })),
    },
    {
      title: "Conocimiento",
      icon: Brain,
      items: collections.knowledge
        .filter((item) =>
          [item.title, item.body, item.known_by, getKnowledgeKindLabel(item.kind)]
            .filter(Boolean)
            .some((value) => normalizeText(value).includes(normalizedQuery)),
        )
        .map((item) => ({
          title: item.title,
          badge: getKnowledgeKindLabel(item.kind),
          meta: item.known_by ? `Lo sabe: ${item.known_by}` : getKnowledgeVisibilityLabel(item),
          text: item.body || "Sin detalle.",
        })),
    },
    {
      title: "Objetos",
      icon: Package,
      items: collections.inventory
        .filter((item) =>
          [item.name, item.item_type, item.holder, item.notes]
            .filter(Boolean)
            .some((value) => normalizeText(value).includes(normalizedQuery)),
        )
        .map((item) => ({
          title: item.name,
          badge: item.item_type || "Objeto",
          meta: item.holder || "Sin portador",
          text: item.notes || "Sin detalle.",
        })),
    },
    {
      title: "Bitácora",
      icon: BookOpen,
      items: journalBody
        .split(/\n+/)
        .map((line) => line.trim())
        .filter((line) => line.length > 0 && normalizeText(line).includes(normalizedQuery))
        .slice(0, 6)
        .map((line, index) => ({
          title: `Entrada ${index + 1}`,
          badge: "Nota",
          meta: "Bitácora principal",
          text: line,
        })),
    },
  ];

  return groups.filter((group) => group.items.length);
}

function buildDossierMarkdown(campaign, collections, journalBody) {
  const lines = [
    `# ${campaign?.title || "Campaña"}`,
    "",
    `- Estado: ${getCampaignStatusLabel(campaign?.status)}`,
    `- Ambientación: ${campaign?.setting || "Sin definir"}`,
    `- Última referencia: ${campaign?.last_session_label || "Sin dato"}`,
    "",
    "## Resumen",
    "",
    campaign?.summary || "Sin resumen.",
    "",
    "## Foco actual",
    "",
    campaign?.focus || "Sin foco cargado.",
    "",
    "## Próximo movimiento",
    "",
    campaign?.next_move || "Sin siguiente paso.",
    "",
    "## Personajes",
    "",
  ];

  collections.characters.forEach((item) => {
    const sheetBits = [
      item.class_name ? `${item.class_name}${item.level ? ` ${item.level}` : ""}` : "",
      item.race || "",
      item.role_label || "",
      item.tag || "",
    ].filter(Boolean);
    const combatBits = [
      item.armor_class ? `CA ${item.armor_class}` : "",
      item.hit_points ? `PG ${item.hit_points}` : "",
      item.speed ? `Velocidad ${item.speed}` : "",
      item.passive_perception ? `Percepción pasiva ${item.passive_perception}` : "",
    ].filter(Boolean);

    lines.push(`- **${item.name}** · ${sheetBits.join(" · ") || "Sin ficha"}`);
    if (combatBits.length) {
      lines.push(`  ${combatBits.join(" · ")}`);
    }
    lines.push(`  ${item.summary || "Sin nota."}`);
  });

  lines.push("", "## Misiones", "");
  collections.quests.forEach((item) => {
    lines.push(`- **${item.title}** · ${getQuestStatusLabel(item.status)}`);
    lines.push(`  ${item.detail || "Sin detalle."}`);
  });

  lines.push("", "## Locaciones", "");
  collections.locations.forEach((item) => {
    lines.push(`- **${item.title}** · ${item.location_type || "Sin tipo"}`);
    lines.push(`  ${item.detail || "Sin detalle."}`);
  });

  lines.push("", "## Conocimiento", "");
  collections.knowledge.forEach((item) => {
    const knowledgeBits = [getKnowledgeKindLabel(item.kind), getKnowledgeVisibilityLabel(item)];
    if (item.known_by) knowledgeBits.push(`Lo sabe: ${item.known_by}`);
    lines.push(`- **${item.title}** · ${knowledgeBits.join(" · ")}`);
    lines.push(`  ${item.body || "Sin detalle."}`);
  });

  lines.push("", "## Sesiones", "");
  collections.sessions.forEach((item) => {
    lines.push(`- **${item.title}** · ${item.session_number ? `Sesión ${item.session_number}` : "Sin número"}`);
    lines.push(`  ${item.recap || "Sin recap."}`);
  });

  lines.push("", "## Inventario", "");
  collections.inventory.forEach((item) => {
    lines.push(`- **${item.name}** · x${item.quantity || 1} · ${item.holder || "Sin portador"}`);
    lines.push(`  ${item.notes || item.item_type || "Sin detalle."}`);
  });

  lines.push("", "## Mascotas y formas", "");
  collections.savedCreatures.forEach((item) => {
    lines.push(`- **${item.name}** · ${getSavedCreatureKindLabel(item.usageKind)} · CR ${item.challengeLabel}`);
    lines.push(`  CA ${item.armorClass} · PG ${item.hitPoints} · ${item.speed}`);
  });

  lines.push("", "## Bitácora principal", "", journalBody || "Sin notas aún.");

  return lines.join("\n");
}

async function buildInsertPayload(sectionKey, draft, campaignId, userId, sortOrder) {
  switch (sectionKey) {
    case "characters": {
      const mergedCharacter = await mergeCharacterDraftWithImport(draft);
      const { character } = prepareCharacterForStorage(mergedCharacter);
      if (!character.name) {
        throw new Error("No pude detectar el nombre en la ficha. Escribilo a mano o revisá el texto pegado.");
      }
      return {
        campaign_id: campaignId,
        created_by: userId,
        updated_by: userId,
        name: character.name,
        role_label: character.role_label || null,
        tag: character.tag || null,
        summary: character.summary || null,
        class_name: character.class_name || null,
        level: character.level,
        race: character.race || null,
        armor_class: character.armor_class,
        hit_points: character.hit_points,
        speed: character.speed || null,
        passive_perception: character.passive_perception,
        sheet_reference_url: character.sheet_reference_url || null,
        sort_order: sortOrder,
      };
    }
    case "quests":
      return {
        campaign_id: campaignId,
        created_by: userId,
        updated_by: userId,
        title: draft.title?.trim(),
        status: draft.status || "active",
        detail: draft.detail?.trim() || null,
        priority: 1,
        sort_order: sortOrder,
      };
    case "locations":
      return {
        campaign_id: campaignId,
        created_by: userId,
        updated_by: userId,
        title: draft.title?.trim(),
        location_type: draft.location_type?.trim() || null,
        detail: draft.detail?.trim() || null,
        is_safe_haven: normalizeText(draft.location_type || "").includes("refugio"),
        sort_order: sortOrder,
      };
    case "knowledge": {
      const isPrivate = draft.kind === "private";
      return {
        campaign_id: campaignId,
        created_by: userId,
        updated_by: userId,
        owner_user_id: isPrivate ? userId : null,
        title: draft.title?.trim(),
        body: draft.body?.trim() || null,
        known_by: draft.known_by?.trim() || null,
        kind: draft.kind || "group",
        visibility: isPrivate ? "private" : "campaign",
        sort_order: sortOrder,
      };
    }
    case "sessions":
      return {
        campaign_id: campaignId,
        created_by: userId,
        updated_by: userId,
        title: draft.title?.trim(),
        recap: draft.recap?.trim() || null,
        session_number: draft.session_number ? toNumber(draft.session_number, null) : null,
        played_on: draft.played_on || null,
        sort_order: sortOrder,
      };
    case "inventory":
      return {
        campaign_id: campaignId,
        created_by: userId,
        updated_by: userId,
        name: draft.name?.trim(),
        item_type: draft.item_type?.trim() || null,
        holder: draft.holder?.trim() || null,
        quantity: Math.max(0, toNumber(draft.quantity, 1)),
        notes: draft.notes?.trim() || null,
        sort_order: sortOrder,
      };
    default:
      return null;
  }
}

async function buildUpdatePayload(sectionKey, draft, userId) {
  switch (sectionKey) {
    case "characters": {
      const mergedCharacter = await mergeCharacterDraftWithImport(draft);
      const { character } = prepareCharacterForStorage(mergedCharacter);
      if (!character.name) {
        throw new Error("No pude detectar el nombre en la ficha. Escribilo a mano o revisá el texto pegado.");
      }
      return {
        updated_by: userId,
        name: character.name,
        role_label: character.role_label || null,
        tag: character.tag || null,
        summary: character.summary || null,
        class_name: character.class_name || null,
        level: character.level,
        race: character.race || null,
        armor_class: character.armor_class,
        hit_points: character.hit_points,
        speed: character.speed || null,
        passive_perception: character.passive_perception,
        sheet_reference_url: character.sheet_reference_url || null,
      };
    }
    case "quests":
      return {
        updated_by: userId,
        title: draft.title?.trim(),
        status: draft.status || "active",
        detail: draft.detail?.trim() || null,
      };
    case "locations":
      return {
        updated_by: userId,
        title: draft.title?.trim(),
        location_type: draft.location_type?.trim() || null,
        detail: draft.detail?.trim() || null,
        is_safe_haven: normalizeText(draft.location_type || "").includes("refugio"),
      };
    case "knowledge": {
      const isPrivate = draft.kind === "private";
      return {
        updated_by: userId,
        owner_user_id: isPrivate ? userId : null,
        title: draft.title?.trim(),
        body: draft.body?.trim() || null,
        known_by: draft.known_by?.trim() || null,
        kind: draft.kind || "group",
        visibility: isPrivate ? "private" : "campaign",
      };
    }
    case "sessions":
      return {
        updated_by: userId,
        title: draft.title?.trim(),
        recap: draft.recap?.trim() || null,
        session_number: draft.session_number ? toNumber(draft.session_number, null) : null,
        played_on: draft.played_on || null,
      };
    case "inventory":
      return {
        updated_by: userId,
        name: draft.name?.trim(),
        item_type: draft.item_type?.trim() || null,
        holder: draft.holder?.trim() || null,
        quantity: Math.max(0, toNumber(draft.quantity, 1)),
        notes: draft.notes?.trim() || null,
      };
    default:
      return null;
  }
}

function getSectionConfigs() {
  return {
    characters: {
      title: "Personajes",
      subtitle:
        "Cada ficha puede guardar datos útiles del personaje, una referencia SRD y notas de apoyo para tener la hoja resumida a mano.",
      eyebrow: "Mesa viva",
      icon: Users,
      emptyText: "Todavía no hay personajes cargados en esta campaña.",
      validateDraft: (draft) =>
        Boolean(
          String(draft.name ?? "").trim() ||
            String(draft.sheet_import ?? "").trim(),
        ),
      fields: [
        { key: "name", label: "Nombre", required: true, placeholder: "Aryn" },
        { key: "class_name", label: "Clase", placeholder: "Druida" },
        { key: "level", label: "Nivel", type: "number", placeholder: "6", min: 1, max: 20 },
        { key: "race", label: "Raza o linaje", placeholder: "Elfo del bosque" },
        { key: "armor_class", label: "CA", type: "number", placeholder: "14" },
        { key: "hit_points", label: "PG", type: "number", placeholder: "42" },
        { key: "speed", label: "Velocidad", placeholder: "9 m · caminar" },
        {
          key: "passive_perception",
          label: "Percepción pasiva",
          type: "number",
          placeholder: "15",
        },
        { key: "sheet_reference_url", label: "Link de hoja", placeholder: "https://..." },
        { key: "role_label", label: "Rol", placeholder: "PJ · druida" },
        { key: "tag", label: "Tag", placeholder: "Aliado, villano, contacto..." },
        {
          key: "summary",
          label: "Nota",
          type: "textarea",
          placeholder: "Qué necesito recordar de esta persona antes de jugar.",
          rows: 4,
        },
        {
          key: "sheet_import",
          label: "Texto o JSON de apoyo",
          type: "textarea",
          placeholder:
            "Pegá acá texto o JSON exportado desde otra herramienta si querés completar datos más rápido.",
          helpText:
            "Es opcional. Si trae nombre, clase, nivel o raza, los usamos como respaldo al guardar.",
          rows: 5,
        },
      ],
      renderDisplay: (item) => {
        const character = normalizeCharacterRecord(item);
        const references = getCharacterReferences(character);

        return (
          <div>
            <div className="flex flex-wrap gap-2">
              {character.class_name ? (
                <BadgePill>{`${character.class_name}${character.level ? ` ${character.level}` : ""}`}</BadgePill>
              ) : null}
              {character.race ? <BadgePill tone="subtle">{character.race}</BadgePill> : null}
              {character.role_label ? <BadgePill tone="subtle">{character.role_label}</BadgePill> : null}
              {character.tag ? <BadgePill tone="subtle">{character.tag}</BadgePill> : null}
            </div>
            <h3 className="mt-4 font-display text-3xl text-stone-100">{character.name}</h3>

            <div className="mt-4 grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
              {character.armor_class ? (
                <div className="rounded-2xl border border-white/5 bg-white/[0.03] p-3 text-sm text-stone-300">
                  CA {character.armor_class}
                </div>
              ) : null}
              {character.hit_points ? (
                <div className="rounded-2xl border border-white/5 bg-white/[0.03] p-3 text-sm text-stone-300">
                  PG {character.hit_points}
                </div>
              ) : null}
              {character.speed ? (
                <div className="rounded-2xl border border-white/5 bg-white/[0.03] p-3 text-sm text-stone-300">
                  {character.speed}
                </div>
              ) : null}
              {character.passive_perception ? (
                <div className="rounded-2xl border border-white/5 bg-white/[0.03] p-3 text-sm text-stone-300">
                  PP {character.passive_perception}
                </div>
              ) : null}
            </div>

            {(character.sheet_reference_url || references.length) ? (
              <div className="mt-4 flex flex-wrap gap-3 text-sm">
                {character.sheet_reference_url ? (
                  <a
                    href={character.sheet_reference_url}
                    target="_blank"
                    rel="noreferrer"
                    className="text-amber-100 transition hover:text-amber-50"
                  >
                    Abrir hoja
                  </a>
                ) : null}
                {references.map((reference) => (
                  <a
                    key={reference.url}
                    href={reference.url}
                    target="_blank"
                    rel="noreferrer"
                    className="text-amber-100 transition hover:text-amber-50"
                  >
                    {reference.label}
                  </a>
                ))}
              </div>
            ) : null}

            <p className="mt-4 text-sm leading-relaxed text-stone-400">
              {character.summary || "Sin nota aún."}
            </p>
          </div>
        );
      },
    },
    quests: {
      title: "Misiones",
      subtitle: "Ordená el frente activo de la mesa y dejá cada objetivo con su propio contexto.",
      eyebrow: "Agenda",
      icon: Swords,
      emptyText: "No hay misiones cargadas todavía.",
      fields: [
        { key: "title", label: "Título", required: true, placeholder: "Seguir el carruaje negro" },
        { key: "status", label: "Estado", type: "select", defaultValue: "active", options: QUEST_STATUS_OPTIONS },
        {
          key: "detail",
          label: "Detalle",
          type: "textarea",
          placeholder: "Qué se sabe, qué falta y por qué importa.",
          rows: 4,
        },
      ],
      renderDisplay: (item) => (
        <div>
          <div className="flex flex-wrap gap-2">
            <BadgePill>{getQuestStatusLabel(item.status)}</BadgePill>
          </div>
          <h3 className="mt-4 font-display text-3xl text-stone-100">{item.title}</h3>
          <p className="mt-3 text-sm leading-relaxed text-stone-400">{item.detail || "Sin detalle aún."}</p>
        </div>
      ),
    },
    locations: {
      title: "Locaciones",
      subtitle: "Mantené cada sitio con su propia ficha para ubicar pistas y escenas rápido.",
      eyebrow: "Mapa",
      icon: MapPin,
      emptyText: "No hay locaciones cargadas aún.",
      fields: [
        { key: "title", label: "Nombre", required: true, placeholder: "Bosque del Sauce Hueco" },
        { key: "location_type", label: "Tipo", placeholder: "Refugio, zona, mazmorra..." },
        {
          key: "detail",
          label: "Detalle",
          type: "textarea",
          placeholder: "Qué se recuerda de este lugar, sus riesgos o su tono.",
          rows: 4,
        },
      ],
      renderDisplay: (item) => (
        <div>
          <div className="flex flex-wrap gap-2">
            {item.location_type ? <BadgePill>{item.location_type}</BadgePill> : null}
            {item.is_safe_haven ? <BadgePill tone="success">Refugio</BadgePill> : null}
          </div>
          <h3 className="mt-4 font-display text-3xl text-stone-100">{item.title}</h3>
          <p className="mt-3 text-sm leading-relaxed text-stone-400">{item.detail || "Sin detalle aún."}</p>
        </div>
      ),
    },
    knowledge: {
      title: "Conocimiento",
      subtitle: "Rumores, verdades y notas privadas para que no se pierda lo importante y quede claro quién lo sabe.",
      eyebrow: "Pistas",
      icon: Brain,
      emptyText: "Todavía no hay conocimientos guardados.",
      fields: [
        { key: "title", label: "Título", required: true, placeholder: "Melissandre sigue viva" },
        { key: "kind", label: "Clase", type: "select", defaultValue: "group", options: KNOWLEDGE_KIND_OPTIONS },
        { key: "known_by", label: "Lo sabe", placeholder: "Aryn, Benedicto, todo el grupo..." },
        {
          key: "body",
          label: "Detalle",
          type: "textarea",
          placeholder: "Qué se descubrió, qué tan confiable es y para quién sirve.",
          rows: 4,
        },
      ],
      renderDisplay: (item) => (
        <div>
          <div className="flex flex-wrap gap-2">
            <BadgePill>{getKnowledgeKindLabel(item.kind)}</BadgePill>
            <BadgePill tone="subtle">{getKnowledgeVisibilityLabel(item)}</BadgePill>
            {item.known_by ? <BadgePill tone="subtle">{`Lo sabe: ${item.known_by}`}</BadgePill> : null}
          </div>
          <h3 className="mt-4 font-display text-3xl text-stone-100">{item.title}</h3>
          <p className="mt-3 text-sm leading-relaxed text-stone-400">{item.body || "Sin detalle aún."}</p>
        </div>
      ),
    },
    sessions: {
      title: "Sesiones",
      subtitle: "Cada recap se puede corregir y ordenar como un historial útil para la campaña.",
      eyebrow: "Crónica",
      icon: ScrollText,
      emptyText: "No hay sesiones registradas todavía.",
      fields: [
        { key: "title", label: "Título", required: true, placeholder: "Sesión 13 · El carruaje negro" },
        { key: "session_number", label: "Número", type: "number", placeholder: "13" },
        { key: "played_on", label: "Fecha", type: "date" },
        {
          key: "recap",
          label: "Recap",
          type: "textarea",
          placeholder: "Qué pasó, qué quedó abierto y qué debería recordar el grupo.",
          rows: 5,
        },
      ],
      renderDisplay: (item) => (
        <div>
          <div className="flex flex-wrap gap-2">
            {item.session_number ? <BadgePill>Sesión {item.session_number}</BadgePill> : null}
            {item.played_on ? <BadgePill tone="subtle">{formatDate(item.played_on)}</BadgePill> : null}
          </div>
          <h3 className="mt-4 font-display text-3xl text-stone-100">{item.title}</h3>
          <p className="mt-3 text-sm leading-relaxed text-stone-400">{item.recap || "Sin recap aún."}</p>
        </div>
      ),
    },
    inventory: {
      title: "Objetos",
      subtitle: "Ítems, pistas físicas y tesoros con cantidad, portador y notas cortas.",
      eyebrow: "Inventario",
      icon: Package,
      emptyText: "Todavía no hay objetos guardados.",
      fields: [
        { key: "name", label: "Nombre", required: true, placeholder: "Llave ennegrecida" },
        { key: "item_type", label: "Tipo", placeholder: "Misión, tesoro, pista..." },
        { key: "holder", label: "Portador", placeholder: "Grupo, Aryn..." },
        { key: "quantity", label: "Cantidad", type: "number", defaultValue: 1, placeholder: "1" },
        {
          key: "notes",
          label: "Nota",
          type: "textarea",
          placeholder: "Por qué importa, dónde se consiguió o cómo se usa.",
          rows: 4,
        },
      ],
      renderDisplay: (item) => (
        <div>
          <div className="flex flex-wrap gap-2">
            {item.item_type ? <BadgePill>{item.item_type}</BadgePill> : null}
            {item.holder ? <BadgePill tone="subtle">{item.holder}</BadgePill> : null}
            <BadgePill tone="subtle">x{item.quantity || 1}</BadgePill>
          </div>
          <h3 className="mt-4 font-display text-3xl text-stone-100">{item.name}</h3>
          <p className="mt-3 text-sm leading-relaxed text-stone-400">{item.notes || "Sin nota aún."}</p>
        </div>
      ),
    },
  };
}

export default function App() {
  const [session, setSession] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [authError, setAuthError] = useState("");
  const [authStatus, setAuthStatus] = useState("");
  const [confirmationPendingEmail, setConfirmationPendingEmail] = useState("");

  const [appLoading, setAppLoading] = useState(true);
  const [appError, setAppError] = useState("");
  const [appStatus, setAppStatus] = useState("");
  const [busySectionKey, setBusySectionKey] = useState("");
  const [busySuggestionId, setBusySuggestionId] = useState("");
  const [campaignEditorMode, setCampaignEditorMode] = useState("");
  const [campaignDraft, setCampaignDraft] = useState(() => getEmptyCampaignDraft());
  const [campaignSubmitting, setCampaignSubmitting] = useState(false);
  const [campaignDeleting, setCampaignDeleting] = useState(false);

  const [campaigns, setCampaigns] = useState([]);
  const [selectedCampaignId, setSelectedCampaignId] = useState(() =>
    readStorage(SELECTED_CAMPAIGN_KEY, ""),
  );
  const [activeTab, setActiveTab] = useState("dashboard");
  const [search, setSearch] = useState("");
  const deferredSearch = useDeferredValue(search);
  const [bookOpen, setBookOpen] = useState(false);

  const [collections, setCollections] = useState(EMPTY_COLLECTIONS);
  const [mainJournalEntryId, setMainJournalEntryId] = useState("");
  const [journalBody, setJournalBody] = useState("");
  const [saveMessage, setSaveMessage] = useState("Los cambios de bitácora se guardan solos.");
  const [noteDirty, setNoteDirty] = useState(false);

  const [druidLevel, setDruidLevel] = useState(6);
  const [isMoonDruid, setIsMoonDruid] = useState(true);
  const [wildshapeSearch, setWildshapeSearch] = useState("");
  const [companionSearch, setCompanionSearch] = useState("");
  const [wildshapeMomentFilter, setWildshapeMomentFilter] = useState("all");
  const [wildshapeCrFilter, setWildshapeCrFilter] = useState("compatible");
  const [wildshapeSortBy, setWildshapeSortBy] = useState("cr");
  const [companionCrFilter, setCompanionCrFilter] = useState("any");
  const [creatureImportRef, setCreatureImportRef] = useState("");
  const [creatureImportKind, setCreatureImportKind] = useState("companion");
  const [creatureImportBusy, setCreatureImportBusy] = useState(false);
  const [wildshapeState, setWildshapeState] = useState({
    loading: true,
    error: "",
    items: [],
  });
  const [companionState, setCompanionState] = useState({
    loading: true,
    error: "",
    items: [],
  });

  const [creatureDetailState, setCreatureDetailState] = useState({
    creature: null,
    loading: false,
    error: "",
  });

  const sectionConfigs = useMemo(() => getSectionConfigs(), []);
  const selectedCampaign = campaigns.find((campaign) => campaign.id === selectedCampaignId) || null;
  const userId = session?.user?.id || "";
  const wildshapeMaxChallenge = getWildshapeMaxChallenge(druidLevel, isMoonDruid);
  const moonElementalsEnabled = shouldIncludeMoonElementals(druidLevel, isMoonDruid);

  const suggestionItems = useMemo(
    () =>
      extractStructuredSuggestions(journalBody, {
        characters: collections.characters,
        quests: collections.quests,
        locations: collections.locations,
        knowledge: collections.knowledge,
        inventory: collections.inventory,
      }),
    [
      collections.characters,
      collections.inventory,
      collections.knowledge,
      collections.locations,
      collections.quests,
      journalBody,
    ],
  );

  const searchGroups = useMemo(
    () => createSearchGroups(deferredSearch, collections, journalBody),
    [collections, deferredSearch, journalBody],
  );

  const savedWildshapes = useMemo(
    () => collections.savedCreatures.filter((item) => item.usageKind === "wildshape"),
    [collections.savedCreatures],
  );
  const savedCompanions = useMemo(
    () => collections.savedCreatures.filter((item) => item.usageKind !== "wildshape"),
    [collections.savedCreatures],
  );
  const wildshapeCrOptions = useMemo(
    () => [...new Set(wildshapeState.items.map((item) => item.challengeLabel))],
    [wildshapeState.items],
  );
  const companionCrOptions = useMemo(
    () => [...new Set(companionState.items.map((item) => item.challengeLabel))],
    [companionState.items],
  );
  const filteredWildshapeItems = useMemo(() => {
    const compatibleItems = wildshapeState.items.filter((creature) => {
      if (creature.typeKey === "elemental") return moonElementalsEnabled;
      return creature.challengeValue <= wildshapeMaxChallenge;
    });

    const sourceItems =
      wildshapeCrFilter === "compatible"
        ? compatibleItems
        : wildshapeState.items.filter((creature) => matchesChallengeFilter(creature, wildshapeCrFilter));

    return sortCreatures(
      sourceItems.filter((creature) => matchesCreatureMoment(creature, wildshapeMomentFilter)),
      wildshapeSortBy,
    );
  }, [
    moonElementalsEnabled,
    wildshapeCrFilter,
    wildshapeMaxChallenge,
    wildshapeMomentFilter,
    wildshapeSortBy,
    wildshapeState.items,
  ]);
  const filteredCompanionItems = useMemo(
    () =>
      companionState.items.filter((creature) => matchesChallengeFilter(creature, companionCrFilter)),
    [companionCrFilter, companionState.items],
  );

  function handleSectionFieldChange(sectionKey, fieldKey, value) {
    if (sectionKey === "characters" && fieldKey === "level" && Number(value) > 20) {
      setAppStatus(getLevelOverflowMessage());
    }
  }

  function handleDruidLevelChange(nextValue) {
    if (Number(nextValue) > 20) {
      setAppStatus(getLevelOverflowMessage());
    }

    const { value } = clampLevel(nextValue, 2, 20);
    setDruidLevel(value ?? 2);
  }

  useEffect(() => {
    if (!supabase) {
      setAuthLoading(false);
      return undefined;
    }

    let mounted = true;

    supabase.auth
      .getSession()
      .then(({ data, error }) => {
        if (!mounted) return;

        if (error) {
          setAuthError(error.message);
        }

        setSession(data.session ?? null);
        setAuthLoading(false);
      })
      .catch((error) => {
        if (!mounted) return;
        setAuthError(error.message || "No pude revisar la sesión actual.");
        setAuthLoading(false);
      });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, nextSession) => {
      setSession(nextSession ?? null);

      if (event === "SIGNED_OUT") {
        setCampaigns([]);
        setCollections(EMPTY_COLLECTIONS);
        setSelectedCampaignId("");
        setMainJournalEntryId("");
        setJournalBody("");
        setCampaignEditorMode("create");
        setCampaignDraft(getEmptyCampaignDraft());
        setAppStatus("");
        writeStorage(SELECTED_CAMPAIGN_KEY, null);
      }

      if (event === "SIGNED_IN" || event === "TOKEN_REFRESHED") {
        setAuthError("");
        setConfirmationPendingEmail("");
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (!selectedCampaignId) {
      writeStorage(SELECTED_CAMPAIGN_KEY, null);
      return;
    }

    writeStorage(SELECTED_CAMPAIGN_KEY, selectedCampaignId);
  }, [selectedCampaignId]);

  useEffect(() => {
    if (!session || !supabase) {
      setAppLoading(false);
      return;
    }

    let cancelled = false;

    async function loadCampaigns() {
      setAppLoading(true);
      setAppError("");
      setAppStatus("");

      try {
        const { data: existingCampaigns, error: campaignsError } = await supabase
          .from("campaigns")
          .select("*")
          .order("updated_at", { ascending: false });

        if (campaignsError) throw campaignsError;

        const nextCampaigns = existingCampaigns || [];

        if (cancelled) return;

        const storedSelection = readStorage(SELECTED_CAMPAIGN_KEY, "");
        const nextSelection =
          nextCampaigns.find((campaign) => campaign.id === storedSelection)?.id || nextCampaigns[0]?.id || "";

        startTransition(() => {
          setCampaigns(nextCampaigns);
          setSelectedCampaignId(nextSelection);
          setCampaignEditorMode(nextCampaigns.length ? "" : "create");
          setCampaignDraft(nextCampaigns.length ? getEmptyCampaignDraft() : buildCampaignDraft(null));
        });
      } catch (error) {
        if (!cancelled) {
          setAppError(error.message || "No pude cargar las campañas.");
        }
      } finally {
        if (!cancelled) {
          setAppLoading(false);
        }
      }
    }

    loadCampaigns();

    return () => {
      cancelled = true;
    };
  }, [session]);

  useEffect(() => {
    if (!session || !supabase) return;
    if (!selectedCampaignId) {
      setCollections(EMPTY_COLLECTIONS);
      setMainJournalEntryId("");
      setJournalBody("");
      setSaveMessage("Creá una campaña para empezar a escribir.");
      return;
    }

    let cancelled = false;

    async function loadCampaignBundle() {
      setAppLoading(true);
      setAppError("");

      try {
        const [
          charactersResult,
          questsResult,
          locationsResult,
          knowledgeResult,
          sessionsResult,
          inventoryResult,
          journalResult,
          creaturesResult,
        ] = await Promise.all([
          supabase.from("characters").select("*").eq("campaign_id", selectedCampaignId).order("sort_order"),
          supabase.from("quests").select("*").eq("campaign_id", selectedCampaignId).order("sort_order"),
          supabase.from("locations").select("*").eq("campaign_id", selectedCampaignId).order("sort_order"),
          supabase
            .from("knowledge_entries")
            .select("*")
            .eq("campaign_id", selectedCampaignId)
            .order("sort_order"),
          supabase.from("session_logs").select("*").eq("campaign_id", selectedCampaignId).order("sort_order"),
          supabase.from("inventory_items").select("*").eq("campaign_id", selectedCampaignId).order("sort_order"),
          supabase
            .from("journal_entries")
            .select("*")
            .eq("campaign_id", selectedCampaignId)
            .eq("entry_type", "note")
            .order("is_pinned", { ascending: false })
            .order("sort_order"),
          supabase
            .from("saved_creatures")
            .select("*")
            .eq("campaign_id", selectedCampaignId)
            .order("created_at", { ascending: false }),
        ]);

        const results = [
          charactersResult,
          questsResult,
          locationsResult,
          knowledgeResult,
          sessionsResult,
          inventoryResult,
          journalResult,
          creaturesResult,
        ];

        const firstError = results.find((result) => result.error)?.error;
        if (firstError) throw firstError;

        let journalEntries = journalResult.data || [];

        if (!journalEntries.length) {
          const { data: createdNote, error: createNoteError } = await supabase
            .from("journal_entries")
            .insert({
              campaign_id: selectedCampaignId,
              authored_by: session.user.id,
              updated_by: session.user.id,
              title: "Bitácora principal",
              body: "",
              entry_type: "note",
              is_pinned: true,
              sort_order: 0,
            })
            .select("*")
            .single();

          if (createNoteError) throw createNoteError;
          journalEntries = [createdNote];
        }

        if (cancelled) return;

        const mainEntry = journalEntries[0] || null;

        startTransition(() => {
          setCollections({
            characters: normalizeSectionItems("characters", charactersResult.data || []),
            quests: normalizeSectionItems("quests", questsResult.data || []),
            locations: normalizeSectionItems("locations", locationsResult.data || []),
            knowledge: normalizeSectionItems("knowledge", knowledgeResult.data || []),
            sessions: normalizeSectionItems("sessions", sessionsResult.data || []),
            inventory: normalizeSectionItems("inventory", inventoryResult.data || []),
            journalEntries,
            savedCreatures: (creaturesResult.data || []).map(mapSavedCreatureRow),
          });
          setMainJournalEntryId(mainEntry?.id || "");
          setJournalBody(mainEntry?.body || "");
          setSaveMessage("Los cambios de bitácora se guardan solos.");
          setNoteDirty(false);
        });
      } catch (error) {
        if (!cancelled) {
          setAppError(error.message || "No pude cargar los datos de la campaña.");
        }
      } finally {
        if (!cancelled) {
          setAppLoading(false);
        }
      }
    }

    loadCampaignBundle();

    return () => {
      cancelled = true;
    };
  }, [selectedCampaignId, session]);

  useEffect(() => {
    if (!noteDirty || !mainJournalEntryId || !supabase || !session) return undefined;

    setSaveMessage("Guardando bitácora...");

    const timeoutId = window.setTimeout(async () => {
      const { error } = await supabase
        .from("journal_entries")
        .update({
          body: journalBody,
          updated_by: session.user.id,
        })
        .eq("id", mainJournalEntryId);

      if (error) {
        setSaveMessage("No pude guardar la bitácora.");
        return;
      }

      setCollections((previous) => ({
        ...previous,
        journalEntries: previous.journalEntries.map((entry) =>
          entry.id === mainJournalEntryId ? { ...entry, body: journalBody } : entry,
        ),
      }));
      setNoteDirty(false);
      setSaveMessage("Bitácora guardada.");
    }, 900);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [journalBody, mainJournalEntryId, noteDirty, session]);

  useEffect(() => {
    let cancelled = false;

    async function loadCreatureLibrary() {
      setWildshapeState((previous) => ({ ...previous, loading: true, error: "" }));
      setCompanionState((previous) => ({ ...previous, loading: true, error: "" }));

      try {
        const [wildshapeItems, companionItems] = await Promise.all([
          loadWildshapeCards(wildshapeSearch.trim(), {
            maxChallengeRating: wildshapeMaxChallenge,
            featuredIndices: featuredTransformationIndices,
            elementalIndices: featuredElementalIndices,
            includeElementals: moonElementalsEnabled,
          }),
          loadCompanionCards(companionSearch.trim(), featuredCompanionIndices),
        ]);

        if (cancelled) return;

        setWildshapeState({
          loading: false,
          error: "",
          items: wildshapeItems,
        });
        setCompanionState({
          loading: false,
          error: "",
          items: companionItems,
        });
      } catch (error) {
        if (cancelled) return;

        setWildshapeState((previous) => ({
          ...previous,
          loading: false,
          error: error.message || "No pude cargar las formas.",
        }));
        setCompanionState((previous) => ({
          ...previous,
          loading: false,
          error: error.message || "No pude cargar las criaturas.",
        }));
      }
    }

    loadCreatureLibrary();

    return () => {
      cancelled = true;
    };
  }, [companionSearch, moonElementalsEnabled, wildshapeMaxChallenge, wildshapeSearch]);

  async function handleSignIn({ email, password }) {
    if (!supabase) return;

    setAuthLoading(true);
    setAuthError("");
    setAuthStatus("");

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setAuthError(error.message);
    } else {
      setAuthStatus("Sesión iniciada. Cargando tu campaña...");
    }

    setAuthLoading(false);
  }

  async function handleSignUp({ displayName, email, password }) {
    if (!supabase) return;

    setAuthLoading(true);
    setAuthError("");
    setAuthStatus("");

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: getAuthRedirectUrl(),
        data: {
          display_name: displayName,
        },
      },
    });

    if (error) {
      setAuthError(error.message);
      setAuthLoading(false);
      return;
    }

    if (!data.session) {
      setConfirmationPendingEmail(email);
      setAuthStatus("Te mandamos un mail de confirmacion para activar la cuenta.");
    } else {
      setAuthStatus("Cuenta creada. Cargando tu espacio...");
    }

    setAuthLoading(false);
  }

  async function handleResendConfirmation(email) {
    if (!supabase) return;

    setAuthLoading(true);
    setAuthError("");
    setAuthStatus("");

    const { error } = await supabase.auth.resend({
      type: "signup",
      email,
      options: {
        emailRedirectTo: getAuthRedirectUrl(),
      },
    });

    if (error) {
      setAuthError(error.message);
    } else {
      setAuthStatus(`Reenvie el correo de confirmacion a ${email}.`);
    }

    setAuthLoading(false);
  }

  async function handleSignOut() {
    if (!supabase) return;

    await supabase.auth.signOut();
  }

  function handleCampaignDraftChange(key, value) {
    setCampaignDraft((previous) => ({ ...previous, [key]: value }));
  }

  function openCreateCampaign() {
    setCampaignEditorMode("create");
    setCampaignDraft(getEmptyCampaignDraft());
    setAppError("");
    setAppStatus("");
    setActiveTab("dashboard");
  }

  function openEditCampaign() {
    if (!selectedCampaign) return;

    setCampaignEditorMode("edit");
    setCampaignDraft(buildCampaignDraft(selectedCampaign));
    setAppError("");
    setAppStatus("");
    setActiveTab("dashboard");
  }

  function closeCampaignEditor() {
    setCampaignEditorMode(campaigns.length ? "" : "create");
    setCampaignDraft(getEmptyCampaignDraft());
  }

  async function handleSaveCampaign() {
    if (!supabase || !userId || !campaignDraft.title.trim()) return;

    setCampaignSubmitting(true);
    setAppError("");
    setAppStatus("");

    const payload = {
      owner_user_id: userId,
      title: campaignDraft.title.trim(),
      status: campaignDraft.status || "active",
      setting: campaignDraft.setting.trim() || null,
      summary: campaignDraft.summary.trim() || null,
      focus: campaignDraft.focus.trim() || null,
      next_move: campaignDraft.next_move.trim() || null,
      last_session_label: campaignDraft.last_session_label.trim() || null,
      accent: selectedCampaign?.accent || getCampaignAccent(campaignDraft.title),
    };

    try {
      if (campaignEditorMode === "edit" && selectedCampaignId) {
        const { data, error } = await supabase
          .from("campaigns")
          .update(payload)
          .eq("id", selectedCampaignId)
          .select("*")
          .single();

        if (error) throw error;

        setCampaigns((previous) =>
          previous.map((campaign) => (campaign.id === data.id ? data : campaign)),
        );
        setAppStatus("Campaña actualizada.");
      } else {
        const { data, error } = await supabase
          .from("campaigns")
          .insert({
            ...payload,
            accent: getCampaignAccent(campaignDraft.title),
          })
          .select("*")
          .single();

        if (error) throw error;

        setCampaigns((previous) => [data, ...previous]);
        setSelectedCampaignId(data.id);
        setAppStatus("Campaña creada.");
      }

      setCampaignEditorMode("");
      setCampaignDraft(getEmptyCampaignDraft());
    } catch (error) {
      setAppError(error.message || "No pude guardar la campaña.");
    } finally {
      setCampaignSubmitting(false);
    }
  }

  async function handleDeleteCampaign() {
    if (!supabase || !selectedCampaignId || !selectedCampaign) return;

    const confirmed =
      typeof window === "undefined"
        ? true
        : window.confirm(
            `Vas a borrar "${selectedCampaign.title}" con su bit\u00e1cora, personajes, misiones, locaciones, conocimiento, inventario y criaturas guardadas.\n\nEsta acci\u00f3n no se puede deshacer.\n\n\u00bfQuer\u00e9s seguir?`,
          );

    if (!confirmed) return;

    setCampaignDeleting(true);
    setAppError("");
    setAppStatus("");

    const deletingCampaignId = selectedCampaignId;
    const nextCampaigns = campaigns.filter((campaign) => campaign.id !== deletingCampaignId);
    const nextSelectedCampaignId = nextCampaigns[0]?.id || "";

    try {
      const { error } = await supabase.from("campaigns").delete().eq("id", deletingCampaignId);

      if (error) throw error;

      startTransition(() => {
        setCampaigns(nextCampaigns);
        setSelectedCampaignId(nextSelectedCampaignId);
        setCampaignEditorMode(nextCampaigns.length ? "" : "create");
        setCampaignDraft(getEmptyCampaignDraft());
        setActiveTab("dashboard");
      });

      if (!nextSelectedCampaignId) {
        setCollections(EMPTY_COLLECTIONS);
        setMainJournalEntryId("");
        setJournalBody("");
        setSaveMessage("Cre\u00e1 una campa\u00f1a para empezar a escribir.");
        setNoteDirty(false);
      }

      setAppStatus(
        nextSelectedCampaignId
          ? "Campa\u00f1a borrada. Ya ten\u00e9s otra campa\u00f1a activa."
          : "Campa\u00f1a borrada. Pod\u00e9s crear una nueva cuando quieras.",
      );
    } catch (error) {
      setAppError(error.message || "No pude borrar la campa\u00f1a.");
    } finally {
      setCampaignDeleting(false);
    }
  }

  async function persistOrder(sectionKey, nextItems) {
    const table = COLLECTION_TABLES[sectionKey];
    if (!table || !supabase) return;

    await Promise.all(
      nextItems.map((item, index) =>
        supabase.from(table).update({ sort_order: index }).eq("id", item.id),
      ),
    );
  }

  async function handleCreateItem(sectionKey, draft) {
    if (!selectedCampaignId || !supabase || !userId) return;

    setBusySectionKey(sectionKey);
    setAppError("");
    setAppStatus("");

    try {
      const nextSortOrder = collections[sectionKey].length;
      const characterLevelOverflow =
        sectionKey === "characters" && Number(draft.level ?? 0) > 20;
      const payload = await buildInsertPayload(
        sectionKey,
        draft,
        selectedCampaignId,
        userId,
        nextSortOrder,
      );
      const table = COLLECTION_TABLES[sectionKey];

      const { data, error } = await supabase.from(table).insert(payload).select("*").single();
      if (error) throw error;

      setCollections((previous) => ({
        ...previous,
        [sectionKey]: sortByOrder([
          ...previous[sectionKey],
          normalizeSectionItem(sectionKey, data),
        ]),
      }));

      if (characterLevelOverflow) {
        setAppStatus(getLevelOverflowMessage());
      } else if (sectionKey === "characters" && String(draft.sheet_import ?? "").trim()) {
        setAppStatus(
          "Personaje guardado con datos de apoyo. Si algo vino raro, podés corregirlo a mano.",
        );
      }
    } catch (error) {
      setAppError(error.message || "No pude crear ese registro.");
      throw error;
    } finally {
      setBusySectionKey("");
    }
  }

  async function handleUpdateItem(sectionKey, itemId, draft) {
    if (!supabase || !userId) return;

    setBusySectionKey(sectionKey);
    setAppError("");
    setAppStatus("");

    try {
      const characterLevelOverflow =
        sectionKey === "characters" && Number(draft.level ?? 0) > 20;
      const payload = await buildUpdatePayload(sectionKey, draft, userId);
      const table = COLLECTION_TABLES[sectionKey];

      const { data, error } = await supabase
        .from(table)
        .update(payload)
        .eq("id", itemId)
        .select("*")
        .single();

      if (error) throw error;

      setCollections((previous) => ({
        ...previous,
        [sectionKey]: sortByOrder(
          previous[sectionKey].map((item) =>
            item.id === itemId ? normalizeSectionItem(sectionKey, data) : item,
          ),
        ),
      }));

      if (characterLevelOverflow) {
        setAppStatus(getLevelOverflowMessage());
      } else if (sectionKey === "characters" && String(draft.sheet_import ?? "").trim()) {
        setAppStatus(
          "Personaje actualizado con datos de apoyo. Si querés, podés retocar cualquier campo a mano.",
        );
      }
    } catch (error) {
      setAppError(error.message || "No pude guardar los cambios.");
      throw error;
    } finally {
      setBusySectionKey("");
    }
  }

  async function handleDeleteItem(sectionKey, itemId) {
    if (!supabase) return;

    setBusySectionKey(sectionKey);
    setAppError("");

    try {
      const table = COLLECTION_TABLES[sectionKey];
      const { error } = await supabase.from(table).delete().eq("id", itemId);
      if (error) throw error;

      const remainingItems = collections[sectionKey]
        .filter((item) => item.id !== itemId)
        .map((item, index) => ({
          ...item,
          sort_order: index,
        }));

      setCollections((previous) => ({
        ...previous,
        [sectionKey]: remainingItems,
      }));

      await persistOrder(sectionKey, remainingItems);
    } catch (error) {
      setAppError(error.message || "No pude eliminar ese registro.");
    } finally {
      setBusySectionKey("");
    }
  }

  async function handleMoveItem(sectionKey, itemId, direction) {
    if (!supabase) return;

    setBusySectionKey(sectionKey);
    setAppError("");

    const currentItems = collections[sectionKey];
    const nextItems = swapItems(currentItems, itemId, direction);

    if (nextItems === currentItems) {
      setBusySectionKey("");
      return;
    }

    setCollections((previous) => ({
      ...previous,
      [sectionKey]: nextItems,
    }));

    try {
      await persistOrder(sectionKey, nextItems);
    } catch (error) {
      setAppError(error.message || "No pude reordenar la seccion.");
      setCollections((previous) => ({
        ...previous,
        [sectionKey]: currentItems,
      }));
    } finally {
      setBusySectionKey("");
    }
  }

  async function handleApplySuggestion(suggestion) {
    setBusySuggestionId(suggestion.id);
    setAppError("");
    setAppStatus("");

    try {
      switch (suggestion.kind) {
        case "characters":
          await handleCreateItem("characters", {
            name: suggestion.title,
            role_label: "Detectado en bitácora",
            tag: "Sugerencia",
            summary: suggestion.detail,
          });
          break;
        case "quests":
          await handleCreateItem("quests", {
            title: suggestion.title,
            status: "investigating",
            detail: suggestion.detail,
          });
          break;
        case "locations":
          await handleCreateItem("locations", {
            title: suggestion.title,
            location_type: "Detectada en bitácora",
            detail: suggestion.detail,
          });
          break;
        case "knowledge":
          await handleCreateItem("knowledge", {
            title: suggestion.title,
            kind: "group",
            body: suggestion.detail,
          });
          break;
        case "inventory":
          await handleCreateItem("inventory", {
            name: suggestion.title,
            item_type: "Detectado en bitácora",
            holder: "Grupo",
            quantity: 1,
            notes: suggestion.detail,
          });
          break;
        default:
          break;
      }

      setAppStatus(`${getSuggestionKindLabel(suggestion.kind)} creado desde la bitácora.`);
    } finally {
      setBusySuggestionId("");
    }
  }

  async function handleSaveCreature(creature, usageKind) {
    if (!supabase || !selectedCampaignId || !userId) return;

    setAppError("");
    setAppStatus("");

    const payload = {
      campaign_id: selectedCampaignId,
      user_id: userId,
      usage_kind: usageKind,
      source_system: "srd_2014",
      source_index: creature.index,
      name: creature.name,
      creature_type: creature.type,
      size: creature.size,
      challenge_value: creature.challengeValue,
      challenge_label: creature.challengeLabel,
      armor_class: creature.armorClass,
      hit_points: creature.hitPoints,
      hit_dice: creature.hitDice,
      speed: creature.speed,
      alignment: creature.alignment,
      image_url: creature.imageUrl,
      source_url: creature.sourceUrl,
      snippet: creature.snippet,
      traits: creature.traits,
      notes: "",
      is_favorite: true,
    };

    const { data, error } = await supabase
      .from("saved_creatures")
      .upsert(payload, {
        onConflict: "campaign_id,user_id,usage_kind,source_system,source_index",
      })
      .select("*")
      .single();

    if (error) {
      setAppError(error.message || "No pude guardar la criatura.");
      return;
    }

    setCollections((previous) => {
      const nextRow = mapSavedCreatureRow(data);
      const filtered = previous.savedCreatures.filter(
        (item) => !(item.index === nextRow.index && item.usageKind === nextRow.usageKind),
      );

      return {
        ...previous,
        savedCreatures: [nextRow, ...filtered],
      };
    });
    setAppStatus(usageKind === "wildshape" ? "Forma guardada." : "Mascota guardada.");
  }

  async function handleRemoveSavedCreature(usageKind, creatureIndex) {
    if (!supabase || !selectedCampaignId || !userId) return;

    const { error } = await supabase
      .from("saved_creatures")
      .delete()
      .eq("campaign_id", selectedCampaignId)
      .eq("user_id", userId)
      .eq("usage_kind", usageKind)
      .eq("source_index", creatureIndex);

    if (error) {
      setAppError(error.message || "No pude quitar la criatura guardada.");
      return;
    }

    setCollections((previous) => ({
      ...previous,
      savedCreatures: previous.savedCreatures.filter(
        (item) => !(item.index === creatureIndex && item.usageKind === usageKind),
      ),
    }));
    setAppStatus(usageKind === "wildshape" ? "Forma eliminada." : "Mascota eliminada.");
  }

  async function handleImportCreatureReference() {
    if (!creatureImportRef.trim()) return;

    setCreatureImportBusy(true);
    setAppError("");
    setAppStatus("");

    try {
      const creature = await importCreatureCardFromReference(creatureImportRef.trim());
      await handleSaveCreature(creature, creatureImportKind);
      setCreatureImportRef("");
      await openCreatureDetail(creature.index);
      setAppStatus(
        creatureImportKind === "wildshape"
          ? "Forma importada y guardada."
          : "Mascota importada y guardada.",
      );
    } catch (error) {
      setAppError(error.message || "No pude importar esa criatura.");
    } finally {
      setCreatureImportBusy(false);
    }
  }

  async function openCreatureDetail(index) {
    setCreatureDetailState({
      creature: null,
      loading: true,
      error: "",
    });

    try {
      const creature = await getCreatureDetail(index);
      setCreatureDetailState({
        creature,
        loading: false,
        error: "",
      });
    } catch (error) {
      setCreatureDetailState({
        creature: null,
        loading: false,
        error: error.message || "No pude abrir la ficha de la criatura.",
      });
    }
  }

  function handleExportDossier() {
    if (!selectedCampaign) return;

    const filename = `${normalizeText(selectedCampaign?.title || "campana").replace(/\s+/g, "-") || "campana"}.md`;
    const markdown = buildDossierMarkdown(selectedCampaign, collections, journalBody);
    downloadTextFile(filename, markdown);
  }

  function renderDashboard() {
    if (!selectedCampaign) {
      return (
        <div className="grid gap-6">
          <CampaignEditorPanel
            mode="create"
            draft={campaignDraft}
            onChange={handleCampaignDraftChange}
            onCancel={closeCampaignEditor}
            onSubmit={handleSaveCampaign}
            deleting={campaignDeleting}
            submitting={campaignSubmitting}
          />

          <Panel className="p-6">
            <SectionTitle
              icon={Sparkles}
              eyebrow="Primer paso"
              title="Arrancá limpio, pero separado"
              subtitle="Las cuentas nuevas ya no reciben datos de muestra. Primero creás la campaña y desde ahí cada historia queda aislada con sus propias notas."
            />
          </Panel>
        </div>
      );
    }

    return (
      <div className="grid gap-6">
        {campaignEditorMode ? (
          <CampaignEditorPanel
            mode={campaignEditorMode}
            draft={campaignDraft}
            onChange={handleCampaignDraftChange}
            onCancel={closeCampaignEditor}
            onDelete={handleDeleteCampaign}
            onSubmit={handleSaveCampaign}
            deleting={campaignDeleting}
            submitting={campaignSubmitting}
          />
        ) : null}

        <Panel className="overflow-hidden p-6 md:p-8">
          <div className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
            <div>
              <div className="inline-flex items-center gap-3 rounded-full border border-amber-200/15 bg-amber-300/10 px-4 py-2 text-xs uppercase tracking-[0.3em] text-amber-100/70">
                <Sparkles className="h-4 w-4" />
                Campaña activa
              </div>
              <h1 className="mt-5 font-display text-5xl leading-tight text-stone-50 md:text-6xl">
                {selectedCampaign?.title || "Tu crónica"}
              </h1>
              <p className="mt-4 max-w-3xl text-base leading-relaxed text-stone-300">
                {selectedCampaign?.summary || "Todavía no cargaste un resumen para esta campaña."}
              </p>

              <div className="mt-6 flex flex-wrap gap-2">
                <BadgePill>{getCampaignStatusLabel(selectedCampaign?.status)}</BadgePill>
                {selectedCampaign?.setting ? <BadgePill tone="subtle">{selectedCampaign.setting}</BadgePill> : null}
                {selectedCampaign?.last_session_label ? (
                  <BadgePill tone="subtle">{selectedCampaign.last_session_label}</BadgePill>
                ) : null}
              </div>

              <div className="mt-6 grid gap-4 md:grid-cols-2">
                <div className="rounded-[24px] border border-amber-200/10 bg-[rgba(10,7,5,0.45)] p-5">
                  <div className="text-xs uppercase tracking-[0.28em] text-amber-100/45">Foco actual</div>
                  <p className="mt-3 text-sm leading-relaxed text-stone-300">
                    {selectedCampaign?.focus || "Aún no hay foco definido."}
                  </p>
                </div>
                <div className="rounded-[24px] border border-amber-200/10 bg-[rgba(10,7,5,0.45)] p-5">
                  <div className="text-xs uppercase tracking-[0.28em] text-amber-100/45">Próximo movimiento</div>
                  <p className="mt-3 text-sm leading-relaxed text-stone-300">
                    {selectedCampaign?.next_move || "Aún no hay siguiente paso."}
                  </p>
                </div>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <MetricCard
                value={collections.characters.length}
                label="Personajes"
                hint="NPCs, aliados, villanos o PJs con su propia ficha editable."
              />
              <MetricCard
                value={collections.quests.length}
                label="Misiones"
                hint="Objetivos vivos que podés ordenar según prioridad."
              />
              <MetricCard
                value={collections.locations.length}
                label="Locaciones"
                hint="Lugares rápidos de ubicar antes de narrar."
              />
              <MetricCard
                value={collections.savedCreatures.length}
                label="Criaturas guardadas"
                hint="Mascotas y formas listas para consultar sin salir de la página."
              />
            </div>
          </div>
        </Panel>

        <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
          <Panel className="p-6">
            <SectionTitle
              icon={BookOpen}
              eyebrow="Bitácora"
              title="Notas normales, pero útiles"
              subtitle="Escribí recap, escenas, rumores y nombres. Cada campaña guarda su propia bitácora y, si querés, te propone convertir líneas marcadas en datos estructurados."
            />

            <div className="mt-6 rounded-[26px] border border-amber-200/10 bg-[rgba(10,7,5,0.52)] p-4">
              <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
                <div className="text-sm text-stone-300">Bitácora principal de la campaña</div>
                <div className="text-xs uppercase tracking-[0.28em] text-amber-100/45">{saveMessage}</div>
              </div>
              <textarea
                value={journalBody}
                onChange={(event) => {
                  setJournalBody(event.target.value);
                  setNoteDirty(true);
                }}
                rows={14}
                className="min-h-[280px] w-full resize-y rounded-[24px] border border-amber-200/10 bg-[rgba(16,11,9,0.82)] px-4 py-4 text-sm leading-7 text-stone-100 outline-none placeholder:text-stone-500"
                placeholder="Escribí acá la sesión, sospechas, nombres propios, objetos raros o locaciones. Si querés sugerencias más confiables, usá líneas tipo NPC:, MISIÓN:, LUGAR:, OBJETO: o PISTA:."
              />
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              <ButtonPill onClick={() => setBookOpen(true)}>Abrir vista libro</ButtonPill>
              <ButtonPill onClick={handleExportDossier}>Exportar dossier</ButtonPill>
            </div>
          </Panel>

          <Panel className="p-6">
            <SectionTitle
              icon={Compass}
              eyebrow="Lectura asistida"
              title="Sugerencias desde la bitácora"
              subtitle="Ahora prioriza líneas explícitas y deja de inventar de más. Lo más confiable es escribir prefijos como NPC:, MISIÓN:, LUGAR:, OBJETO: o PISTA:."
            />

            <div className="mt-6 space-y-3">
              {suggestionItems.length ? (
                suggestionItems.map((suggestion) => (
                  <div
                    key={suggestion.id}
                    className="rounded-[22px] border border-amber-200/10 bg-[rgba(10,7,5,0.55)] p-4"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <div className="flex flex-wrap gap-2">
                          <BadgePill>{getSuggestionKindLabel(suggestion.kind)}</BadgePill>
                        </div>
                        <h3 className="mt-3 text-lg font-semibold text-stone-100">{suggestion.title}</h3>
                      </div>
                      <ButtonPill
                        onClick={() => handleApplySuggestion(suggestion)}
                        disabled={busySuggestionId === suggestion.id}
                      >
                        {busySuggestionId === suggestion.id
                          ? "Guardando..."
                          : getSuggestionCreateLabel(suggestion.kind)}
                      </ButtonPill>
                    </div>
                    <p className="mt-3 text-sm leading-relaxed text-stone-400">{suggestion.sourceLine}</p>
                  </div>
                ))
              ) : (
                <div className="rounded-[22px] border border-amber-200/10 bg-[rgba(10,7,5,0.55)] p-4 text-sm leading-relaxed text-stone-400">
                  Probá algo como `NPC: Elric el herrero`, `MISIÓN: Seguir el carruaje negro`, `LUGAR: Capilla en ruinas`, `OBJETO: Llave ennegrecida` o `PISTA: Melissandre sigue viva`.
                </div>
              )}
            </div>
          </Panel>
        </div>
      </div>
    );
  }

  function renderCreatureWorkspace() {
    return (
      <div className="grid gap-6">
        <Panel className="p-6">
          <SectionTitle
            icon={PawPrint}
            eyebrow="Mascotas y transformaciones"
            title="Biblioteca viva de criaturas"
            subtitle="Guardá formas de druida, mascotas o aliados y abrí la ficha completa dentro de la misma página."
          />

          <div className="mt-6 grid gap-4 lg:grid-cols-[0.95fr_1.05fr]">
            <div className="rounded-[24px] border border-amber-200/10 bg-[rgba(10,7,5,0.5)] p-4">
              <div className="text-xs uppercase tracking-[0.28em] text-amber-100/45">Reglas rápidas</div>
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <label className="block">
                  <span className="mb-2 block text-xs uppercase tracking-[0.28em] text-amber-100/45">
                    Nivel druida
                  </span>
                  <input
                    type="number"
                    min="2"
                    max="20"
                    value={druidLevel}
                    onChange={(event) => handleDruidLevelChange(event.target.value)}
                    className="h-11 w-full rounded-2xl border border-amber-200/10 bg-[rgba(10,7,5,0.62)] px-4 text-sm text-stone-100 outline-none"
                  />
                </label>

                <label className="block">
                  <span className="mb-2 block text-xs uppercase tracking-[0.28em] text-amber-100/45">
                    Círculo
                  </span>
                  <select
                    value={isMoonDruid ? "moon" : "standard"}
                    onChange={(event) => setIsMoonDruid(event.target.value === "moon")}
                    className="h-11 w-full rounded-2xl border border-amber-200/10 bg-[rgba(10,7,5,0.62)] px-4 text-sm text-stone-100 outline-none"
                  >
                    <option value="moon">Círculo de la Luna</option>
                    <option value="standard">Druida común</option>
                  </select>
                </label>
              </div>

              <div className="mt-4 rounded-[22px] border border-amber-200/10 bg-[rgba(16,11,9,0.82)] p-4 text-sm text-stone-300">
                <div className="flex flex-wrap gap-2">
                  <BadgePill>CR máximo {formatChallengeRating(wildshapeMaxChallenge)}</BadgePill>
                  <BadgePill tone="subtle">{isMoonDruid ? "Luna" : "Forma base"}</BadgePill>
                  {moonElementalsEnabled ? <BadgePill tone="success">Elementales habilitados</BadgePill> : null}
                </div>
                <p className="mt-3 leading-relaxed text-stone-400">
                  La lista filtra por CR y, si sos del Círculo de la Luna de nivel 10 o más, suma también los elementales SRD. Al abrir la ficha ves CA, PG, ataques, rasgos y acciones sin salir del journal.
                </p>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="rounded-[24px] border border-amber-200/10 bg-[rgba(10,7,5,0.5)] p-4">
                <div className="text-xs uppercase tracking-[0.28em] text-amber-100/45">Formas guardadas</div>
                <div className="mt-3 font-display text-4xl text-amber-100">{savedWildshapes.length}</div>
                <p className="mt-2 text-sm text-stone-400">
                  Transformaciones listas para abrir al instante durante la partida.
                </p>
              </div>

              <div className="rounded-[24px] border border-amber-200/10 bg-[rgba(10,7,5,0.5)] p-4">
                <div className="text-xs uppercase tracking-[0.28em] text-amber-100/45">Mascotas guardadas</div>
                <div className="mt-3 font-display text-4xl text-amber-100">{savedCompanions.length}</div>
                <p className="mt-2 text-sm text-stone-400">
                  Animales, aliados o compañías recurrentes con acceso rápido a la ficha.
                </p>
              </div>
            </div>

            <div className="rounded-[24px] border border-amber-200/10 bg-[rgba(10,7,5,0.5)] p-4">
              <div className="text-xs uppercase tracking-[0.28em] text-amber-100/45">
                Importación rápida
              </div>
              <div className="mt-3 grid gap-3 lg:grid-cols-[1.2fr_0.45fr_auto]">
                <input
                  value={creatureImportRef}
                  onChange={(event) => setCreatureImportRef(event.target.value)}
                  placeholder="Pegá un nombre, índice SRD o enlace de bestiario compatible..."
                  className="h-12 w-full rounded-2xl border border-amber-200/10 bg-[rgba(10,7,5,0.62)] px-4 text-sm text-stone-100 outline-none placeholder:text-stone-500"
                />
                <select
                  value={creatureImportKind}
                  onChange={(event) => setCreatureImportKind(event.target.value)}
                  className="h-12 w-full rounded-2xl border border-amber-200/10 bg-[rgba(10,7,5,0.62)] px-4 text-sm text-stone-100 outline-none"
                >
                  <option value="companion">Guardar como mascota</option>
                  <option value="wildshape">Guardar como forma</option>
                </select>
                <ButtonPill
                  onClick={handleImportCreatureReference}
                  disabled={!creatureImportRef.trim() || creatureImportBusy}
                  className="h-12 px-5"
                >
                  {creatureImportBusy ? "Importando..." : "Importar"}
                </ButtonPill>
              </div>
              <p className="mt-3 text-sm leading-relaxed text-stone-400">
                Acepta nombres en español o inglés, índices SRD y enlaces estilo bestiario. También
                intenta leer links compatibles de 5etools cuando la criatura exista en la SRD.
              </p>
            </div>
          </div>
        </Panel>
        <div className="grid gap-6 xl:grid-cols-2">
          <Panel className="p-6">
            <SectionTitle
              icon={Shield}
              eyebrow="Wildshape"
              title="Formas sugeridas"
              subtitle="Buscalas por nombre en toda la biblioteca SRD y filtralas por momento de uso, CR u orden para tener a mano la mejor opción."
            />

            <div className="mt-6 grid gap-4 md:grid-cols-2">
              <input
                value={wildshapeSearch}
                onChange={(event) => setWildshapeSearch(event.target.value)}
                placeholder="Buscar bestia o elemental por nombre..."
                className="h-12 w-full rounded-2xl border border-amber-200/10 bg-[rgba(10,7,5,0.62)] px-4 text-sm text-stone-100 outline-none placeholder:text-stone-500"
              />

              <select
                value={wildshapeMomentFilter}
                onChange={(event) => setWildshapeMomentFilter(event.target.value)}
                className="h-12 w-full rounded-2xl border border-amber-200/10 bg-[rgba(10,7,5,0.62)] px-4 text-sm text-stone-100 outline-none"
              >
                <option value="all">Todo momento</option>
                <option value="tank">Tanque</option>
                <option value="scout">Exploración</option>
                <option value="fly">Vuelo</option>
                <option value="swim">Nado</option>
                <option value="climb">Trepar</option>
                {moonElementalsEnabled ? <option value="elemental">Elementales</option> : null}
              </select>
            </div>

            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <select
                value={wildshapeCrFilter}
                onChange={(event) => setWildshapeCrFilter(event.target.value)}
                className="h-12 w-full rounded-2xl border border-amber-200/10 bg-[rgba(10,7,5,0.62)] px-4 text-sm text-stone-100 outline-none"
              >
                <option value="compatible">CR compatible</option>
                {wildshapeCrOptions.map((cr) => (
                  <option key={cr} value={cr}>
                    CR {cr}
                  </option>
                ))}
              </select>

              <select
                value={wildshapeSortBy}
                onChange={(event) => setWildshapeSortBy(event.target.value)}
                className="h-12 w-full rounded-2xl border border-amber-200/10 bg-[rgba(10,7,5,0.62)] px-4 text-sm text-stone-100 outline-none"
              >
                <option value="cr">Ordenar por CR</option>
                <option value="hp">Ordenar por PG</option>
                <option value="ac">Ordenar por CA</option>
                <option value="name">Ordenar por nombre</option>
              </select>
            </div>

            {wildshapeState.error ? (
              <div className="mt-4 rounded-[22px] border border-rose-300/20 bg-rose-500/10 p-4 text-sm text-rose-100">
                {wildshapeState.error}
              </div>
            ) : null}

            <div className="mt-6 grid gap-4 md:grid-cols-2">
              {wildshapeState.loading ? (
                <div className="col-span-full rounded-[22px] border border-amber-200/10 bg-[rgba(10,7,5,0.55)] p-4 text-sm text-stone-400">
                  Cargando formas compatibles...
                </div>
              ) : !filteredWildshapeItems.length ? (
                <div className="col-span-full rounded-[22px] border border-amber-200/10 bg-[rgba(10,7,5,0.55)] p-4 text-sm text-stone-400">
                  No encontré formas para esos filtros.
                </div>
              ) : (
                filteredWildshapeItems.map((creature) => (
                  <CreatureCard
                    key={`wildshape-${creature.index}`}
                    creature={creature}
                    actionLabel="Guardar forma"
                    onSave={(item) => handleSaveCreature(item, "wildshape")}
                    onOpenDetail={openCreatureDetail}
                  />
                ))
              )}
            </div>
          </Panel>

          <Panel className="p-6">
            <SectionTitle
              icon={PawPrint}
              eyebrow="Compañía"
              title="Mascotas y aliados"
              subtitle="Una sección separada para criaturas compañeras, invocadas o adoptadas, con importación rápida por nombre o enlace."
            />

            <div className="mt-6 grid gap-4 md:grid-cols-2">
              <input
                value={companionSearch}
                onChange={(event) => setCompanionSearch(event.target.value)}
                placeholder="Buscar criatura por nombre..."
                className="h-12 w-full rounded-2xl border border-amber-200/10 bg-[rgba(10,7,5,0.62)] px-4 text-sm text-stone-100 outline-none placeholder:text-stone-500"
              />

              <select
                value={companionCrFilter}
                onChange={(event) => setCompanionCrFilter(event.target.value)}
                className="h-12 w-full rounded-2xl border border-amber-200/10 bg-[rgba(10,7,5,0.62)] px-4 text-sm text-stone-100 outline-none"
              >
                <option value="any">Cualquier CR</option>
                {companionCrOptions.map((cr) => (
                  <option key={cr} value={cr}>
                    CR {cr}
                  </option>
                ))}
              </select>
            </div>

            {companionState.error ? (
              <div className="mt-4 rounded-[22px] border border-rose-300/20 bg-rose-500/10 p-4 text-sm text-rose-100">
                {companionState.error}
              </div>
            ) : null}

            <div className="mt-6 grid gap-4 md:grid-cols-2">
              {companionState.loading ? (
                <div className="col-span-full rounded-[22px] border border-amber-200/10 bg-[rgba(10,7,5,0.55)] p-4 text-sm text-stone-400">
                  Cargando criaturas recomendadas...
                </div>
              ) : !filteredCompanionItems.length ? (
                <div className="col-span-full rounded-[22px] border border-amber-200/10 bg-[rgba(10,7,5,0.55)] p-4 text-sm text-stone-400">
                  No encontré criaturas para ese CR.
                </div>
              ) : (
                filteredCompanionItems.map((creature) => (
                  <CreatureCard
                    key={`companion-${creature.index}`}
                    creature={creature}
                    actionLabel="Guardar mascota"
                    onSave={(item) => handleSaveCreature(item, "companion")}
                    onOpenDetail={openCreatureDetail}
                  />
                ))
              )}
            </div>
          </Panel>
        </div>

        <div className="grid gap-6 xl:grid-cols-2">
          <Panel className="p-6">
            <SectionTitle
              icon={Shield}
              eyebrow="Preparadas"
              title="Tus formas guardadas"
              subtitle="Abrí la ficha completa o limpiá la lista según la necesidad del personaje."
            />

            <div className="mt-6 space-y-4">
              {savedWildshapes.length ? (
                savedWildshapes.map((creature) => (
                  <SavedCreatureCard
                    key={`saved-form-${creature.index}`}
                    creature={creature}
                    label="Forma"
                    onRemove={(index) => handleRemoveSavedCreature("wildshape", index)}
                    onOpenDetail={openCreatureDetail}
                  />
                ))
              ) : (
                <div className="rounded-[22px] border border-amber-200/10 bg-[rgba(10,7,5,0.55)] p-4 text-sm text-stone-400">
                  Todavía no guardaste formas. Usá la biblioteca de arriba para prepararlas.
                </div>
              )}
            </div>
          </Panel>

          <Panel className="p-6">
            <SectionTitle
              icon={PawPrint}
              eyebrow="Acompañamiento"
              title="Tus mascotas guardadas"
              subtitle="Pensado para compañeros animales, criaturas adoptadas o apoyos frecuentes."
            />

            <div className="mt-6 space-y-4">
              {savedCompanions.length ? (
                savedCompanions.map((creature) => (
                  <SavedCreatureCard
                    key={`saved-companion-${creature.index}`}
                    creature={creature}
                    label="Mascota"
                    onRemove={(index) => handleRemoveSavedCreature("companion", index)}
                    onOpenDetail={openCreatureDetail}
                  />
                ))
              ) : (
                <div className="rounded-[22px] border border-amber-200/10 bg-[rgba(10,7,5,0.55)] p-4 text-sm text-stone-400">
                  Todavía no guardaste mascotas o criaturas compañeras.
                </div>
              )}
            </div>
          </Panel>
        </div>
      </div>
    );
  }

  function renderActiveSection() {
    if (!selectedCampaign) {
      return renderDashboard();
    }

    if (activeTab === "dashboard") {
      return renderDashboard();
    }

    if (activeTab === "creatures") {
      return renderCreatureWorkspace();
    }

    const config = sectionConfigs[activeTab];
    if (!config) return null;

    return (
      <EditableSection
        title={config.title}
        subtitle={config.subtitle}
        eyebrow={config.eyebrow}
        icon={config.icon}
        items={collections[activeTab] || []}
        fields={config.fields}
        validateDraft={config.validateDraft}
        loading={appLoading && !collections[activeTab]?.length}
        emptyText={config.emptyText}
        onCreate={(draft) => handleCreateItem(activeTab, draft)}
        onUpdate={(itemId, draft) => handleUpdateItem(activeTab, itemId, draft)}
        onDelete={(itemId) => handleDeleteItem(activeTab, itemId)}
        onMove={(itemId, direction) => handleMoveItem(activeTab, itemId, direction)}
        onFieldChange={(fieldKey, value) => handleSectionFieldChange(activeTab, fieldKey, value)}
        renderDisplay={config.renderDisplay}
      />
    );
  }

  if (!session) {
    return (
      <LoginScreen
        authMode="Supabase email/password"
        loading={authLoading}
        errorMessage={authError}
        statusMessage={authStatus}
        confirmationPendingEmail={confirmationPendingEmail}
        isConfigured={isSupabaseConfigured}
        onSignIn={handleSignIn}
        onSignUp={handleSignUp}
        onResendConfirmation={handleResendConfirmation}
      />
    );
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,rgba(241,191,105,0.14),transparent_22%),linear-gradient(180deg,#120d0a_0%,#060403_100%)] text-stone-100">
      <div className="mx-auto max-w-7xl px-3 py-4 pb-24 sm:px-4 md:px-6 md:py-6 md:pb-6">
        <Panel className="p-4 sm:p-5">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
            <div>
              <div className="text-xs uppercase tracking-[0.35em] text-amber-100/50">DyD journal</div>
              <div className="mt-2 font-display text-2xl text-stone-50 sm:text-3xl">
                {selectedCampaign?.title || "Sin campaña activa"}
              </div>
              <p className="mt-2 max-w-2xl text-sm text-stone-400">
                Diario de mesa responsive con auth real, secciones editables y acceso rápido a criaturas.
              </p>
            </div>

            <div className="flex w-full flex-col gap-3 xl:w-auto xl:min-w-[22rem]">
              {campaigns.length ? (
                <label className="w-full xl:min-w-[220px]">
                  <span className="mb-2 block text-xs uppercase tracking-[0.28em] text-amber-100/45">
                    Campaña
                  </span>
                  <select
                    value={selectedCampaignId}
                    onChange={(event) => setSelectedCampaignId(event.target.value)}
                    className="h-11 w-full rounded-2xl border border-amber-200/10 bg-[rgba(10,7,5,0.62)] px-4 text-sm text-stone-100 outline-none"
                  >
                    {campaigns.map((campaign) => (
                      <option key={campaign.id} value={campaign.id}>
                        {campaign.title}
                      </option>
                    ))}
                  </select>
                </label>
              ) : null}

              <label className="w-full xl:min-w-[260px]">
                <span className="mb-2 block text-xs uppercase tracking-[0.28em] text-amber-100/45">
                  Búsqueda global
                </span>
                <div className="relative">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-500" />
                  <input
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    placeholder="Buscar nombres, pistas, objetos..."
                    disabled={!selectedCampaign}
                    className="h-11 w-full rounded-2xl border border-amber-200/10 bg-[rgba(10,7,5,0.62)] pl-10 pr-4 text-sm text-stone-100 outline-none placeholder:text-stone-500"
                  />
                </div>
              </label>

              <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap xl:justify-end">
                <ButtonPill onClick={openCreateCampaign} className="w-full sm:w-auto">Nueva campaña</ButtonPill>
                {selectedCampaign ? (
                  <ButtonPill onClick={openEditCampaign} className="w-full sm:w-auto">
                    Editar campaña
                  </ButtonPill>
                ) : null}
                <ButtonPill onClick={handleExportDossier} disabled={!selectedCampaign} className="w-full sm:w-auto">
                  Exportar
                </ButtonPill>
                <ButtonPill primary onClick={() => setBookOpen(true)} disabled={!selectedCampaign} className="w-full sm:w-auto">
                  Bitácora
                </ButtonPill>
                <ButtonPill onClick={handleSignOut} className="col-span-2 w-full sm:col-span-1 sm:w-auto">
                  <span className="inline-flex items-center gap-2">
                    <LogOut className="h-4 w-4" />
                    Salir
                  </span>
                </ButtonPill>
              </div>
            </div>
          </div>

          <div className="mt-5 hidden gap-2 overflow-x-auto pb-1 md:flex">
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const active = item.id === activeTab;

              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setActiveTab(item.id)}
                  className={`inline-flex shrink-0 items-center gap-2 rounded-full border px-4 py-2 text-sm transition ${
                    active
                      ? "border-amber-200/20 bg-amber-300/10 text-amber-100"
                      : "border-white/10 bg-white/[0.03] text-stone-300 hover:text-stone-100"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                </button>
              );
            })}
          </div>
        </Panel>

        {appError ? (
          <div className="mt-6 rounded-[24px] border border-rose-300/20 bg-rose-500/10 px-5 py-4 text-sm text-rose-100">
            {appError}
          </div>
        ) : null}

        {appStatus ? (
          <div className="mt-4 rounded-[24px] border border-emerald-300/20 bg-emerald-500/10 px-5 py-4 text-sm text-emerald-100">
            {appStatus}
          </div>
        ) : null}

        {busySectionKey ? (
          <div className="mt-4 rounded-[24px] border border-amber-200/10 bg-amber-300/10 px-5 py-4 text-sm text-amber-100">
            Guardando cambios en {sectionConfigs[busySectionKey]?.title?.toLowerCase() || "la sección"}...
          </div>
        ) : null}

        <div className="mt-6">
          <SearchGroupPanel groups={searchGroups} query={deferredSearch} />
        </div>

        <div className="mt-6">
          <SectionErrorBoundary
            resetKey={`${selectedCampaignId}-${activeTab}`}
            onFallback={() => setActiveTab("dashboard")}
          >
            {renderActiveSection()}
          </SectionErrorBoundary>
        </div>
      </div>

      <div className="fixed inset-x-3 bottom-3 z-40 md:hidden">
        <div className="hide-scrollbar flex gap-2 overflow-x-auto rounded-[24px] border border-amber-200/10 bg-[rgba(18,13,10,0.94)] p-2 shadow-[0_18px_40px_rgba(0,0,0,0.35)] backdrop-blur">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const active = item.id === activeTab;

            return (
              <button
                key={`mobile-${item.id}`}
                type="button"
                onClick={() => setActiveTab(item.id)}
                className={`flex min-w-[88px] shrink-0 flex-col items-center gap-1 rounded-[18px] px-3 py-2 text-[11px] transition ${
                  active
                    ? "bg-amber-300/12 text-amber-100"
                    : "bg-transparent text-stone-400"
                }`}
              >
                <Icon className="h-4 w-4" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      <BookOverlay
        open={bookOpen}
        onClose={() => setBookOpen(false)}
        campaignName={selectedCampaign?.title || "Bitácora"}
        noteValue={journalBody}
        onNoteChange={(value) => {
          setJournalBody(value);
          setNoteDirty(true);
        }}
        saveMessage={saveMessage}
        placeholderLines={[
          "Usa esta doble pagina para repasar, escribir y ordenar ideas antes de la sesion.",
          "Los nombres, pistas y objetos que se repiten pueden transformarse en apartados propios.",
          "Si estas en plena partida, la biblioteca de criaturas queda lista para abrir fichas al instante.",
        ]}
      />

      <CreatureDetailModal
        creature={creatureDetailState.creature}
        loading={creatureDetailState.loading}
        error={creatureDetailState.error}
        onClose={() =>
          setCreatureDetailState({
            creature: null,
            loading: false,
            error: "",
          })
        }
      />
    </div>
  );
}
