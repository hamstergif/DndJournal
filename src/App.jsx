import React, { useEffect, useMemo, useState } from "react";
import {
  BookOpen,
  Castle,
  Cloud,
  Compass,
  Crown,
  Flame,
  LogOut,
  MapPinned,
  Menu,
  PawPrint,
  ScrollText,
  Search,
  Shield,
  Sparkles,
  Swords,
  Users,
} from "lucide-react";
import {
  campaigns,
  characters,
  featuredCompanionIndices,
  featuredTransformationIndices,
  inventory,
  journalPlaceholders,
  knowledge,
  locations,
  navItems,
  quests,
  sessions,
} from "./data";
import { BookOverlay } from "./components/BookOverlay";
import { CollectionSection } from "./components/CollectionSection";
import { CreatureCard, SavedCreatureCard } from "./components/CreatureCard";
import { LoginScreen } from "./components/LoginScreen";
import { SearchGroupPanel } from "./components/SearchGroupPanel";
import { BadgePill, ButtonPill, InfoCard, MetricCard, Panel, SectionTitle } from "./components/ui";
import { formatChallengeRating, loadCompanionCards, loadWildshapeCards } from "./lib/srd";
import { downloadTextFile, readStorage, writeStorage } from "./lib/storage";

const STORAGE_KEYS = {
  session: "dyd-journal-session-v1",
  selectedCampaign: "dyd-journal-selected-campaign-v1",
  notes: "dyd-journal-notes-v3",
  savedForms: "dyd-journal-saved-forms-v1",
  savedCompanions: "dyd-journal-saved-companions-v1",
};

const AUTH_MODE = import.meta.env.VITE_AUTH_MODE || "local-demo";

const navIconMap = {
  dashboard: Crown,
  characters: Users,
  quests: ScrollText,
  locations: MapPinned,
  knowledge: BookOpen,
  sessions: Flame,
  inventory: Shield,
  creatures: PawPrint,
};

function normalizeText(value = "") {
  return value.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

function getDruidWildShapeMaxCR(level, isMoonDruid) {
  const safeLevel = Number.isFinite(level) ? Math.max(2, Math.min(20, level)) : 2;

  if (isMoonDruid) {
    if (safeLevel >= 18) return 6;
    if (safeLevel >= 15) return 5;
    if (safeLevel >= 12) return 4;
    if (safeLevel >= 9) return 3;
    if (safeLevel >= 6) return 2;
    return 1;
  }

  if (safeLevel >= 8) return 1;
  if (safeLevel >= 4) return 0.5;
  return 0.25;
}

function upsertCreatureEntry(collection, creature) {
  return [
    { ...creature, savedAt: new Date().toISOString() },
    ...collection.filter((item) => item.index !== creature.index),
  ].slice(0, 12);
}

export default function App() {
  const [session, setSession] = useState(() => readStorage(STORAGE_KEYS.session, null));
  const [selectedCampaignId, setSelectedCampaignId] = useState(() => {
    const savedId = readStorage(STORAGE_KEYS.selectedCampaign, campaigns[0].id);
    return campaigns.some((campaign) => campaign.id === savedId) ? savedId : campaigns[0].id;
  });
  const [activeTab, setActiveTab] = useState("dashboard");
  const [mobileOpen, setMobileOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [bookOpen, setBookOpen] = useState(false);
  const [notesByCampaign, setNotesByCampaign] = useState(() => readStorage(STORAGE_KEYS.notes, {}));
  const [saveMessage, setSaveMessage] = useState("Autoguardado listo en este dispositivo");
  const [druidLevel, setDruidLevel] = useState(10);
  const [isMoonDruid, setIsMoonDruid] = useState(true);
  const [wildshapeSearch, setWildshapeSearch] = useState("");
  const [companionSearch, setCompanionSearch] = useState("");
  const [wildshapeState, setWildshapeState] = useState({ loading: false, error: "", items: [] });
  const [companionState, setCompanionState] = useState({ loading: false, error: "", items: [] });
  const [savedForms, setSavedForms] = useState(() => readStorage(STORAGE_KEYS.savedForms, []));
  const [savedCompanions, setSavedCompanions] = useState(() =>
    readStorage(STORAGE_KEYS.savedCompanions, []),
  );
  const [systemMessage, setSystemMessage] = useState("Panel listo para la próxima sesión");

  const selectedCampaign =
    campaigns.find((campaign) => campaign.id === selectedCampaignId) || campaigns[0];
  const currentNotes = notesByCampaign[selectedCampaign.id] ?? "";
  const maxWildShapeCR = getDruidWildShapeMaxCR(druidLevel, isMoonDruid);

  useEffect(() => writeStorage(STORAGE_KEYS.session, session), [session]);
  useEffect(() => writeStorage(STORAGE_KEYS.selectedCampaign, selectedCampaignId), [selectedCampaignId]);
  useEffect(() => writeStorage(STORAGE_KEYS.savedForms, savedForms), [savedForms]);
  useEffect(() => writeStorage(STORAGE_KEYS.savedCompanions, savedCompanions), [savedCompanions]);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      writeStorage(STORAGE_KEYS.notes, notesByCampaign);
      setSaveMessage("Guardado en este dispositivo");
    }, 450);

    return () => window.clearTimeout(timeout);
  }, [notesByCampaign]);

  useEffect(() => {
    let cancelled = false;
    setWildshapeState((previous) => ({ ...previous, loading: true, error: "" }));

    loadWildshapeCards(wildshapeSearch, maxWildShapeCR, featuredTransformationIndices)
      .then((items) => {
        if (!cancelled) setWildshapeState({ loading: false, error: "", items });
      })
      .catch(() => {
        if (!cancelled) {
          setWildshapeState({
            loading: false,
            error: "No pude conectar con la fuente SRD para las transformaciones.",
            items: [],
          });
        }
      });

    return () => {
      cancelled = true;
    };
  }, [wildshapeSearch, maxWildShapeCR]);

  useEffect(() => {
    let cancelled = false;
    setCompanionState((previous) => ({ ...previous, loading: true, error: "" }));

    loadCompanionCards(companionSearch, featuredCompanionIndices)
      .then((items) => {
        if (!cancelled) setCompanionState({ loading: false, error: "", items });
      })
      .catch(() => {
        if (!cancelled) {
          setCompanionState({
            loading: false,
            error: "No pude conectar con la fuente SRD para mascotas o criaturas aliadas.",
            items: [],
          });
        }
      });

    return () => {
      cancelled = true;
    };
  }, [companionSearch]);

  const filteredSections = useMemo(() => {
    const q = normalizeText(search.trim());
    if (!q) return { characters, quests, locations, knowledge, sessions, inventory };

    const matches = (value) => normalizeText(value).includes(q);

    return {
      characters: characters.filter((item) => matches(`${item.name} ${item.role} ${item.note} ${item.tag}`)),
      quests: quests.filter((item) => matches(`${item.title} ${item.status} ${item.detail}`)),
      locations: locations.filter((item) => matches(`${item.title} ${item.type} ${item.detail}`)),
      knowledge: knowledge.filter((item) => matches(`${item.title} ${item.text} ${item.kind}`)),
      sessions: sessions.filter((item) => matches(`${item.title} ${item.detail}`)),
      inventory: inventory.filter((item) => matches(`${item.name} ${item.meta} ${item.holder}`)),
    };
  }, [search]);

  const globalSearchGroups = useMemo(() => {
    const q = normalizeText(search.trim());
    if (!q) return [];

    const noteItems = currentNotes
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean)
      .filter((line) => normalizeText(line).includes(q))
      .slice(0, 3)
      .map((line, index) => ({
        title: `Entrada ${index + 1}`,
        meta: selectedCampaign.name,
        text: line,
      }));

    return [
      {
        title: "Personajes",
        icon: Users,
        items: filteredSections.characters.slice(0, 3).map((item) => ({
          title: item.name,
          meta: item.role,
          badge: item.tag,
          text: item.note,
        })),
      },
      {
        title: "Misiones",
        icon: ScrollText,
        items: filteredSections.quests.slice(0, 3).map((item) => ({
          title: item.title,
          meta: "Misión",
          badge: item.status,
          text: item.detail,
        })),
      },
      {
        title: "Locaciones",
        icon: MapPinned,
        items: filteredSections.locations.slice(0, 3).map((item) => ({
          title: item.title,
          meta: item.type,
          badge: "Mapa",
          text: item.detail,
        })),
      },
      { title: "Bitácora", icon: BookOpen, items: noteItems },
      {
        title: "Sesiones",
        icon: Flame,
        items: filteredSections.sessions.slice(0, 3).map((item) => ({
          title: item.title,
          meta: "Recap",
          badge: "Sesión",
          text: item.detail,
        })),
      },
      {
        title: "Objetos",
        icon: Shield,
        items: filteredSections.inventory.slice(0, 3).map((item) => ({
          title: item.name,
          meta: item.holder,
          badge: item.meta,
          text: `Poseedor actual: ${item.holder}.`,
        })),
      },
    ].filter((group) => group.items.length);
  }, [currentNotes, filteredSections, search, selectedCampaign.name]);

  const notesPreview = currentNotes.trim()
    ? currentNotes.split("\n").map((line) => line.trim()).filter(Boolean).slice(0, 2)
    : journalPlaceholders[selectedCampaign.id]?.slice(0, 2) || [];

  const navItemsWithIcons = navItems.map((item) => ({ ...item, icon: navIconMap[item.id] }));

  const handleLogin = ({ email }) => {
    const prettyName = email
      .split("@")[0]
      .replace(/[._-]/g, " ")
      .split(" ")
      .filter(Boolean)
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join(" ");

    setSession({
      email,
      name: prettyName || "Aventurero",
      provider: "credentials",
      mode: AUTH_MODE,
      createdAt: new Date().toISOString(),
    });
  };

  const handleExportDossier = () => {
    const lines = [
      `# ${selectedCampaign.name}`,
      "",
      `Estado: ${selectedCampaign.status}`,
      `Ambientación: ${selectedCampaign.setting}`,
      `Última sesión: ${selectedCampaign.lastSession}`,
      "",
      "## Resumen",
      selectedCampaign.summary,
      "",
      "## Foco actual",
      selectedCampaign.focus,
      "",
      "## Próximo paso",
      selectedCampaign.nextMove,
      "",
      "## Personajes",
      ...characters.map((item) => `- ${item.name} (${item.role}): ${item.note}`),
      "",
      "## Misiones",
      ...quests.map((item) => `- ${item.title} [${item.status}]: ${item.detail}`),
      "",
      "## Locaciones",
      ...locations.map((item) => `- ${item.title} (${item.type}): ${item.detail}`),
      "",
      "## Objetos",
      ...inventory.map((item) => `- ${item.name} (${item.meta}) · ${item.holder}`),
      "",
      "## Formas guardadas",
      ...(savedForms.length
        ? savedForms.map((creature) => `- ${creature.name} · CR ${creature.challengeLabel}`)
        : ["- Sin formas guardadas todavía."]),
      "",
      "## Mascotas guardadas",
      ...(savedCompanions.length
        ? savedCompanions.map((creature) => `- ${creature.name} · ${creature.type}`)
        : ["- Sin criaturas guardadas todavía."]),
      "",
      "## Bitácora",
      currentNotes.trim() || "Sin notas cargadas aún.",
    ];

    const safeName = selectedCampaign.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");

    downloadTextFile(`${safeName || "campaign"}-dossier.md`, lines.join("\n"));
    setSystemMessage("Dossier exportado");
  };

  const handleCampaignChange = (campaignId) => {
    setSelectedCampaignId(campaignId);
    setMobileOpen(false);
    setSaveMessage("Bitácora lista para esta campaña");
    setSystemMessage("Campaña cambiada");
  };

  const sidebar = (
    <div className="flex h-full flex-col gap-4">
      <Panel className="p-5">
        <div className="mb-4 flex items-center gap-3">
          <div className="rounded-2xl bg-[radial-gradient(circle_at_top,#f2ca7f,#b96d2d)] p-2 text-stone-950 shadow-lg shadow-amber-700/20">
            <Sparkles className="h-5 w-5" />
          </div>
          <div>
            <div className="text-xs uppercase tracking-[0.35em] text-amber-100/55">Bitácora</div>
            <div className="font-display text-2xl text-stone-100">Crónica de Campaña</div>
          </div>
        </div>

        <div className="rounded-[24px] border border-amber-200/10 bg-[rgba(10,7,5,0.55)] p-4">
          <div className="text-xs uppercase tracking-[0.3em] text-amber-100/45">Sesión</div>
          <div className="mt-3 text-sm text-stone-300">{session?.name} · modo {session?.mode}</div>
          <div className="mt-2 text-xs leading-relaxed text-stone-500">
            Guardado local activo, estructura lista para conectar autenticación y nube.
          </div>
        </div>
      </Panel>

      <Panel className="p-4">
        <div className="mb-3 px-2 text-xs uppercase tracking-[0.3em] text-stone-500">Campañas</div>
        <div className="space-y-2">
          {campaigns.map((campaign) => (
            <button
              key={campaign.id}
              type="button"
              onClick={() => handleCampaignChange(campaign.id)}
              className={`w-full rounded-[22px] border px-4 py-4 text-left transition ${
                selectedCampaign.id === campaign.id
                  ? "border-amber-200/25 bg-amber-300/10"
                  : "border-white/5 bg-white/[0.02] hover:bg-white/[0.05]"
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="font-medium text-stone-100">{campaign.name}</div>
                  <div className="mt-1 text-xs text-stone-400">{campaign.setting}</div>
                </div>
                <BadgePill tone={campaign.status === "Activa" ? "success" : "subtle"}>
                  {campaign.status}
                </BadgePill>
              </div>
              <div className="mt-3 text-xs leading-relaxed text-stone-500">{campaign.focus}</div>
            </button>
          ))}
        </div>
      </Panel>

      <Panel className="p-4">
        <div className="mb-3 px-2 text-xs uppercase tracking-[0.3em] text-stone-500">Secciones</div>
        <div className="space-y-1">
          {navItemsWithIcons.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              type="button"
              onClick={() => {
                setActiveTab(id);
                setMobileOpen(false);
              }}
              className={`flex w-full items-center gap-3 rounded-[20px] px-3 py-3 text-sm transition ${
                activeTab === id
                  ? "bg-amber-300/10 text-amber-100"
                  : "text-stone-300 hover:bg-white/[0.04] hover:text-stone-100"
              }`}
            >
              <Icon className="h-4 w-4" />
              {label}
            </button>
          ))}
        </div>
      </Panel>

      <Panel className="p-4">
        <div className="text-xs uppercase tracking-[0.3em] text-amber-100/45">Estado actual</div>
        <div className="mt-3 space-y-3 text-sm text-stone-300">
          <div className="rounded-2xl border border-amber-200/10 bg-white/[0.03] p-3">
            Responsive en escritorio y celular.
          </div>
          <div className="rounded-2xl border border-amber-200/10 bg-white/[0.03] p-3">
            Diario, dossier exportable y SRD conectado.
          </div>
          <div className="rounded-2xl border border-amber-200/10 bg-white/[0.03] p-3">
            Próximo paso: auth real + base sincronizada.
          </div>
        </div>
      </Panel>

      <ButtonPill className="w-full" onClick={() => setSession(null)}>
        <span className="inline-flex items-center gap-2">
          <LogOut className="h-4 w-4" />
          Cerrar sesión
        </span>
      </ButtonPill>
    </div>
  );

  if (!session) {
    return (
      <LoginScreen
        authMode={AUTH_MODE}
        onLogin={handleLogin}
        onDemoLogin={(provider, name) =>
          setSession({
            email: "mesa-demo@campaign.quest",
            name,
            provider,
            mode: AUTH_MODE,
            createdAt: new Date().toISOString(),
          })
        }
      />
    );
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,rgba(242,201,124,0.12),transparent_24%),linear-gradient(180deg,#130e0b_0%,#080604_100%)] text-stone-100">
      {mobileOpen ? (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
          onClick={() => setMobileOpen(false)}
        >
          <div
            className="h-full w-[88vw] max-w-sm overflow-y-auto p-4"
            onClick={(event) => event.stopPropagation()}
          >
            {sidebar}
          </div>
        </div>
      ) : null}

      <div className="mx-auto max-w-[1600px] px-4 py-4 md:px-6 md:py-6">
        <div className="grid gap-6 lg:grid-cols-[320px_minmax(0,1fr)]">
          <aside className="hidden lg:block">{sidebar}</aside>

          <main className="space-y-5">
            <header className="rounded-[32px] border border-amber-200/10 bg-[rgba(18,13,10,0.82)] p-5 shadow-[0_18px_70px_rgba(0,0,0,0.25)] md:p-6">
              <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
                <div className="space-y-4">
                  <div className="flex items-center gap-3 lg:hidden">
                    <button
                      type="button"
                      onClick={() => setMobileOpen(true)}
                      className="rounded-2xl border border-amber-200/15 bg-white/[0.03] p-3 text-stone-100"
                    >
                      <Menu className="h-5 w-5" />
                    </button>
                    <div>
                      <div className="text-xs uppercase tracking-[0.3em] text-amber-100/50">
                        Campaña activa
                      </div>
                      <div className="font-display text-2xl text-stone-100">
                        {selectedCampaign.name}
                      </div>
                    </div>
                  </div>

                  <div className="hidden lg:block">
                    <div className="text-xs uppercase tracking-[0.35em] text-amber-100/50">
                      Campaña activa
                    </div>
                    <h1 className="mt-3 font-display text-5xl text-stone-100">
                      {selectedCampaign.name}
                    </h1>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <BadgePill tone={selectedCampaign.status === "Activa" ? "success" : "subtle"}>
                      {selectedCampaign.status}
                    </BadgePill>
                    <BadgePill tone="subtle">{selectedCampaign.setting}</BadgePill>
                    <BadgePill tone="subtle">SRD 2014 conectado</BadgePill>
                    <BadgePill tone="subtle">Responsive</BadgePill>
                  </div>

                  <p className="max-w-3xl text-sm leading-relaxed text-stone-300 md:text-base">
                    {selectedCampaign.summary}
                  </p>

                  <div className="flex flex-wrap items-center gap-4 text-xs text-stone-400 md:text-sm">
                    <span className="inline-flex items-center gap-2">
                      <Compass className="h-4 w-4" />
                      {selectedCampaign.lastSession}
                    </span>
                    <span className="inline-flex items-center gap-2">
                      <Cloud className="h-4 w-4" />
                      Guardado local listo para migrar a nube
                    </span>
                    <span className="inline-flex items-center gap-2">
                      <Users className="h-4 w-4" />
                      Acceso actual: {session.name}
                    </span>
                  </div>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <ButtonPill primary onClick={() => setBookOpen(true)}>
                    Abrir bitácora
                  </ButtonPill>
                  <ButtonPill onClick={handleExportDossier}>Exportar dossier</ButtonPill>
                  <div className="rounded-[24px] border border-amber-200/10 bg-white/[0.03] p-4 sm:col-span-2">
                    <div className="text-xs uppercase tracking-[0.3em] text-amber-100/45">
                      Estado de mesa
                    </div>
                    <div className="mt-2 font-medium text-stone-100">{systemMessage}</div>
                    <div className="mt-2 text-sm text-stone-400">{selectedCampaign.nextMove}</div>
                  </div>
                </div>
              </div>
            </header>

            <div className="hide-scrollbar -mx-4 overflow-x-auto px-4 lg:hidden">
              <div className="flex gap-2 pb-1">
                {navItemsWithIcons.map(({ id, label, icon: Icon }) => (
                  <button
                    key={id}
                    type="button"
                    onClick={() => setActiveTab(id)}
                    className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm whitespace-nowrap ${
                      activeTab === id
                        ? "border-amber-200/20 bg-amber-300/10 text-amber-100"
                        : "border-white/8 bg-white/[0.03] text-stone-300"
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    {label}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid gap-4 xl:grid-cols-[1fr_auto]">
              <div className="relative">
                <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-500" />
                <input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Buscar personajes, misiones, sesiones, locaciones, objetos o notas..."
                  className="h-14 w-full rounded-[26px] border border-amber-200/10 bg-[rgba(16,11,9,0.78)] pl-12 pr-4 text-stone-100 outline-none placeholder:text-stone-500 focus:border-amber-200/25"
                />
              </div>

              <div className="flex flex-wrap gap-2">
                <ButtonPill onClick={() => setActiveTab("creatures")}>Ir a mascotas</ButtonPill>
                <ButtonPill onClick={() => setActiveTab("sessions")}>Ver sesiones</ButtonPill>
              </div>
            </div>

            <SearchGroupPanel groups={globalSearchGroups} query={search} />

            {activeTab === "dashboard" ? (
              <div className="space-y-5">
                <Panel className={`overflow-hidden bg-gradient-to-br ${selectedCampaign.accent} p-[1px]`}>
                  <div className="rounded-[27px] bg-[rgba(16,11,9,0.94)] p-6">
                    <div className="grid gap-5 xl:grid-cols-[1.2fr_0.8fr]">
                      <div>
                        <SectionTitle
                          icon={Castle}
                          eyebrow="Resumen narrativo"
                          title="Todo lo importante antes de tirar iniciativa"
                          subtitle="Una vista pensada para retomar la campaña en menos de un minuto."
                        />

                        <div className="mt-5 grid gap-4 md:grid-cols-2">
                          <MetricCard
                            value={selectedCampaign.stats[0].value}
                            label={selectedCampaign.stats[0].label}
                            hint="La mesa ya sabe qué frente está más vivo."
                          />
                          <MetricCard
                            value={savedForms.length}
                            label="Formas guardadas"
                            hint="Tus favoritas quedan listas para combate o exploración."
                          />
                          <MetricCard
                            value={savedCompanions.length}
                            label="Mascotas guardadas"
                            hint="Ideal para monturas, aliados o bichitos adoptados."
                          />
                          <MetricCard
                            value={currentNotes.trim() ? currentNotes.trim().split(/\n+/).length : 0}
                            label="Entradas de diario"
                            hint="Se guardan automáticamente en este dispositivo."
                          />
                        </div>
                      </div>

                      <div className="space-y-4">
                        <div className="rounded-[24px] border border-amber-200/10 bg-[rgba(8,6,4,0.35)] p-5">
                          <div className="text-xs uppercase tracking-[0.3em] text-amber-100/45">
                            Foco actual
                          </div>
                          <div className="mt-3 font-medium text-stone-100">
                            {selectedCampaign.focus}
                          </div>
                          <p className="mt-3 text-sm leading-relaxed text-stone-400">
                            Próximo movimiento sugerido: {selectedCampaign.nextMove}
                          </p>
                        </div>

                        <div className="rounded-[24px] border border-amber-200/10 bg-[rgba(8,6,4,0.35)] p-5">
                          <div className="text-xs uppercase tracking-[0.3em] text-amber-100/45">
                            Preparación de mesa
                          </div>
                          <div className="mt-4 space-y-3 text-sm text-stone-300">
                            <div className="rounded-2xl border border-white/5 bg-white/[0.03] p-3">
                              Diario con autoguardado local y apertura tipo libro.
                            </div>
                            <div className="rounded-2xl border border-white/5 bg-white/[0.03] p-3">
                              Compendio SRD para guardar mascotas o formas útiles.
                            </div>
                            <div className="rounded-2xl border border-white/5 bg-white/[0.03] p-3">
                              Dossier exportable para compartir el estado de campaña.
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </Panel>

                <div className="grid gap-5 xl:grid-cols-3">
                  <Panel className="p-6">
                    <SectionTitle
                      icon={Users}
                      eyebrow="Elenco"
                      title="Personajes destacados"
                      subtitle="Quienes más pesan en la sesión de hoy."
                    />
                    <div className="mt-5 space-y-3">
                      {characters.slice(0, 3).map((item) => (
                        <div
                          key={item.name}
                          className="rounded-[24px] border border-amber-200/10 bg-[rgba(14,10,8,0.76)] p-4"
                        >
                          <div className="flex items-center justify-between gap-2">
                            <div className="font-medium text-stone-100">{item.name}</div>
                            <BadgePill tone="subtle">{item.tag}</BadgePill>
                          </div>
                          <div className="mt-1 text-xs uppercase tracking-[0.26em] text-amber-100/45">
                            {item.role}
                          </div>
                          <p className="mt-3 text-sm text-stone-400">{item.note}</p>
                        </div>
                      ))}
                    </div>
                  </Panel>

                  <Panel className="p-6">
                    <SectionTitle
                      icon={Swords}
                      eyebrow="Fricción"
                      title="Misiones en juego"
                      subtitle="Lo que empuja la próxima escena."
                    />
                    <div className="mt-5 space-y-3">
                      {quests.map((item) => (
                        <div
                          key={item.title}
                          className="rounded-[24px] border border-amber-200/10 bg-[rgba(14,10,8,0.76)] p-4"
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="font-medium text-stone-100">{item.title}</div>
                            <BadgePill>{item.status}</BadgePill>
                          </div>
                          <p className="mt-3 text-sm leading-relaxed text-stone-400">{item.detail}</p>
                        </div>
                      ))}
                    </div>
                  </Panel>

                  <Panel className="p-6">
                    <SectionTitle
                      icon={BookOpen}
                      eyebrow="Recap"
                      title="Últimas notas del diario"
                      subtitle="Ideal para volver a la ficción sin releer todo."
                    />
                    <div className="mt-5 space-y-3">
                      {notesPreview.map((line, index) => (
                        <div
                          key={`${line}-${index}`}
                          className="rounded-[24px] border border-amber-200/10 bg-[rgba(14,10,8,0.76)] p-4 text-sm leading-relaxed text-stone-300"
                        >
                          {line}
                        </div>
                      ))}
                      <ButtonPill className="w-full" onClick={() => setBookOpen(true)}>
                        Seguir escribiendo
                      </ButtonPill>
                    </div>
                  </Panel>
                </div>

                <div className="grid gap-5 xl:grid-cols-2">
                  <Panel className="p-6">
                    <SectionTitle
                      icon={MapPinned}
                      eyebrow="Mapa vivo"
                      title="Locaciones clave"
                      subtitle="Puntos que la mesa necesita ubicar rápido."
                    />
                    <div className="mt-5 grid gap-4 md:grid-cols-2">
                      {locations.map((item) => (
                        <InfoCard
                          key={item.title}
                          title={item.title}
                          badge={item.type}
                          description={item.detail}
                        />
                      ))}
                    </div>
                  </Panel>

                  <Panel className="p-6">
                    <SectionTitle
                      icon={PawPrint}
                      eyebrow="Biblioteca rápida"
                      title="Mascotas y formas guardadas"
                      subtitle="Tus fichas favoritas quedan listas para abrir en un clic."
                    />
                    <div className="mt-5 grid gap-4 md:grid-cols-2">
                      {savedForms.slice(0, 2).map((creature) => (
                        <SavedCreatureCard
                          key={`saved-form-${creature.index}`}
                          creature={creature}
                          label="Forma"
                          onRemove={(index) =>
                            setSavedForms((previous) =>
                              previous.filter((item) => item.index !== index),
                            )
                          }
                        />
                      ))}

                      {savedCompanions.slice(0, 2).map((creature) => (
                        <SavedCreatureCard
                          key={`saved-companion-${creature.index}`}
                          creature={creature}
                          label="Mascota"
                          onRemove={(index) =>
                            setSavedCompanions((previous) =>
                              previous.filter((item) => item.index !== index),
                            )
                          }
                        />
                      ))}

                      {!savedForms.length && !savedCompanions.length ? (
                        <div className="rounded-[24px] border border-amber-200/10 bg-[rgba(10,7,5,0.55)] p-5 text-sm text-stone-400 md:col-span-2">
                          Todavía no guardaste criaturas. Desde la sección de mascotas podés traer
                          bestias del SRD y dejar a mano las más útiles.
                        </div>
                      ) : null}
                    </div>
                  </Panel>
                </div>
              </div>
            ) : null}
            {activeTab !== "dashboard" && activeTab !== "creatures" ? (
              <CollectionSection sectionKey={activeTab} items={filteredSections[activeTab]} />
            ) : null}
            {activeTab === "creatures" ? (
              <div className="space-y-5">
                <Panel className="p-6">
                  <SectionTitle
                    icon={PawPrint}
                    eyebrow="SRD abierto"
                    title="Mascotas y transformaciones"
                    subtitle="El bestiario dejó de ser un bloque suelto: ahora separa formas del druida y criaturas que querés archivar como compañeras."
                  />

                  <div className="mt-6 grid gap-4 lg:grid-cols-4">
                    <MetricCard
                      value={druidLevel}
                      label="Nivel de druida"
                      hint="Se usa para calcular el CR máximo de forma salvaje."
                    />
                    <MetricCard
                      value={formatChallengeRating(maxWildShapeCR)}
                      label="CR máximo"
                      hint="Calculado para la referencia SRD 2014 que usa esta integración."
                    />
                    <MetricCard
                      value={savedForms.length}
                      label="Formas listas"
                      hint="Tus fichas guardadas para exploración, combate o scouting."
                    />
                    <MetricCard
                      value={savedCompanions.length}
                      label="Mascotas listas"
                      hint="Monturas, aliados o criaturas adoptadas con ficha al alcance."
                    />
                  </div>

                  <div className="mt-6 grid gap-4 xl:grid-cols-[0.95fr_1.05fr]">
                    <div className="rounded-[26px] border border-amber-200/10 bg-[rgba(12,8,6,0.55)] p-5">
                      <div className="text-xs uppercase tracking-[0.3em] text-amber-100/45">
                        Configuración druida
                      </div>
                      <div className="mt-4 grid gap-4 md:grid-cols-2">
                        <label className="block">
                          <span className="mb-2 block text-sm font-medium text-stone-200">
                            Nivel actual
                          </span>
                          <input
                            type="number"
                            min="2"
                            max="20"
                            value={druidLevel}
                            onChange={(event) =>
                              setDruidLevel(
                                Math.max(2, Math.min(20, Number(event.target.value) || 2)),
                              )
                            }
                            className="h-12 w-full rounded-2xl border border-amber-200/10 bg-[rgba(10,7,5,0.62)] px-4 text-lg font-semibold text-amber-100 outline-none"
                          />
                        </label>

                        <div>
                          <span className="mb-2 block text-sm font-medium text-stone-200">
                            Círculo
                          </span>
                          <div className="flex flex-wrap gap-2">
                            <button
                              type="button"
                              onClick={() => setIsMoonDruid(false)}
                              className={`rounded-full border px-4 py-2 text-sm ${
                                !isMoonDruid
                                  ? "border-amber-200/20 bg-amber-300/10 text-amber-100"
                                  : "border-white/10 bg-white/[0.03] text-stone-300"
                              }`}
                            >
                              Druida base
                            </button>
                            <button
                              type="button"
                              onClick={() => setIsMoonDruid(true)}
                              className={`rounded-full border px-4 py-2 text-sm ${
                                isMoonDruid
                                  ? "border-amber-200/20 bg-amber-300/10 text-amber-100"
                                  : "border-white/10 bg-white/[0.03] text-stone-300"
                              }`}
                            >
                              Círculo de la Luna
                            </button>
                          </div>
                        </div>
                      </div>

                      <div className="mt-4 rounded-2xl border border-amber-200/10 bg-white/[0.03] p-4 text-sm leading-relaxed text-stone-400">
                        Esta integración consulta la fuente abierta del SRD para evitar cargar
                        stats a mano y mantener una base consistente en el journal.
                      </div>
                    </div>

                    <div className="rounded-[26px] border border-amber-200/10 bg-[rgba(12,8,6,0.55)] p-5">
                      <div className="text-xs uppercase tracking-[0.3em] text-amber-100/45">
                        Qué resuelve
                      </div>
                      <div className="mt-4 grid gap-3 md:grid-cols-3">
                        <div className="rounded-2xl border border-white/5 bg-white/[0.03] p-4 text-sm text-stone-300">
                          Separa claramente formas del druida de mascotas o aliados.
                        </div>
                        <div className="rounded-2xl border border-white/5 bg-white/[0.03] p-4 text-sm text-stone-300">
                          Guarda tus criaturas favoritas para no buscarlas cada sesión.
                        </div>
                        <div className="rounded-2xl border border-white/5 bg-white/[0.03] p-4 text-sm text-stone-300">
                          Trae datos reales del SRD con links directos a la ficha fuente.
                        </div>
                      </div>
                    </div>
                  </div>
                </Panel>

                <div className="grid gap-5 xl:grid-cols-2">
                  <Panel className="p-6">
                    <SectionTitle
                      icon={Compass}
                      eyebrow="Forma salvaje"
                      title="Transformaciones SRD"
                      subtitle="Buscá bestias útiles para tu druida y dejalas listas con sus stats reales."
                    />

                    <div className="mt-5 flex flex-col gap-3 md:flex-row">
                      <div className="relative flex-1">
                        <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-500" />
                        <input
                          value={wildshapeSearch}
                          onChange={(event) => setWildshapeSearch(event.target.value)}
                          placeholder="Buscar bestias por nombre..."
                          className="h-12 w-full rounded-2xl border border-amber-200/10 bg-[rgba(10,7,5,0.62)] pl-12 pr-4 text-stone-100 outline-none placeholder:text-stone-500"
                        />
                      </div>
                      <BadgePill className="self-start md:self-center">
                        CR máximo {formatChallengeRating(maxWildShapeCR)}
                      </BadgePill>
                    </div>

                    {savedForms.length ? (
                      <div className="mt-5 grid gap-4">
                        {savedForms.map((creature) => (
                          <SavedCreatureCard
                            key={`form-${creature.index}`}
                            creature={creature}
                            label="Forma guardada"
                            onRemove={(index) =>
                              setSavedForms((previous) =>
                                previous.filter((item) => item.index !== index),
                              )
                            }
                          />
                        ))}
                      </div>
                    ) : null}

                    <div className="mt-5">
                      {wildshapeState.loading ? (
                        <div className="rounded-[24px] border border-amber-200/10 bg-[rgba(10,7,5,0.55)] p-5 text-sm text-stone-400">
                          Consultando criaturas SRD para las formas disponibles...
                        </div>
                      ) : null}

                      {wildshapeState.error ? (
                        <div className="rounded-[24px] border border-rose-300/20 bg-rose-500/10 p-5 text-sm text-rose-100">
                          {wildshapeState.error}
                        </div>
                      ) : null}

                      {!wildshapeState.loading && !wildshapeState.error ? (
                        <div className="grid gap-4 md:grid-cols-2">
                          {wildshapeState.items.length ? (
                            wildshapeState.items.map((creature) => (
                              <CreatureCard
                                key={`wildshape-${creature.index}`}
                                creature={creature}
                                actionLabel="Guardar forma"
                                onSave={(creatureToSave) => {
                                  setSavedForms((previous) =>
                                    upsertCreatureEntry(previous, creatureToSave),
                                  );
                                  setSystemMessage(
                                    `${creatureToSave.name} quedó guardada como forma.`,
                                  );
                                }}
                              />
                            ))
                          ) : (
                            <div className="rounded-[24px] border border-amber-200/10 bg-[rgba(10,7,5,0.55)] p-5 text-sm text-stone-400 md:col-span-2">
                              No encontré bestias compatibles con ese nombre y ese CR.
                            </div>
                          )}
                        </div>
                      ) : null}
                    </div>
                  </Panel>

                  <Panel className="p-6">
                    <SectionTitle
                      icon={PawPrint}
                      eyebrow="Compañeros"
                      title="Mascotas y criaturas aliadas"
                      subtitle="Para druidas, monturas, bichitos adoptados o cualquier criatura que quieras tener a mano."
                    />

                    <div className="mt-5 relative">
                      <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-500" />
                      <input
                        value={companionSearch}
                        onChange={(event) => setCompanionSearch(event.target.value)}
                        placeholder="Buscar criatura por nombre..."
                        className="h-12 w-full rounded-2xl border border-amber-200/10 bg-[rgba(10,7,5,0.62)] pl-12 pr-4 text-stone-100 outline-none placeholder:text-stone-500"
                      />
                    </div>

                    {savedCompanions.length ? (
                      <div className="mt-5 grid gap-4">
                        {savedCompanions.map((creature) => (
                          <SavedCreatureCard
                            key={`companion-${creature.index}`}
                            creature={creature}
                            label="Mascota guardada"
                            onRemove={(index) =>
                              setSavedCompanions((previous) =>
                                previous.filter((item) => item.index !== index),
                              )
                            }
                          />
                        ))}
                      </div>
                    ) : null}

                    <div className="mt-5">
                      {companionState.loading ? (
                        <div className="rounded-[24px] border border-amber-200/10 bg-[rgba(10,7,5,0.55)] p-5 text-sm text-stone-400">
                          Buscando criaturas del SRD para tu biblioteca de mascotas...
                        </div>
                      ) : null}

                      {companionState.error ? (
                        <div className="rounded-[24px] border border-rose-300/20 bg-rose-500/10 p-5 text-sm text-rose-100">
                          {companionState.error}
                        </div>
                      ) : null}

                      {!companionState.loading && !companionState.error ? (
                        <div className="grid gap-4 md:grid-cols-2">
                          {companionState.items.length ? (
                            companionState.items.map((creature) => (
                              <CreatureCard
                                key={`companion-card-${creature.index}`}
                                creature={creature}
                                actionLabel="Guardar criatura"
                                onSave={(creatureToSave) => {
                                  setSavedCompanions((previous) =>
                                    upsertCreatureEntry(previous, creatureToSave),
                                  );
                                  setSystemMessage(
                                    `${creatureToSave.name} quedó guardada como mascota o aliado.`,
                                  );
                                }}
                              />
                            ))
                          ) : (
                            <div className="rounded-[24px] border border-amber-200/10 bg-[rgba(10,7,5,0.55)] p-5 text-sm text-stone-400 md:col-span-2">
                              No encontré criaturas que coincidan con esa búsqueda.
                            </div>
                          )}
                        </div>
                      ) : null}
                    </div>
                  </Panel>
                </div>
              </div>
            ) : null}
          </main>
        </div>
      </div>

      <BookOverlay
        open={bookOpen}
        onClose={() => setBookOpen(false)}
        campaignName={selectedCampaign.name}
        noteValue={currentNotes}
        onNoteChange={(value) => {
          setSaveMessage("Guardando...");
          setNotesByCampaign((previous) => ({ ...previous, [selectedCampaign.id]: value }));
        }}
        saveMessage={saveMessage}
        placeholderLines={journalPlaceholders[selectedCampaign.id] || []}
      />
    </div>
  );
}
