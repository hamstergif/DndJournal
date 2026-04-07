import React from "react";
import { motion } from "framer-motion";

export function Panel({ children, className = "" }) {
  return (
    <div
      className={`panel-surface rounded-[28px] border border-amber-200/10 bg-[rgba(20,15,11,0.84)] shadow-[0_22px_80px_rgba(0,0,0,0.3)] ${className}`}
    >
      {children}
    </div>
  );
}

export function BadgePill({ children, tone = "default", className = "" }) {
  const styles = {
    default: "border-amber-200/20 bg-amber-300/10 text-amber-100",
    subtle: "border-white/10 bg-white/5 text-stone-300",
    success: "border-emerald-300/20 bg-emerald-400/10 text-emerald-100",
  };

  return (
    <span
      className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-medium ${styles[tone]} ${className}`}
    >
      {children}
    </span>
  );
}

export function ButtonPill({
  children,
  primary = false,
  onClick,
  type = "button",
  className = "",
  disabled = false,
}) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`inline-flex items-center justify-center rounded-2xl px-4 py-3 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-60 ${
        primary
          ? "bg-amber-300 text-stone-950 hover:bg-amber-200"
          : "border border-amber-200/15 bg-[rgba(14,10,8,0.68)] text-stone-100 hover:bg-[rgba(26,20,16,0.92)]"
      } ${className}`}
    >
      {children}
    </button>
  );
}

export function SectionTitle({ icon: Icon, eyebrow, title, subtitle }) {
  return (
    <div className="flex items-start gap-4">
      <div className="rounded-2xl border border-amber-200/20 bg-amber-300/10 p-3 text-amber-100">
        <Icon className="h-5 w-5" />
      </div>
      <div>
        {eyebrow ? (
          <p className="text-xs uppercase tracking-[0.35em] text-amber-100/50">{eyebrow}</p>
        ) : null}
        <h2 className="font-display text-xl font-semibold text-stone-100 sm:text-2xl">{title}</h2>
        <p className="mt-1 max-w-2xl text-sm text-stone-400">{subtitle}</p>
      </div>
    </div>
  );
}

export function MetricCard({ value, label, hint }) {
  return (
    <div className="rounded-[24px] border border-amber-200/10 bg-[rgba(15,11,8,0.74)] p-4">
      <div className="font-display text-3xl text-amber-100">{value}</div>
      <div className="mt-1 text-sm font-medium text-stone-200">{label}</div>
      <div className="mt-2 text-xs leading-relaxed text-stone-500">{hint}</div>
    </div>
  );
}

export function InfoCard({ title, description, badge, className = "" }) {
  return (
    <motion.article whileHover={{ y: -4 }} transition={{ duration: 0.18 }}>
      <div
        className={`rounded-[24px] border border-amber-200/10 bg-[rgba(16,11,9,0.82)] p-4 ${className}`}
      >
        <div className="flex items-start justify-between gap-3">
          <h3 className="font-medium text-stone-100">{title}</h3>
          {badge ? <BadgePill>{badge}</BadgePill> : null}
        </div>
        <p className="mt-3 text-sm leading-relaxed text-stone-400">{description}</p>
      </div>
    </motion.article>
  );
}
