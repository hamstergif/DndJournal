import React from "react";
import { BookOpen, Flame, MapPinned, ScrollText, Shield, Users } from "lucide-react";
import { InfoCard, Panel, SectionTitle } from "./ui";

const sectionMeta = {
  characters: {
    title: "Personajes",
    subtitle: "PJ, NPCs, aliados, antagonistas y contactos clave.",
    icon: Users,
  },
  quests: {
    title: "Misiones",
    subtitle: "Frentes abiertos, objetivos completados y asuntos investigando.",
    icon: ScrollText,
  },
  locations: {
    title: "Locaciones",
    subtitle: "Lugares vivos que la mesa necesita encontrar rápido.",
    icon: MapPinned,
  },
  knowledge: {
    title: "Conocimiento",
    subtitle: "Secretos, rumores, verdades parciales y teoría de la mesa.",
    icon: BookOpen,
  },
  sessions: {
    title: "Sesiones",
    subtitle: "Crónica rápida para retomar el hilo en segundos.",
    icon: Flame,
  },
  inventory: {
    title: "Objetos",
    subtitle: "Equipo, pistas, tesoro y piezas de misión.",
    icon: Shield,
  },
};

export function CollectionSection({ sectionKey, items }) {
  const { title, subtitle, icon } = sectionMeta[sectionKey];

  return (
    <Panel className="p-6">
      <SectionTitle icon={icon} eyebrow="Navegación" title={title} subtitle={subtitle} />

      {items.length ? (
        <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {sectionKey === "sessions"
            ? items.map((item) => (
                <div
                  key={item.title}
                  className="rounded-[24px] border border-amber-200/10 bg-[rgba(16,11,9,0.82)] p-5"
                >
                  <div className="font-medium text-stone-100">{item.title}</div>
                  <p className="mt-3 text-sm leading-relaxed text-stone-400">{item.detail}</p>
                </div>
              ))
            : items.map((item) => (
                <InfoCard
                  key={item.title || item.name}
                  title={item.title || item.name}
                  badge={item.status || item.type || item.kind || item.meta || item.tag}
                  description={
                    item.detail ||
                    item.note ||
                    item.text ||
                    `Poseedor: ${item.holder}`
                  }
                />
              ))}
        </div>
      ) : (
        <div className="mt-6 rounded-[24px] border border-amber-200/10 bg-[rgba(10,7,5,0.55)] p-5 text-sm text-stone-400">
          Esta búsqueda no devolvió resultados en {title.toLowerCase()}.
        </div>
      )}
    </Panel>
  );
}
