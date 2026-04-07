import React from "react";
import { Plus, Save, ScrollText, X } from "lucide-react";
import { ButtonPill, Panel, SectionTitle } from "./ui";

function CampaignField({ label, children, wide = false }) {
  return (
    <label className={`block ${wide ? "md:col-span-2" : ""}`}>
      <span className="mb-2 block text-xs uppercase tracking-[0.28em] text-amber-100/45">{label}</span>
      {children}
    </label>
  );
}

export function CampaignEditorPanel({
  mode,
  draft,
  onChange,
  onCancel,
  onSubmit,
  submitting,
}) {
  const isCreate = mode === "create";

  return (
    <Panel className="p-6">
      <SectionTitle
        icon={ScrollText}
        eyebrow={isCreate ? "Nueva campaña" : "Editar campaña"}
        title={isCreate ? "Armá una campaña separada" : "Ajustá la campaña activa"}
        subtitle="Cada campaña mantiene su propia bitácora, personajes, misiones, locaciones, conocimiento y criaturas guardadas."
      />

      <div className="mt-6 grid gap-4 md:grid-cols-2">
        <CampaignField label="Título">
          <input
            value={draft.title}
            onChange={(event) => onChange("title", event.target.value)}
            placeholder="Las Cenizas del Circo"
            className="h-11 w-full rounded-2xl border border-amber-200/10 bg-[rgba(10,7,5,0.62)] px-4 text-sm text-stone-100 outline-none placeholder:text-stone-500"
          />
        </CampaignField>

        <CampaignField label="Estado">
          <select
            value={draft.status}
            onChange={(event) => onChange("status", event.target.value)}
            className="h-11 w-full rounded-2xl border border-amber-200/10 bg-[rgba(10,7,5,0.62)] px-4 text-sm text-stone-100 outline-none"
          >
            <option value="active">Activa</option>
            <option value="paused">Pausada</option>
            <option value="finished">Finalizada</option>
            <option value="archived">Archivada</option>
          </select>
        </CampaignField>

        <CampaignField label="Ambientación">
          <input
            value={draft.setting}
            onChange={(event) => onChange("setting", event.target.value)}
            placeholder="Fantasía oscura"
            className="h-11 w-full rounded-2xl border border-amber-200/10 bg-[rgba(10,7,5,0.62)] px-4 text-sm text-stone-100 outline-none placeholder:text-stone-500"
          />
        </CampaignField>

        <CampaignField label="Última referencia">
          <input
            value={draft.last_session_label}
            onChange={(event) => onChange("last_session_label", event.target.value)}
            placeholder="Sesión 12 · hace 3 días"
            className="h-11 w-full rounded-2xl border border-amber-200/10 bg-[rgba(10,7,5,0.62)] px-4 text-sm text-stone-100 outline-none placeholder:text-stone-500"
          />
        </CampaignField>

        <CampaignField label="Resumen" wide>
          <textarea
            value={draft.summary}
            onChange={(event) => onChange("summary", event.target.value)}
            rows={4}
            placeholder="Qué tono tiene esta campaña y por qué importa."
            className="w-full rounded-2xl border border-amber-200/10 bg-[rgba(10,7,5,0.62)] px-4 py-3 text-sm text-stone-100 outline-none placeholder:text-stone-500"
          />
        </CampaignField>

        <CampaignField label="Foco actual" wide>
          <textarea
            value={draft.focus}
            onChange={(event) => onChange("focus", event.target.value)}
            rows={4}
            placeholder="Qué está pasando ahora mismo en la mesa."
            className="w-full rounded-2xl border border-amber-200/10 bg-[rgba(10,7,5,0.62)] px-4 py-3 text-sm text-stone-100 outline-none placeholder:text-stone-500"
          />
        </CampaignField>

        <CampaignField label="Próximo movimiento" wide>
          <textarea
            value={draft.next_move}
            onChange={(event) => onChange("next_move", event.target.value)}
            rows={4}
            placeholder="Qué debería recordar el grupo antes de la próxima sesión."
            className="w-full rounded-2xl border border-amber-200/10 bg-[rgba(10,7,5,0.62)] px-4 py-3 text-sm text-stone-100 outline-none placeholder:text-stone-500"
          />
        </CampaignField>
      </div>

      <div className="mt-5 flex flex-wrap gap-2">
        <ButtonPill primary onClick={onSubmit} disabled={submitting || !draft.title.trim()}>
          <span className="inline-flex items-center gap-2">
            {isCreate ? <Plus className="h-4 w-4" /> : <Save className="h-4 w-4" />}
            {submitting ? "Guardando..." : isCreate ? "Crear campaña" : "Guardar campaña"}
          </span>
        </ButtonPill>

        <ButtonPill onClick={onCancel}>
          <span className="inline-flex items-center gap-2">
            <X className="h-4 w-4" />
            Cancelar
          </span>
        </ButtonPill>
      </div>
    </Panel>
  );
}
