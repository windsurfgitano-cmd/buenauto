import Image from "next/image";
import Link from "next/link";

import { Container } from "@/components/ui/container";
import { getCurrentUser } from "@/lib/server/session";
import { getActiveSubscription, getUserCredits } from "@/lib/server/subscriptions-store";
import { PLANS, BOOSTS, PACKS, type PlanId } from "@/lib/plans";
import { PlanCard } from "@/components/plans/plan-card";
import { BoostCard } from "@/components/plans/boost-card";
import { PackCard } from "@/components/plans/pack-card";

export const metadata = {
  title: "Planes y Precios | BuenAuto",
  description: "Elige el plan perfecto para vender tu auto. Desde gratis hasta dealer profesional.",
};

export default async function PlanesPage() {
  const user = await getCurrentUser();
  const subscription = user ? await getActiveSubscription(user.id) : null;
  const credits = user ? await getUserCredits(user.id) : 0;
  const currentPlanId = subscription?.planId ?? "free";

  return (
    <main className="pb-12">
      <section className="relative overflow-hidden bg-[#0f172a] py-16 text-center">
        <Image
          src="/planes-bg.jpg"
          alt=""
          fill
          priority
          sizes="100vw"
          className="object-cover object-center opacity-40"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-[#0f172a]/70 via-[#0f172a]/50 to-[#0f172a]/90" />
        <div className="relative mx-auto max-w-4xl px-4">
          <p className="text-xs font-semibold tracking-[0.18em] uppercase text-[#c9a962]">
            Planes y Precios
          </p>
          <h1 className="mt-3 text-3xl font-bold tracking-tight text-white sm:text-4xl drop-shadow-lg">
            Vende más con BuenAuto
          </h1>
          <p className="mt-4 text-base text-zinc-200 drop-shadow">
            Elige el plan que mejor se adapte a tus necesidades. Cancela cuando quieras.
          </p>
        </div>
      </section>
      <Container className="pt-12">

        {user && (
          <div className="mt-8 flex items-center justify-center gap-4 text-sm">
            <span className="text-zinc-600 dark:text-zinc-400">
              Plan actual:{" "}
              <span className="font-semibold text-zinc-900 dark:text-white">
                {PLANS[currentPlanId].name}
              </span>
            </span>
            {credits > 0 && (
              <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-medium text-amber-800 dark:bg-amber-900/30 dark:text-amber-300">
                {credits} crédito{credits !== 1 ? "s" : ""} disponible{credits !== 1 ? "s" : ""}
              </span>
            )}
          </div>
        )}

        {/* Plans */}
        <section className="mt-12">
          <h2 className="text-center text-lg font-semibold text-zinc-900 dark:text-white">
            Planes de Suscripción
          </h2>
          <p className="mt-2 text-center text-sm text-zinc-500 dark:text-zinc-400">
            Pago mensual, cancela cuando quieras
          </p>

          <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {(Object.keys(PLANS) as PlanId[]).map((planId) => (
              <PlanCard
                key={planId}
                plan={PLANS[planId]}
                isCurrentPlan={currentPlanId === planId}
                isLoggedIn={!!user}
              />
            ))}
          </div>
        </section>

        {/* Boosts */}
        <section className="mt-16 border-t border-zinc-200 pt-12 dark:border-zinc-800">
          <h2 className="text-center text-lg font-semibold text-zinc-900 dark:text-white">
            Destaca tu Aviso
          </h2>
          <p className="mt-2 text-center text-sm text-zinc-500 dark:text-zinc-400">
            Pago único, activa desde tu aviso publicado
          </p>

          <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:max-w-2xl lg:mx-auto">
            {Object.values(BOOSTS).map((boost) => (
              <BoostCard key={boost.id} boost={boost} />
            ))}
          </div>
        </section>

        {/* Packs */}
        <section className="mt-16 border-t border-zinc-200 pt-12 dark:border-zinc-800">
          <h2 className="text-center text-lg font-semibold text-zinc-900 dark:text-white">
            Packs de Créditos
          </h2>
          <p className="mt-2 text-center text-sm text-zinc-500 dark:text-zinc-400">
            Compra créditos y úsalos cuando quieras
          </p>

          <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:max-w-2xl lg:mx-auto">
            {Object.values(PACKS).map((pack) => (
              <PackCard key={pack.id} pack={pack} isLoggedIn={!!user} />
            ))}
          </div>
        </section>

        {/* FAQ */}
        <section className="mt-16 border-t border-zinc-200 pt-12 dark:border-zinc-800">
          <h2 className="text-center text-lg font-semibold text-zinc-900 dark:text-white">
            Preguntas Frecuentes
          </h2>

          <div className="mt-8 mx-auto max-w-2xl space-y-6">
            <div className="rounded-xl border border-zinc-200/60 bg-white/60 p-5 backdrop-blur-sm dark:border-zinc-800/60 dark:bg-zinc-900/40">
              <h3 className="font-medium text-zinc-900 dark:text-white">
                ¿Cómo funciona el pago?
              </h3>
              <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-300">
                Usamos MercadoPago para procesar todos los pagos de forma segura. Puedes pagar con tarjeta de crédito, débito o efectivo.
              </p>
            </div>

            <div className="rounded-xl border border-zinc-200/60 bg-white/60 p-5 backdrop-blur-sm dark:border-zinc-800/60 dark:bg-zinc-900/40">
              <h3 className="font-medium text-zinc-900 dark:text-white">
                ¿Puedo cancelar mi suscripción?
              </h3>
              <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-300">
                Sí, puedes cancelar en cualquier momento desde tu cuenta. Tu plan seguirá activo hasta el final del período pagado.
              </p>
            </div>

            <div className="rounded-xl border border-zinc-200/60 bg-white/60 p-5 backdrop-blur-sm dark:border-zinc-800/60 dark:bg-zinc-900/40">
              <h3 className="font-medium text-zinc-900 dark:text-white">
                ¿Qué pasa si destaco un aviso y luego lo edito?
              </h3>
              <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-300">
                El destacado se mantiene activo. Puedes editar tu aviso sin perder el beneficio.
              </p>
            </div>
          </div>
        </section>

        {!user && (
          <div className="mt-12 text-center">
            <p className="text-sm text-zinc-600 dark:text-zinc-400">
              ¿Aún no tienes cuenta?{" "}
              <Link
                href="/registro"
                className="font-medium text-zinc-900 underline underline-offset-4 hover:text-black dark:text-white dark:hover:text-zinc-200"
              >
                Regístrate gratis
              </Link>
            </p>
          </div>
        )}
      </Container>
    </main>
  );
}
