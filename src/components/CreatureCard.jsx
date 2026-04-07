import React from "react";
import { motion } from "framer-motion";
import { Eye, PawPrint, X } from "lucide-react";
import { BadgePill, ButtonPill } from "./ui";

export function CreatureCard({ creature, actionLabel, onSave, onOpenDetail }) {
  return (
    <motion.article whileHover={{ y: -4 }} transition={{ duration: 0.18 }}>
      <div className="flex h-full flex-col overflow-hidden rounded-[26px] border border-amber-200/10 bg-[rgba(15,11,8,0.84)]">
        <div className="relative h-40 overflow-hidden border-b border-amber-200/10">
          {creature.imageUrl ? (
            <img
              src={creature.imageUrl}
              alt={creature.name}
              className="h-full w-full object-cover opacity-70"
            />
          ) : (
            <div className="flex h-full items-center justify-center bg-[radial-gradient(circle_at_top,rgba(242,196,112,0.16),transparent_28%),linear-gradient(180deg,#1c140f_0%,#100b08_100%)]">
              <PawPrint className="h-10 w-10 text-amber-100/65" />
            </div>
          )}

          <div className="absolute inset-0 bg-gradient-to-t from-[#120d0a] via-[#120d0a]/40 to-transparent" />

          <div className="absolute left-4 top-4 flex flex-wrap gap-2">
            <BadgePill>CR {creature.challengeLabel}</BadgePill>
            <BadgePill tone="subtle">{creature.type}</BadgePill>
          </div>

          <div className="absolute bottom-4 left-4 right-4">
            <h3 className="font-display text-2xl text-stone-100">{creature.name}</h3>
            {creature.originalName && creature.originalName !== creature.name ? (
              <p className="mt-1 text-xs uppercase tracking-[0.28em] text-amber-100/65">
                {creature.originalName}
              </p>
            ) : null}
            <p className="mt-1 text-sm text-stone-300">
              {creature.size} · CA {creature.armorClass} · PG {creature.hitPoints}
            </p>
          </div>
        </div>

        <div className="flex flex-1 flex-col p-4">
          <div className="grid grid-cols-3 gap-2 text-xs text-stone-400">
            <div className="rounded-2xl border border-white/5 bg-white/[0.03] p-3">
              <div className="uppercase tracking-[0.2em] text-stone-500">Movimiento</div>
              <div className="mt-2 text-sm text-stone-200">{creature.speed}</div>
            </div>
            <div className="rounded-2xl border border-white/5 bg-white/[0.03] p-3">
              <div className="uppercase tracking-[0.2em] text-stone-500">Golpe</div>
              <div className="mt-2 text-sm text-stone-200">{creature.hitDice}</div>
            </div>
            <div className="rounded-2xl border border-white/5 bg-white/[0.03] p-3">
              <div className="uppercase tracking-[0.2em] text-stone-500">Tono</div>
              <div className="mt-2 text-sm text-stone-200">{creature.alignment || "—"}</div>
            </div>
          </div>

          {creature.traits.length ? (
            <div className="mt-4 flex flex-wrap gap-2">
              {creature.traits.map((trait) => (
                <BadgePill key={trait} tone="subtle">
                  {trait}
                </BadgePill>
              ))}
            </div>
          ) : null}

          <p className="mt-4 text-sm leading-relaxed text-stone-400">{creature.snippet}</p>

          <div className="mt-auto flex flex-wrap gap-2 pt-5">
            <ButtonPill onClick={() => onSave(creature)}>{actionLabel}</ButtonPill>
            <ButtonPill onClick={() => onOpenDetail?.(creature.index)}>
              <span className="inline-flex items-center gap-2">
                <Eye className="h-4 w-4" />
                Ver ficha
              </span>
            </ButtonPill>
          </div>
        </div>
      </div>
    </motion.article>
  );
}

export function SavedCreatureCard({ creature, label, onRemove, onOpenDetail }) {
  return (
    <div className="rounded-[24px] border border-amber-200/10 bg-[rgba(14,10,8,0.72)] p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-xs uppercase tracking-[0.3em] text-amber-100/45">{label}</div>
          <div className="mt-2 font-display text-2xl text-stone-100">{creature.name}</div>
          {creature.originalName && creature.originalName !== creature.name ? (
            <div className="mt-1 text-xs uppercase tracking-[0.28em] text-amber-100/65">
              {creature.originalName}
            </div>
          ) : null}
          <div className="mt-2 flex flex-wrap gap-2">
            <BadgePill>CR {creature.challengeLabel}</BadgePill>
            <BadgePill tone="subtle">{creature.type}</BadgePill>
          </div>
        </div>

        <button
          type="button"
          onClick={() => onRemove(creature.index)}
          className="rounded-full border border-amber-200/15 bg-white/[0.03] p-2 text-stone-300 transition hover:text-stone-100"
          aria-label={`Quitar ${creature.name}`}
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="mt-4 grid gap-2 text-sm text-stone-400 sm:grid-cols-2">
        <div className="rounded-2xl border border-white/5 bg-white/[0.03] p-3">
          CA {creature.armorClass} · PG {creature.hitPoints}
        </div>
        <div className="rounded-2xl border border-white/5 bg-white/[0.03] p-3">{creature.speed}</div>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <ButtonPill onClick={() => onOpenDetail?.(creature.index)}>Abrir ficha</ButtonPill>
        <a
          href={creature.sourceUrl}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center text-sm font-medium text-amber-100 transition hover:text-amber-50"
        >
          Ver fuente SRD
        </a>
      </div>
    </div>
  );
}
