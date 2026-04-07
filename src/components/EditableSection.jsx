import React, { useMemo, useState } from "react";
import { ArrowDown, ArrowUp, Pencil, Plus, Save, Trash2, X } from "lucide-react";
import { ButtonPill, Panel, SectionTitle } from "./ui";

function buildInitialDraft(fields) {
  return fields.reduce((accumulator, field) => {
    accumulator[field.key] = field.defaultValue ?? (field.type === "file" ? null : "");
    return accumulator;
  }, {});
}

function FieldInput({ field, value, onChange }) {
  if (field.type === "file") {
    return (
      <div className="space-y-2">
        <input
          type="file"
          accept={field.accept}
          onChange={(event) => onChange(field.key, event.target.files?.[0] || null)}
          className="block w-full rounded-2xl border border-amber-200/10 bg-[rgba(10,7,5,0.62)] px-4 py-3 text-sm text-stone-100 file:mr-4 file:rounded-full file:border-0 file:bg-amber-300/10 file:px-4 file:py-2 file:text-sm file:text-amber-100"
        />
        {value?.name ? <div className="text-xs text-stone-400">{value.name}</div> : null}
      </div>
    );
  }

  if (field.type === "textarea") {
    return (
      <textarea
        value={value ?? ""}
        onChange={(event) => onChange(field.key, event.target.value)}
        rows={field.rows || 4}
        className="w-full rounded-2xl border border-amber-200/10 bg-[rgba(10,7,5,0.62)] px-4 py-3 text-sm text-stone-100 outline-none placeholder:text-stone-500"
        placeholder={field.placeholder}
      />
    );
  }

  if (field.type === "select") {
    return (
      <select
        value={value ?? ""}
        onChange={(event) => onChange(field.key, event.target.value)}
        className="h-11 w-full rounded-2xl border border-amber-200/10 bg-[rgba(10,7,5,0.62)] px-4 text-sm text-stone-100 outline-none"
      >
        {(field.options || []).map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    );
  }

  return (
    <input
      type={field.type || "text"}
      value={value ?? ""}
      onChange={(event) => onChange(field.key, event.target.value)}
      className="h-11 w-full rounded-2xl border border-amber-200/10 bg-[rgba(10,7,5,0.62)] px-4 text-sm text-stone-100 outline-none placeholder:text-stone-500"
      placeholder={field.placeholder}
    />
  );
}

export function EditableSection({
  title,
  subtitle,
  eyebrow,
  icon,
  items,
  fields,
  validateDraft,
  loading,
  emptyText,
  onCreate,
  onUpdate,
  onDelete,
  onMove,
  renderDisplay,
}) {
  const [newDraft, setNewDraft] = useState(() => buildInitialDraft(fields));
  const [editingId, setEditingId] = useState("");
  const [editingDraft, setEditingDraft] = useState({});
  const [submitting, setSubmitting] = useState(false);

  const hasRequiredValue = useMemo(() => {
    if (validateDraft) return validateDraft(newDraft);
    return fields.every((field) => !field.required || String(newDraft[field.key] ?? "").trim());
  }, [fields, newDraft, validateDraft]);

  const canSaveEdit = useMemo(() => {
    if (!editingId) return false;
    if (validateDraft) return validateDraft(editingDraft);
    return fields.every((field) => !field.required || String(editingDraft[field.key] ?? "").trim());
  }, [editingDraft, editingId, fields, validateDraft]);

  const handleNewChange = (key, nextValue) => {
    setNewDraft((previous) => ({ ...previous, [key]: nextValue }));
  };

  const handleEditChange = (key, nextValue) => {
    setEditingDraft((previous) => ({ ...previous, [key]: nextValue }));
  };

  const handleCreate = async () => {
    if (!hasRequiredValue || submitting) return;
    setSubmitting(true);
    try {
      await onCreate(newDraft);
      setNewDraft(buildInitialDraft(fields));
    } finally {
      setSubmitting(false);
    }
  };

  const startEditing = (item) => {
    setEditingId(item.id);
    setEditingDraft(
      fields.reduce((accumulator, field) => {
        accumulator[field.key] =
          field.type === "file" ? null : item[field.key] ?? field.defaultValue ?? "";
        return accumulator;
      }, {}),
    );
  };

  const handleSaveEdit = async (id) => {
    if (submitting) return;
    setSubmitting(true);
    try {
      await onUpdate(id, editingDraft);
      setEditingId("");
      setEditingDraft({});
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Panel className="p-6">
      <SectionTitle icon={icon} eyebrow={eyebrow} title={title} subtitle={subtitle} />

      <div className="mt-6 rounded-[26px] border border-amber-200/10 bg-[rgba(10,7,5,0.5)] p-4">
        <div className="mb-4 flex items-center gap-3">
          <div className="rounded-2xl border border-amber-200/15 bg-amber-300/10 p-2 text-amber-100">
            <Plus className="h-4 w-4" />
          </div>
          <div className="text-sm font-medium text-stone-100">Agregar nuevo</div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          {fields.map((field) => (
            <label
              key={field.key}
              className={`block ${field.type === "textarea" ? "md:col-span-2" : ""}`}
            >
              <span className="mb-2 block text-xs uppercase tracking-[0.28em] text-amber-100/45">
                {field.label}
              </span>
              <FieldInput field={field} value={newDraft[field.key]} onChange={handleNewChange} />
              {field.helpText ? (
                <p className="mt-2 text-xs leading-relaxed text-stone-400">{field.helpText}</p>
              ) : null}
            </label>
          ))}
        </div>

        <div className="mt-4">
          <ButtonPill primary onClick={handleCreate} disabled={!hasRequiredValue || submitting}>
            Guardar en {title.toLowerCase()}
          </ButtonPill>
        </div>
      </div>

      <div className="mt-6 space-y-4">
        {loading ? (
          <div className="rounded-[24px] border border-amber-200/10 bg-[rgba(10,7,5,0.55)] p-5 text-sm text-stone-400">
            Cargando {title.toLowerCase()}...
          </div>
        ) : null}

        {!loading && !items.length ? (
          <div className="rounded-[24px] border border-amber-200/10 bg-[rgba(10,7,5,0.55)] p-5 text-sm text-stone-400">
            {emptyText}
          </div>
        ) : null}

        {!loading
          ? items.map((item, index) => {
              const isEditing = editingId === item.id;

              return (
                <div
                  key={item.id}
                  className="rounded-[24px] border border-amber-200/10 bg-[rgba(16,11,9,0.82)] p-4"
                >
                  <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                    <div className="text-xs uppercase tracking-[0.28em] text-amber-100/45">
                      #{index + 1}
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => onMove(item.id, "up")}
                        className="rounded-full border border-amber-200/10 bg-white/[0.03] p-2 text-stone-300 transition hover:text-stone-100"
                        aria-label="Subir"
                      >
                        <ArrowUp className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => onMove(item.id, "down")}
                        className="rounded-full border border-amber-200/10 bg-white/[0.03] p-2 text-stone-300 transition hover:text-stone-100"
                        aria-label="Bajar"
                      >
                        <ArrowDown className="h-4 w-4" />
                      </button>
                      {!isEditing ? (
                        <button
                          type="button"
                          onClick={() => startEditing(item)}
                          className="rounded-full border border-amber-200/10 bg-white/[0.03] p-2 text-stone-300 transition hover:text-stone-100"
                          aria-label="Editar"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                      ) : null}
                      <button
                        type="button"
                        onClick={() => onDelete(item.id)}
                        className="rounded-full border border-rose-300/15 bg-rose-500/5 p-2 text-rose-200 transition hover:bg-rose-500/10"
                        aria-label="Eliminar"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>

                  {isEditing ? (
                    <div className="space-y-4">
                      <div className="grid gap-4 md:grid-cols-2">
                        {fields.map((field) => (
                          <label
                            key={field.key}
                            className={`block ${field.type === "textarea" ? "md:col-span-2" : ""}`}
                          >
                            <span className="mb-2 block text-xs uppercase tracking-[0.28em] text-amber-100/45">
                              {field.label}
                            </span>
                            <FieldInput
                              field={field}
                              value={editingDraft[field.key]}
                              onChange={handleEditChange}
                            />
                            {field.helpText ? (
                              <p className="mt-2 text-xs leading-relaxed text-stone-400">
                                {field.helpText}
                              </p>
                            ) : null}
                          </label>
                        ))}
                      </div>

                      <div className="flex flex-wrap gap-2">
                        <ButtonPill
                          primary
                          onClick={() => handleSaveEdit(item.id)}
                          disabled={!canSaveEdit || submitting}
                        >
                          <span className="inline-flex items-center gap-2">
                            <Save className="h-4 w-4" />
                            Guardar cambios
                          </span>
                        </ButtonPill>
                        <ButtonPill
                          onClick={() => {
                            setEditingId("");
                            setEditingDraft({});
                          }}
                        >
                          <span className="inline-flex items-center gap-2">
                            <X className="h-4 w-4" />
                            Cancelar
                          </span>
                        </ButtonPill>
                      </div>
                    </div>
                  ) : (
                    renderDisplay(item)
                  )}
                </div>
              );
            })
          : null}
      </div>
    </Panel>
  );
}
