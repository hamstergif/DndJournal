import React from "react";
import { Plus, Save, ScrollText, Trash2, X } from "lucide-react";
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
  onDelete,
  onSubmit,
  deleting = false,
  submitting,
}) {
  const isCreate = mode === "create";

  return (
    <Panel className="p-6">
      <SectionTitle
        icon={ScrollText}
        eyebrow={isCreate ? "Nueva campa\u00f1a" : "Editar campa\u00f1a"}
        title={isCreate ? "Arm\u00e1 una campa\u00f1a separada" : "Ajust\u00e1 la campa\u00f1a activa"}
        subtitle="Cada campa\u00f1a mantiene su propia bit\u00e1cora, personajes, misiones, locaciones, conocimiento y criaturas guardadas."
      />

      <div className="mt-6 grid gap-4 md:grid-cols-2">
        <CampaignField label="T\u00edtulo">
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

        <CampaignField label="Ambientaci\u00f3n">
          <input
            value={draft.setting}
            onChange={(event) => onChange("setting", event.target.value)}
            placeholder="Fantas\u00eda oscura"
            className="h-11 w-full rounded-2xl border border-amber-200/10 bg-[rgba(10,7,5,0.62)] px-4 text-sm text-stone-100 outline-none placeholder:text-stone-500"
          />
        </CampaignField>

        <CampaignField label="\u00daltima referencia">
          <input
            value={draft.last_session_label}
            onChange={(event) => onChange("last_session_label", event.target.value)}
            placeholder="Sesi\u00f3n 12 · hace 3 d\u00edas"
            className="h-11 w-full rounded-2xl border border-amber-200/10 bg-[rgba(10,7,5,0.62)] px-4 text-sm text-stone-100 outline-none placeholder:text-stone-500"
          />
        </CampaignField>

        <CampaignField label="Resumen" wide>
          <textarea
            value={draft.summary}
            onChange={(event) => onChange("summary", event.target.value)}
            rows={4}
            placeholder="Qu\u00e9 tono tiene esta campa\u00f1a y por qu\u00e9 importa."
            className="w-full rounded-2xl border border-amber-200/10 bg-[rgba(10,7,5,0.62)] px-4 py-3 text-sm text-stone-100 outline-none placeholder:text-stone-500"
          />
        </CampaignField>

        <CampaignField label="Foco actual" wide>
          <textarea
            value={draft.focus}
            onChange={(event) => onChange("focus", event.target.value)}
            rows={4}
            placeholder="Qu\u00e9 est\u00e1 pasando ahora mismo en la mesa."
            className="w-full rounded-2xl border border-amber-200/10 bg-[rgba(10,7,5,0.62)] px-4 py-3 text-sm text-stone-100 outline-none placeholder:text-stone-500"
          />
        </CampaignField>

        <CampaignField label="Pr\u00f3ximo movimiento" wide>
          <textarea
            value={draft.next_move}
            onChange={(event) => onChange("next_move", event.target.value)}
            rows={4}
            placeholder="Qu\u00e9 deber\u00eda recordar el grupo antes de la pr\u00f3xima sesi\u00f3n."
            className="w-full rounded-2xl border border-amber-200/10 bg-[rgba(10,7,5,0.62)] px-4 py-3 text-sm text-stone-100 outline-none placeholder:text-stone-500"
          />
        </CampaignField>
      </div>

      <div className="mt-5 flex flex-wrap gap-2">
        <ButtonPill primary onClick={onSubmit} disabled={submitting || !draft.title.trim()}>
          <span className="inline-flex items-center gap-2">
            {isCreate ? <Plus className="h-4 w-4" /> : <Save className="h-4 w-4" />}
            {submitting ? "Guardando..." : isCreate ? "Crear campa\u00f1a" : "Guardar campa\u00f1a"}
          </span>
        </ButtonPill>

        {!isCreate && onDelete ? (
          <ButtonPill
            onClick={onDelete}
            disabled={submitting || deleting}
            className="border-rose-400/30 bg-rose-500/10 text-rose-100 hover:bg-rose-500/20"
          >
            <span className="inline-flex items-center gap-2">
              <Trash2 className="h-4 w-4" />
              {deleting ? "Borrando..." : "Borrar campa\u00f1a"}
            </span>
          </ButtonPill>
        ) : null}

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
