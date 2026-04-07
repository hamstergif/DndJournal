import React, { useState } from "react";
import { Sparkles } from "lucide-react";
import { BadgePill, ButtonPill, Panel } from "./ui";

export function LoginScreen({ authMode, onLogin, onDemoLogin }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = (event) => {
    event.preventDefault();

    if (!email.trim()) {
      setError("Necesito un correo para abrir la bitácora.");
      return;
    }

    if (password.trim().length < 6) {
      setError("Usá una clave de al menos 6 caracteres para esta alpha.");
      return;
    }

    setError("");
    onLogin({ email: email.trim(), password: password.trim() });
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-[radial-gradient(circle_at_top,rgba(241,191,105,0.18),transparent_28%),linear-gradient(180deg,#17110d_0%,#080604_100%)] text-stone-100">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(157,83,35,0.22),transparent_24%),radial-gradient(circle_at_80%_18%,rgba(76,55,20,0.25),transparent_20%)]" />

      <div className="relative mx-auto grid min-h-screen max-w-7xl items-center gap-10 px-4 py-6 md:px-6 lg:grid-cols-[1.1fr_0.9fr] lg:py-10">
        <section className="space-y-8">
          <div className="inline-flex items-center gap-3 rounded-full border border-amber-200/15 bg-white/5 px-4 py-2">
            <div className="rounded-full bg-amber-300 p-1.5 text-stone-950">
              <Sparkles className="h-4 w-4" />
            </div>
            <span className="text-xs uppercase tracking-[0.35em] text-amber-100/70">
              Crónica de Campaña
            </span>
          </div>

          <div className="max-w-2xl">
            <h1 className="font-display text-5xl leading-tight text-stone-50 md:text-6xl">
              Un journal de DyD que se sienta como tu mesa.
            </h1>
            <p className="mt-5 max-w-xl text-lg leading-relaxed text-stone-300">
              Diario, personajes, locaciones, mascotas y transformaciones en una experiencia
              responsive para PC y celular, con estética medieval y una entrada clara para arrancar
              rápido.
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <Panel className="p-5">
              <div className="text-xs uppercase tracking-[0.3em] text-amber-100/50">Mesa lista</div>
              <div className="mt-3 font-display text-3xl text-amber-100">PC + móvil</div>
              <p className="mt-2 text-sm text-stone-400">
                Navegación pensada para escritorio, celular y sesiones rápidas.
              </p>
            </Panel>

            <Panel className="p-5">
              <div className="text-xs uppercase tracking-[0.3em] text-amber-100/50">Compendio</div>
              <div className="mt-3 font-display text-3xl text-amber-100">SRD enlazado</div>
              <p className="mt-2 text-sm text-stone-400">
                Formas y criaturas con base abierta para no inventar stats ni cargarlos a mano.
              </p>
            </Panel>

            <Panel className="p-5">
              <div className="text-xs uppercase tracking-[0.3em] text-amber-100/50">Autenticación</div>
              <div className="mt-3 font-display text-3xl text-amber-100">Lista para crecer</div>
              <p className="mt-2 text-sm text-stone-400">
                Esta alpha guarda sesión local y deja el flujo listo para conectar auth real.
              </p>
            </Panel>
          </div>

          <Panel className="overflow-hidden">
            <div className="grid gap-6 p-6 md:grid-cols-[1.1fr_0.9fr]">
              <div>
                <div className="text-xs uppercase tracking-[0.35em] text-amber-100/50">
                  Lo que ya suma valor
                </div>
                <div className="mt-4 space-y-4">
                  <div className="rounded-[22px] border border-amber-200/10 bg-[rgba(255,255,255,0.03)] p-4">
                    <div className="text-sm font-semibold text-stone-100">Búsqueda global</div>
                    <div className="mt-1 text-sm text-stone-400">
                      Encontrás personajes, objetos, sesiones y secretos sin perderte entre pestañas.
                    </div>
                  </div>

                  <div className="rounded-[22px] border border-amber-200/10 bg-[rgba(255,255,255,0.03)] p-4">
                    <div className="text-sm font-semibold text-stone-100">Bitácora exportable</div>
                    <div className="mt-1 text-sm text-stone-400">
                      El dossier de campaña sale en un archivo descargable para compartir o archivar.
                    </div>
                  </div>

                  <div className="rounded-[22px] border border-amber-200/10 bg-[rgba(255,255,255,0.03)] p-4">
                    <div className="text-sm font-semibold text-stone-100">
                      Mascotas y transformaciones separadas
                    </div>
                    <div className="mt-1 text-sm text-stone-400">
                      El druida guarda formas útiles y el resto de la party puede archivar criaturas de compañía.
                    </div>
                  </div>
                </div>
              </div>

              <div className="rounded-[28px] border border-amber-200/10 bg-[linear-gradient(180deg,rgba(240,214,173,0.08),rgba(60,41,21,0.06))] p-5">
                <div className="mb-3 flex items-center justify-between">
                  <div>
                    <div className="text-xs uppercase tracking-[0.35em] text-amber-100/50">
                      Acceso principal
                    </div>
                    <div className="mt-2 font-display text-2xl text-stone-100">
                      Entrada elegante y clara.
                    </div>
                  </div>
                  <BadgePill tone="success">Alpha funcional</BadgePill>
                </div>

                <div className="space-y-3 text-sm text-stone-300">
                  <div className="rounded-2xl border border-amber-200/10 bg-[rgba(10,7,5,0.35)] p-3">
                    Vista de acceso con identidad medieval y accesos rapidos.
                  </div>
                  <div className="rounded-2xl border border-amber-200/10 bg-[rgba(10,7,5,0.35)] p-3">
                    Formulario limpio, responsivo y listo para reemplazar el handler local por auth real.
                  </div>
                  <div className="rounded-2xl border border-amber-200/10 bg-[rgba(10,7,5,0.35)] p-3">
                    Tonalidad medieval, serif expresiva y paneles con sensación de pergamino oscuro.
                  </div>
                </div>
              </div>
            </div>
          </Panel>
        </section>

        <section className="justify-self-stretch">
          <Panel className="mx-auto max-w-xl p-6 md:p-8">
            <div className="mb-6">
              <div className="text-xs uppercase tracking-[0.35em] text-amber-100/50">Acceso</div>
              <h2 className="mt-3 font-display text-4xl text-stone-100">Entrá a tu mesa</h2>
              <p className="mt-3 text-sm leading-relaxed text-stone-400">
                Este flujo ya funciona y persiste sesión. Hoy corre en modo{" "}
                <span className="text-amber-100">{authMode}</span>; mañana puede apuntar a
                Supabase, Clerk o Auth0 sin rehacer la pantalla.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <label className="block">
                <span className="mb-2 block text-sm font-medium text-stone-200">
                  Correo del aventurero
                </span>
                <input
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="tu-mesa@campaign.quest"
                  className="h-12 w-full rounded-2xl border border-amber-200/10 bg-[rgba(10,7,5,0.62)] px-4 text-stone-100 outline-none placeholder:text-stone-500 focus:border-amber-200/30"
                />
              </label>

              <label className="block">
                <span className="mb-2 block text-sm font-medium text-stone-200">Clave</span>
                <input
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="******"
                  className="h-12 w-full rounded-2xl border border-amber-200/10 bg-[rgba(10,7,5,0.62)] px-4 text-stone-100 outline-none placeholder:text-stone-500 focus:border-amber-200/30"
                />
              </label>

              {error ? (
                <div className="rounded-2xl border border-rose-300/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-100">
                  {error}
                </div>
              ) : null}

              <div className="grid gap-3 sm:grid-cols-2">
                <ButtonPill primary type="submit" className="w-full">
                  Iniciar sesión
                </ButtonPill>
                <ButtonPill
                  className="w-full"
                  onClick={() => onDemoLogin("demo", "Mesa demo")}
                >
                  Entrar en modo demo
                </ButtonPill>
              </div>
            </form>

            <div className="mt-6 grid gap-3 md:grid-cols-3">
              <div className="rounded-2xl border border-amber-200/10 bg-[rgba(255,255,255,0.03)] p-4">
                <div className="text-xs uppercase tracking-[0.3em] text-amber-100/50">Auth</div>
                <div className="mt-2 text-sm text-stone-200">Flujo y persistencia resueltos</div>
              </div>
              <div className="rounded-2xl border border-amber-200/10 bg-[rgba(255,255,255,0.03)] p-4">
                <div className="text-xs uppercase tracking-[0.3em] text-amber-100/50">Diseño</div>
                <div className="mt-2 text-sm text-stone-200">Acceso claro con identidad medieval</div>
              </div>
              <div className="rounded-2xl border border-amber-200/10 bg-[rgba(255,255,255,0.03)] p-4">
                <div className="text-xs uppercase tracking-[0.3em] text-amber-100/50">Base</div>
                <div className="mt-2 text-sm text-stone-200">Lista para seguir creciendo</div>
              </div>
            </div>
          </Panel>
        </section>
      </div>
    </div>
  );
}
