import React, { useMemo, useState } from "react";
import { MailCheck, PawPrint, ScrollText, ShieldCheck, Sparkles, Swords } from "lucide-react";
import { ButtonPill, Panel } from "./ui";

const FEATURE_CARDS = [
  {
    eyebrow: "Campañas separadas",
    title: "Cada mesa en su propio mundo",
    copy:
      "Separá historias, notas, personajes y pistas por campaña para no mezclar sesiones ni spoilers.",
    icon: ScrollText,
  },
  {
    eyebrow: "Wildshape y mascotas",
    title: "Fichas listas en combate",
    copy:
      "Guardá formas, mascotas y aliados con acceso rápido a CA, PG, ataques, rasgos y acciones.",
    icon: PawPrint,
  },
  {
    eyebrow: "Biblioteca viva",
    title: "Bestiario con enlaces compatibles",
    copy:
      "Buscá criaturas por nombre y traelas desde referencias SRD o links de bestiario compatibles.",
    icon: Sparkles,
  },
  {
    eyebrow: "Bitácora ordenada",
    title: "Recordá lo que importa",
    copy:
      "Anotaciones rápidas, secciones editables y una bitácora pensada para discutirle al DM con pruebas.",
    icon: Swords,
  },
];

export function LoginScreen({
  authMode,
  loading,
  errorMessage,
  statusMessage,
  confirmationPendingEmail,
  isConfigured,
  onSignIn,
  onSignUp,
  onResendConfirmation,
}) {
  const [mode, setMode] = useState("signin");
  const [formState, setFormState] = useState({
    displayName: "",
    email: "",
    password: "",
  });

  const canSubmit = useMemo(() => {
    if (!formState.email.trim() || formState.password.trim().length < 6) return false;
    if (mode === "signup" && !formState.displayName.trim()) return false;
    return true;
  }, [formState, mode]);

  const handleChange = (key, value) => {
    setFormState((previous) => ({ ...previous, [key]: value }));
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    if (!canSubmit || loading) return;

    if (mode === "signup") {
      onSignUp({
        displayName: formState.displayName.trim(),
        email: formState.email.trim(),
        password: formState.password.trim(),
      });
      return;
    }

    onSignIn({
      email: formState.email.trim(),
      password: formState.password.trim(),
    });
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-[radial-gradient(circle_at_top,rgba(241,191,105,0.18),transparent_26%),linear-gradient(180deg,#17110d_0%,#080604_100%)] text-stone-100">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_18%,rgba(157,83,35,0.22),transparent_22%),radial-gradient(circle_at_82%_20%,rgba(76,55,20,0.24),transparent_24%),linear-gradient(120deg,rgba(255,255,255,0.02),transparent_42%)]" />

      <div className="relative mx-auto grid min-h-screen max-w-7xl items-center gap-10 px-4 py-6 md:px-6 lg:grid-cols-[1.08fr_0.92fr] lg:py-10">
        <section className="space-y-8">
          <div className="inline-flex items-center gap-3 rounded-full border border-amber-200/15 bg-white/5 px-4 py-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-amber-300 text-stone-950 shadow-[0_8px_30px_rgba(242,196,112,0.28)]">
              <Swords className="h-4 w-4" />
            </div>
            <span className="text-xs uppercase tracking-[0.35em] text-amber-100/70">
              Crónica de Campaña
            </span>
          </div>

          <div className="max-w-3xl">
            <div className="mb-6 flex items-center gap-4">
              <div className="flex h-20 w-20 items-center justify-center rounded-[28px] border border-amber-200/15 bg-[radial-gradient(circle_at_top,rgba(242,196,112,0.24),transparent_55%),linear-gradient(180deg,rgba(37,25,18,0.95),rgba(16,11,8,0.92))] shadow-[0_18px_50px_rgba(0,0,0,0.35)]">
                <div className="flex flex-col items-center justify-center">
                  <Swords className="h-6 w-6 text-amber-100" />
                  <span className="mt-1 text-[10px] font-semibold uppercase tracking-[0.38em] text-amber-100/80">
                    DyD
                  </span>
                </div>
              </div>

              <div className="text-xs uppercase tracking-[0.35em] text-amber-100/45">
                La mesa ordenada del aventurero paranoico
              </div>
            </div>

            <h1 className="font-display text-5xl leading-tight text-stone-50 md:text-6xl">
              La fuente de tus recuerdos, para anotar y ordenar tu mesa.
            </h1>
            <p className="mt-5 max-w-2xl text-lg leading-relaxed text-stone-300">
              La herramienta pensada para que no dependas de tu &quot;buena memoria&quot; y
              puedas discutirle a tu DM con fundamentos que te debe 5mil piezas de oro.
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            {FEATURE_CARDS.map((card) => {
              const Icon = card.icon;

              return (
                <Panel key={card.title} className="p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="text-xs uppercase tracking-[0.3em] text-amber-100/50">
                        {card.eyebrow}
                      </div>
                      <div className="mt-3 font-display text-3xl text-amber-100">{card.title}</div>
                    </div>
                    <div className="rounded-2xl border border-amber-200/10 bg-amber-300/10 p-3 text-amber-100">
                      <Icon className="h-5 w-5" />
                    </div>
                  </div>
                  <p className="mt-3 text-sm leading-relaxed text-stone-400">{card.copy}</p>
                </Panel>
              );
            })}
          </div>
        </section>

        <section className="justify-self-stretch">
          <Panel className="mx-auto max-w-xl p-6 md:p-8">
            <div className="mb-6">
              <div className="text-xs uppercase tracking-[0.35em] text-amber-100/50">Acceso</div>
              <h2 className="mt-3 font-display text-4xl text-stone-100">Entrá a tu mesa</h2>
              <p className="mt-3 text-sm leading-relaxed text-stone-400">
                Configuración detectada: <span className="text-amber-100">{authMode}</span>
              </p>
            </div>

            <div className="mb-5 flex gap-2">
              <button
                type="button"
                onClick={() => setMode("signin")}
                className={`rounded-full border px-4 py-2 text-sm ${
                  mode === "signin"
                    ? "border-amber-200/20 bg-amber-300/10 text-amber-100"
                    : "border-white/10 bg-white/[0.03] text-stone-300"
                }`}
              >
                Iniciar sesión
              </button>
              <button
                type="button"
                onClick={() => setMode("signup")}
                className={`rounded-full border px-4 py-2 text-sm ${
                  mode === "signup"
                    ? "border-amber-200/20 bg-amber-300/10 text-amber-100"
                    : "border-white/10 bg-white/[0.03] text-stone-300"
                }`}
              >
                Crear cuenta
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {mode === "signup" ? (
                <label className="block">
                  <span className="mb-2 block text-sm font-medium text-stone-200">
                    Nombre visible
                  </span>
                  <input
                    value={formState.displayName}
                    onChange={(event) => handleChange("displayName", event.target.value)}
                    placeholder="Aryn, guardián del bosque"
                    className="h-12 w-full rounded-2xl border border-amber-200/10 bg-[rgba(10,7,5,0.62)] px-4 text-stone-100 outline-none placeholder:text-stone-500 focus:border-amber-200/30"
                  />
                </label>
              ) : null}

              <label className="block">
                <span className="mb-2 block text-sm font-medium text-stone-200">Correo</span>
                <input
                  value={formState.email}
                  onChange={(event) => handleChange("email", event.target.value)}
                  placeholder="tu-mesa@campaign.quest"
                  className="h-12 w-full rounded-2xl border border-amber-200/10 bg-[rgba(10,7,5,0.62)] px-4 text-stone-100 outline-none placeholder:text-stone-500 focus:border-amber-200/30"
                />
              </label>

              <label className="block">
                <span className="mb-2 block text-sm font-medium text-stone-200">Clave</span>
                <input
                  type="password"
                  value={formState.password}
                  onChange={(event) => handleChange("password", event.target.value)}
                  placeholder="******"
                  className="h-12 w-full rounded-2xl border border-amber-200/10 bg-[rgba(10,7,5,0.62)] px-4 text-stone-100 outline-none placeholder:text-stone-500 focus:border-amber-200/30"
                />
              </label>

              {!isConfigured ? (
                <div className="rounded-2xl border border-rose-300/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-100">
                  Falta configurar `VITE_SUPABASE_URL` y `VITE_SUPABASE_PUBLISHABLE_KEY`.
                </div>
              ) : null}

              {errorMessage ? (
                <div className="rounded-2xl border border-rose-300/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-100">
                  {errorMessage}
                </div>
              ) : null}

              {statusMessage ? (
                <div className="rounded-2xl border border-emerald-300/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-100">
                  {statusMessage}
                </div>
              ) : null}

              {confirmationPendingEmail ? (
                <div className="rounded-2xl border border-amber-200/15 bg-amber-300/10 px-4 py-4 text-sm text-amber-50">
                  <div className="flex items-start gap-3">
                    <MailCheck className="mt-0.5 h-4 w-4" />
                    <div>
                      Revisá <span className="font-semibold">{confirmationPendingEmail}</span> para
                      confirmar tu cuenta. Después de abrir el link vas a poder entrar normalmente.
                    </div>
                  </div>
                  <div className="mt-3">
                    <ButtonPill onClick={() => onResendConfirmation(confirmationPendingEmail)}>
                      Reenviar confirmación
                    </ButtonPill>
                  </div>
                </div>
              ) : null}

              <ButtonPill
                primary
                type="submit"
                className="w-full"
                disabled={!canSubmit || loading || !isConfigured}
              >
                {loading
                  ? "Procesando..."
                  : mode === "signup"
                    ? "Crear cuenta y enviar mail"
                    : "Iniciar sesión"}
              </ButtonPill>
            </form>

            <div className="mt-6 grid gap-3 md:grid-cols-3">
              <div className="rounded-2xl border border-amber-200/10 bg-[rgba(255,255,255,0.03)] p-4">
                <div className="mb-2 inline-flex rounded-full border border-amber-200/10 p-2 text-amber-100">
                  <MailCheck className="h-4 w-4" />
                </div>
                <div className="text-sm text-stone-200">Confirmación por mail</div>
              </div>
              <div className="rounded-2xl border border-amber-200/10 bg-[rgba(255,255,255,0.03)] p-4">
                <div className="mb-2 inline-flex rounded-full border border-amber-200/10 p-2 text-amber-100">
                  <ShieldCheck className="h-4 w-4" />
                </div>
                <div className="text-sm text-stone-200">Sesión segura y persistente</div>
              </div>
              <div className="rounded-2xl border border-amber-200/10 bg-[rgba(255,255,255,0.03)] p-4">
                <div className="mb-2 inline-flex rounded-full border border-amber-200/10 p-2 text-amber-100">
                  <Sparkles className="h-4 w-4" />
                </div>
                <div className="text-sm text-stone-200">Campañas, fichas y bitácora sincronizadas</div>
              </div>
            </div>
          </Panel>
        </section>
      </div>
    </div>
  );
}
