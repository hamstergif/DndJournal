import React from "react";
import { Shield, Swords, X } from "lucide-react";
import { BadgePill } from "./ui";

function StatCell({ label, value }) {
  return (
    <div className="rounded-2xl border border-white/5 bg-white/[0.03] p-3">
      <div className="text-xs uppercase tracking-[0.24em] text-stone-500">{label}</div>
      <div className="mt-2 text-lg font-semibold text-stone-100">{value}</div>
    </div>
  );
}

export function CreatureDetailModal({ creature, loading, error, onClose }) {
  if (!creature && !loading && !error) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
      <div className="relative w-full max-w-6xl overflow-hidden rounded-[32px] border border-amber-200/10 bg-[linear-gradient(180deg,#17110d_0%,#0b0705_100%)] shadow-[0_30px_100px_rgba(0,0,0,0.55)]">
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 z-10 rounded-full border border-amber-200/15 bg-white/[0.03] p-2 text-stone-200"
        >
          <X className="h-4 w-4" />
        </button>

        {loading ? (
          <div className="p-8 text-sm text-stone-300">Cargando ficha de criatura...</div>
        ) : null}

        {error ? (
          <div className="p-8 text-sm text-rose-100">{error}</div>
        ) : null}

        {creature ? (
          <div className="grid gap-0 lg:grid-cols-[0.9fr_1.1fr]">
            <div className="border-b border-amber-200/10 lg:border-b-0 lg:border-r">
              <div className="relative h-64 overflow-hidden">
                {creature.imageUrl ? (
                  <img
                    src={creature.imageUrl}
                    alt={creature.name}
                    className="h-full w-full object-cover opacity-75"
                  />
                ) : null}
                <div className="absolute inset-0 bg-gradient-to-t from-[#0d0907] via-[#0d0907]/35 to-transparent" />
                <div className="absolute bottom-6 left-6 right-6">
                  <div className="flex flex-wrap gap-2">
                    <BadgePill>CR {creature.challengeLabel}</BadgePill>
                    <BadgePill tone="subtle">{creature.type}</BadgePill>
                    <BadgePill tone="subtle">{creature.size}</BadgePill>
                  </div>
                  <h2 className="mt-4 font-display text-4xl text-stone-100">{creature.name}</h2>
                  {creature.originalName && creature.originalName !== creature.name ? (
                    <p className="mt-2 text-xs uppercase tracking-[0.3em] text-amber-100/70">
                      {creature.originalName}
                    </p>
                  ) : null}
                  <p className="mt-2 text-sm text-stone-300">{creature.alignment || "Sin alineamiento"}</p>
                </div>
              </div>

              <div className="p-6">
                <div className="grid gap-3 sm:grid-cols-2">
                  <StatCell label="CA" value={creature.armorClass} />
                  <StatCell label="PG" value={creature.hitPoints} />
                  <StatCell label="Golpe" value={creature.hitDice} />
                  <StatCell label="Movimiento" value={creature.speed} />
                </div>

                <div className="mt-5 grid gap-3 sm:grid-cols-3">
                  <StatCell label="FUE" value={creature.abilityScores.strength} />
                  <StatCell label="DES" value={creature.abilityScores.dexterity} />
                  <StatCell label="CON" value={creature.abilityScores.constitution} />
                  <StatCell label="INT" value={creature.abilityScores.intelligence} />
                  <StatCell label="SAB" value={creature.abilityScores.wisdom} />
                  <StatCell label="CAR" value={creature.abilityScores.charisma} />
                </div>

                <div className="mt-5 space-y-2 text-sm text-stone-400">
                  <div>
                    <span className="text-stone-200">Sentidos:</span> {creature.senses || "Sin dato"}
                  </div>
                  <div>
                    <span className="text-stone-200">Idiomas:</span> {creature.languages || "Sin dato"}
                  </div>
                  <div>
                    <span className="text-stone-200">Fuente:</span>{" "}
                    <a
                      href={creature.sourceUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="text-amber-100 hover:text-amber-50"
                    >
                      Abrir referencia SRD
                    </a>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-6">
              <div className="grid gap-5">
                <section>
                  <div className="mb-3 flex items-center gap-3 text-stone-100">
                    <Shield className="h-4 w-4 text-amber-100" />
                    <h3 className="font-display text-2xl">Rasgos</h3>
                  </div>
                  <div className="space-y-3">
                    {creature.specialAbilities.length ? (
                      creature.specialAbilities.map((trait) => (
                        <div
                          key={trait.name}
                          className="rounded-[22px] border border-amber-200/10 bg-white/[0.03] p-4"
                        >
                          <div className="font-medium text-stone-100">{trait.name}</div>
                          <p className="mt-2 text-sm leading-relaxed text-stone-400">{trait.desc}</p>
                        </div>
                      ))
                    ) : (
                      <div className="rounded-[22px] border border-amber-200/10 bg-white/[0.03] p-4 text-sm text-stone-400">
                        Esta criatura no trae rasgos especiales visibles en la fuente actual.
                      </div>
                    )}
                  </div>
                </section>

                <section>
                  <div className="mb-3 flex items-center gap-3 text-stone-100">
                    <Swords className="h-4 w-4 text-amber-100" />
                    <h3 className="font-display text-2xl">Acciones y ataques</h3>
                  </div>
                  <div className="space-y-3">
                    {creature.actions.length ? (
                      creature.actions.map((action) => (
                        <div
                          key={action.name}
                          className="rounded-[22px] border border-amber-200/10 bg-white/[0.03] p-4"
                        >
                          <div className="flex flex-wrap items-center gap-2">
                            <div className="font-medium text-stone-100">{action.name}</div>
                            {action.attackBonus !== null ? (
                              <BadgePill tone="subtle">Ataque +{action.attackBonus}</BadgePill>
                            ) : null}
                            {action.damageText ? (
                              <BadgePill tone="subtle">{action.damageText}</BadgePill>
                            ) : null}
                          </div>
                          <p className="mt-2 text-sm leading-relaxed text-stone-400">{action.desc}</p>
                        </div>
                      ))
                    ) : (
                      <div className="rounded-[22px] border border-amber-200/10 bg-white/[0.03] p-4 text-sm text-stone-400">
                        Esta criatura no trae acciones visibles en la fuente actual.
                      </div>
                    )}
                  </div>
                </section>
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
