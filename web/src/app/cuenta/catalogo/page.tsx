import { redirect } from "next/navigation";

import { RevealAnimations } from "@/components/animations/reveal-animations";
import { CustomCatalogAdmin } from "@/components/catalog/custom-catalog-admin";
import { Container } from "@/components/ui/container";
import { getCustomCatalog } from "@/lib/server/catalog";
import { getCurrentUser } from "@/lib/server/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function isCatalogAdmin(email: string) {
  const raw = process.env.CATALOG_ADMIN_EMAILS;
  if (!raw) return process.env.NODE_ENV !== "production";

  const normalized = email.trim().toLowerCase();
  const allowed = raw
    .split(",")
    .map((v) => v.trim().toLowerCase())
    .filter(Boolean);

  if (allowed.length === 0) return process.env.NODE_ENV !== "production";
  return allowed.includes(normalized);
}

export default async function CatalogoManualPage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/ingresar?next=/cuenta/catalogo");
  }

  if (!isCatalogAdmin(user.email)) {
    return (
      <Container className="py-12">
        <div className="max-w-2xl">
          <h1 className="text-3xl font-semibold tracking-tight text-zinc-900 dark:text-white">
            Catálogo manual
          </h1>
          <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-300">
            No autorizado.
          </p>
        </div>
      </Container>
    );
  }

  const catalog = await getCustomCatalog();

  return (
    <div id="custom-catalog">
      <RevealAnimations rootId="custom-catalog" />
      <Container className="py-12">
        <div className="max-w-2xl" data-anim="fade-up">
          <h1 className="text-3xl font-semibold tracking-tight text-zinc-900 dark:text-white">
            Catálogo manual
          </h1>
          <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-300">
            Precarga marcas y modelos para las sugerencias.
          </p>
        </div>

        <div className="mt-8 max-w-3xl" data-anim="fade-up">
          <CustomCatalogAdmin initialCatalog={catalog} />
        </div>
      </Container>
    </div>
  );
}
