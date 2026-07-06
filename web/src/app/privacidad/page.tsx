import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Política de Privacidad - BuenAuto",
  description: "Cómo BuenAuto trata tus datos personales.",
};

export default function PrivacidadPage() {
  return (
    <div className="bg-[#f8f6f3] py-12">
      <div className="mx-auto max-w-3xl px-4 sm:px-6">
        <h1 className="text-3xl font-semibold text-[#0f172a] mb-2">
          Política de Privacidad
        </h1>
        <p className="text-sm text-[#64748b] mb-8">
          Última actualización: julio de 2026
        </p>

        <div className="space-y-6 text-[#334155] leading-relaxed">
          <section>
            <h2 className="text-xl font-semibold text-[#0f172a] mb-2">1. Datos que recolectamos</h2>
            <p>
              Al crear una cuenta guardamos tu correo electrónico, tu nombre (si
              lo entregas) y tu contraseña protegida con hash criptográfico —
              nunca en texto plano. Al publicar un aviso guardamos los datos del
              vehículo y los datos de contacto que tú decides mostrar
              públicamente (nombre y teléfono de contacto).
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-[#0f172a] mb-2">2. Para qué los usamos</h2>
            <p>
              Usamos tus datos exclusivamente para operar la plataforma: mostrar
              tus avisos, gestionar tu sesión, procesar tus pagos y contactarte
              por temas de tu cuenta. <strong>No vendemos tus datos</strong> ni
              los compartimos con terceros con fines publicitarios.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-[#0f172a] mb-2">3. Pagos</h2>
            <p>
              Los pagos se procesan a través de MercadoPago. Los datos de tu
              tarjeta los maneja MercadoPago bajo sus propias políticas de
              seguridad; BuenAuto nunca los ve ni los almacena.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-[#0f172a] mb-2">4. Cookies</h2>
            <p>
              Usamos una única cookie de sesión (técnica, indispensable) para
              mantenerte conectado. No usamos cookies de seguimiento ni de
              publicidad.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-[#0f172a] mb-2">5. Tus derechos</h2>
            <p>
              Conforme a la Ley 19.628 sobre protección de la vida privada,
              puedes solicitar el acceso, rectificación o eliminación de tus
              datos personales escribiéndonos a{" "}
              <a href="mailto:contacto@buenauto.cl" className="text-[#1e3a5f] underline">
                contacto@buenauto.cl
              </a>
              . Al eliminar tu cuenta se eliminan tus datos personales y tus
              avisos dejan de estar publicados.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-[#0f172a] mb-2">6. Seguridad</h2>
            <p>
              Tus datos se almacenan en infraestructura cifrada en tránsito y en
              reposo. Aun así, ningún sistema es infalible: usa una contraseña
              única para BuenAuto.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
