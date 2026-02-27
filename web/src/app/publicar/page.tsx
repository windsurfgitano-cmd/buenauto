import { redirect } from "next/navigation";

import { PublishForm } from "@/components/publish/publish-form";
import { Container } from "@/components/ui/container";
import { getCatalogBrands } from "@/lib/server/catalog";
import { getCurrentUser } from "@/lib/server/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export default async function PublicarPage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/ingresar?next=/publicar");
  }

  const brands = await getCatalogBrands();

  return (
    <Container className="py-12">
      <div className="max-w-2xl">
        <h1 className="text-3xl font-semibold tracking-tight text-zinc-900 dark:text-white">
          Publica tu auto
        </h1>
        <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-300">
          Crea un aviso en minutos y recibe contactos directos.
        </p>
      </div>

      <div className="mt-8">
        <PublishForm brands={brands} />
      </div>
    </Container>
  );
}
