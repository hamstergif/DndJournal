import React, { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
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
  const [flipping, setFlipping] = useState(false);

  useEffect(() => {
    if (!open) return undefined;

    setFlipping(false);
    const timeoutId = window.setTimeout(() => setFlipping(true), 180);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [open]);

  const previewPages = noteValue.trim()
    ? noteValue
        .split("\n")
        .map((line) => line.trim())
        .filter(Boolean)
        .slice(0, 3)
    : placeholderLines;

  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
        <motion.div
          className="relative w-full max-w-6xl"
          style={{ perspective: "2400px" }}
          initial={{ opacity: 0, y: 30, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.98 }}
            transition={{ duration: 0.28, ease: "easeOut" }}
          >
            <button
              onClick={onClose}
              className="absolute right-2 top-2 z-20 rounded-full border border-amber-200/15 bg-[rgba(16,12,9,0.86)] p-2 text-stone-200"
            >
              <X className="h-4 w-4" />
            </button>

            <motion.div
              className="book-shell overflow-hidden rounded-[36px] border border-amber-200/15 bg-[#2c1f16] p-3 shadow-[0_30px_100px_rgba(0,0,0,0.55)]"
              initial={{ rotateX: 10, rotateY: -14 }}
              animate={{ rotateX: 0, rotateY: 0 }}
              transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            >
              <div className="grid min-h-[560px] overflow-hidden rounded-[30px] border border-amber-100/10 bg-[linear-gradient(135deg,#d8c39b_0%,#c8ad82_100%)] text-[#3b2b1d] lg:grid-cols-2">
                <motion.div
                  className="relative border-b border-[#7e5e34]/15 p-6 md:p-8 lg:border-b-0 lg:border-r"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.22, duration: 0.35 }}
                >
                  <div className="absolute inset-y-0 right-0 w-10 bg-gradient-to-l from-[#8f6d40]/30 to-transparent" />
                  <div className="book-page-fan pointer-events-none absolute inset-0 overflow-hidden">
                    {[0, 1, 2].map((pageIndex) => (
                      <motion.div
                        key={pageIndex}
                        className="book-page-fan-sheet"
                        initial={{ rotateY: 0, x: 0, opacity: 0.34 - pageIndex * 0.08 }}
                        animate={
                          flipping
                            ? {
                                rotateY: -160,
                                x: -18 - pageIndex * 4,
                                opacity: 0.03,
                              }
                            : {
                                rotateY: 0,
                                x: 0,
                                opacity: 0.34 - pageIndex * 0.08,
                              }
                        }
                        transition={{
                          duration: 0.72,
                          delay: 0.12 * pageIndex,
                          ease: [0.2, 0.75, 0.2, 1],
                        }}
                        style={{ top: 48 + pageIndex * 10 }}
                      />
                    ))}
                  </div>

                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.48, duration: 0.3 }}
                  >
                    <p className="text-xs uppercase tracking-[0.35em] text-[#7a5b35]">Bitácora abierta</p>
                    <h3 className="mt-4 font-display text-4xl text-[#362516]">{campaignName}</h3>
                    <p className="mt-4 max-w-md text-sm leading-relaxed text-[#6c5234]">
                      Esta hoja queda para recap, teoría de mesa y detalles que querés encontrar en
                      segundos antes de jugar.
                    </p>

                    <div className="mt-8 space-y-4 text-[17px] leading-8">
                      {previewPages.map((line, index) => (
                        <motion.p
                          key={`${line}-${index}`}
                          initial={{ opacity: 0, x: -12 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.55 + index * 0.08, duration: 0.24 }}
                        >
                          {line}
                        </motion.p>
                      ))}
                    </div>

                    <motion.div
                      className="mt-8 rounded-[24px] border border-[#7e5e34]/20 bg-[#f0deb7]/55 p-4 text-sm"
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.72, duration: 0.28 }}
                    >
                      {saveMessage}
                    </motion.div>
                  </motion.div>
                </motion.div>

                <motion.div
                  className="relative p-6 md:p-8"
                  initial={{ opacity: 0, x: 24 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.42, duration: 0.35 }}
                >
                  <div className="absolute inset-y-0 left-0 hidden w-10 bg-gradient-to-r from-[#8f6d40]/30 to-transparent lg:block" />
                  <p className="text-xs uppercase tracking-[0.35em] text-[#7a5b35]">Escritura</p>
                  <motion.div
                    className="mt-5 rounded-[24px] border border-[#7e5e34]/20 bg-[#f5e7c3]/62 p-4"
                    initial={{ rotateY: 8, opacity: 0 }}
                    animate={{ rotateY: 0, opacity: 1 }}
                    transition={{ delay: 0.52, duration: 0.34 }}
                  >
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
                  </motion.div>
                  <motion.div
                    className="mt-4 flex flex-wrap gap-2 text-xs text-[#6c5234]"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.7, duration: 0.22 }}
                  >
                    <BadgePill tone="subtle">Recap rápido</BadgePill>
                    <BadgePill tone="subtle">Teoría de mesa</BadgePill>
                    <BadgePill tone="subtle">Pistas vivas</BadgePill>
                  </motion.div>
                </motion.div>
              </div>
            </motion.div>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
