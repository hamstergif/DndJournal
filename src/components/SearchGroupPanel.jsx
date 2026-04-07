import React from "react";
import { Search } from "lucide-react";
import { BadgePill, Panel, SectionTitle } from "./ui";

export function SearchGroupPanel({ groups, query }) {
  if (!query.trim()) return null;

  return (
    <Panel className="p-6">
      <SectionTitle
        icon={Search}
        eyebrow="Búsqueda global"
        title={`Resultados para "${query}"`}
        subtitle="Ubicá nombres, escenas, locaciones o pistas sin cambiar de contexto."
      />

      {groups.length ? (
        <div className="mt-6 grid gap-4 xl:grid-cols-3">
          {groups.map((group) => (
            <div
              key={group.title}
              className="rounded-[24px] border border-amber-200/10 bg-[rgba(10,7,5,0.55)] p-4"
            >
              <div className="mb-4 flex items-center gap-3">
                <div className="rounded-2xl border border-amber-200/15 bg-amber-300/10 p-2 text-amber-100">
                  <group.icon className="h-4 w-4" />
                </div>
                <div>
                  <div className="text-sm font-semibold text-stone-100">{group.title}</div>
                  <div className="text-xs text-stone-500">{group.items.length} coincidencias</div>
                </div>
              </div>

              <div className="space-y-3">
                {group.items.map((item) => (
                  <div
                    key={`${group.title}-${item.title}`}
                    className="rounded-2xl border border-white/5 bg-white/[0.03] p-3"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="text-sm font-medium text-stone-100">{item.title}</div>
                      {item.badge ? <BadgePill tone="subtle">{item.badge}</BadgePill> : null}
                    </div>
                    <div className="mt-1 text-xs uppercase tracking-[0.28em] text-amber-100/45">
                      {item.meta}
                    </div>
                    <p className="mt-3 text-sm leading-relaxed text-stone-400">{item.text}</p>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="mt-6 rounded-[24px] border border-amber-200/10 bg-[rgba(10,7,5,0.55)] p-5 text-sm text-stone-400">
          No encontré coincidencias en personajes, misiones, notas o inventario. Probá con otro
          nombre o una pista más corta.
        </div>
      )}
    </Panel>
  );
}
