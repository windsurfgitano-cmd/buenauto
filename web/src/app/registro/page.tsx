import { redirect } from "next/navigation";

import { RegisterForm } from "@/components/auth/register-form";
import { Container } from "@/components/ui/container";
import { getCurrentUser } from "@/lib/server/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export default async function RegistroPage() {
  const user = await getCurrentUser();
  if (user) {
    redirect("/mis-avisos");
  }

  return (
    <Container className="py-12">
      <div className="mx-auto max-w-md">
        <h1 className="text-3xl font-semibold tracking-tight text-zinc-900 dark:text-white">
          Crear cuenta
        </h1>
        <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-300">
          Crea tu cuenta para publicar autos y guardar favoritos.
        </p>

        <div className="mt-8">
          <RegisterForm />
        </div>
      </div>
    </Container>
  );
}
