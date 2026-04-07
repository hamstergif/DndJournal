import React from "react";
import { X } from "lucide-react";
import { BadgePill } from "./ui";

export function BookOverlay({
  open,
  onClose,
  campaignName,
  noteValue,
  onNoteChange,
  saveMessage,
  placeholderLines,
}) {
  if (!open) return null;

  const previewPages = noteValue.trim()
    ? noteValue
        .split("\n")
        .map((line) => line.trim())
        .filter(Boolean)
        .slice(0, 3)
    : placeholderLines;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
      <div className="relative w-full max-w-6xl">
        <button
          onClick={onClose}
          className="absolute right-2 top-2 z-10 rounded-full border border-amber-200/15 bg-[rgba(16,12,9,0.86)] p-2 text-stone-200"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="overflow-hidden rounded-[36px] border border-amber-200/15 bg-[#2c1f16] p-3 shadow-[0_30px_100px_rgba(0,0,0,0.55)]">
          <div className="grid min-h-[560px] overflow-hidden rounded-[30px] border border-amber-100/10 bg-[linear-gradient(135deg,#d8c39b_0%,#c8ad82_100%)] text-[#3b2b1d] lg:grid-cols-2">
            <div className="relative border-b border-[#7e5e34]/15 p-6 md:p-8 lg:border-b-0 lg:border-r">
              <div className="absolute inset-y-0 right-0 w-10 bg-gradient-to-l from-[#8f6d40]/30 to-transparent" />
              <p className="text-xs uppercase tracking-[0.35em] text-[#7a5b35]">Bitácora abierta</p>
              <h3 className="mt-4 font-display text-4xl text-[#362516]">{campaignName}</h3>
              <p className="mt-4 max-w-md text-sm leading-relaxed text-[#6c5234]">
                Esta hoja queda para recap, teoría de mesa y detalles que querés encontrar en
                segundos antes de jugar.
              </p>

              <div className="mt-8 space-y-4 text-[17px] leading-8">
                {previewPages.map((line, index) => (
                  <p key={`${line}-${index}`}>{line}</p>
                ))}
              </div>

              <div className="mt-8 rounded-[24px] border border-[#7e5e34]/20 bg-[#f0deb7]/55 p-4 text-sm">
                {saveMessage}
              </div>
            </div>

            <div className="relative p-6 md:p-8">
              <div className="absolute inset-y-0 left-0 hidden w-10 bg-gradient-to-r from-[#8f6d40]/30 to-transparent lg:block" />
              <p className="text-xs uppercase tracking-[0.35em] text-[#7a5b35]">Escritura</p>
              <div className="mt-5 rounded-[24px] border border-[#7e5e34]/20 bg-[#f5e7c3]/62 p-4">
                <div className="mb-3 flex items-center justify-between gap-3 text-sm text-[#6c5234]">
                  <span>Nueva entrada</span>
                  <span>{saveMessage}</span>
                </div>
                <textarea
                  value={noteValue}
                  onChange={(event) => onNoteChange(event.target.value)}
                  className="min-h-[320px] w-full resize-none bg-transparent text-[16px] leading-7 outline-none placeholder:text-[#8c7150]"
                  placeholder="Escribí aquí como si fuera la libreta del grupo: recap, sospechas, loot, nombres, pistas..."
                />
              </div>
              <div className="mt-4 flex flex-wrap gap-2 text-xs text-[#6c5234]">
                <BadgePill tone="subtle">Recap rápido</BadgePill>
                <BadgePill tone="subtle">Teoría de mesa</BadgePill>
                <BadgePill tone="subtle">Pistas vivas</BadgePill>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
