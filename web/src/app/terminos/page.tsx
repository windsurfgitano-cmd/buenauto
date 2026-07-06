import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Términos y Condiciones - BuenAuto",
  description: "Términos y condiciones de uso del marketplace BuenAuto.",
};

export default function TerminosPage() {
  return (
    <div className="bg-[#f8f6f3] py-12">
      <div className="mx-auto max-w-3xl px-4 sm:px-6">
        <h1 className="text-3xl font-semibold text-[#0f172a] mb-2">
          Términos y Condiciones
        </h1>
        <p className="text-sm text-[#64748b] mb-8">
          Última actualización: julio de 2026
        </p>

        <div className="space-y-6 text-[#334155] leading-relaxed">
          <section>
            <h2 className="text-xl font-semibold text-[#0f172a] mb-2">1. Qué es BuenAuto</h2>
            <p>
              BuenAuto es una plataforma de anuncios clasificados que conecta a
              personas que quieren vender un vehículo con personas interesadas en
              comprarlo. BuenAuto <strong>no es parte de la compraventa</strong>:
              no somos dueños de los vehículos publicados, no intervenimos en la
              negociación, no recibimos el dinero de la venta y no garantizamos el
              estado de los vehículos.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-[#0f172a] mb-2">2. Cuentas</h2>
            <p>
              Para publicar avisos necesitas una cuenta con un correo válido. Eres
              responsable de mantener la confidencialidad de tu contraseña y de la
              información que publicas. Podemos suspender cuentas que publiquen
              información falsa, contenido ilegal o que intenten estafar a otros
              usuarios.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-[#0f172a] mb-2">3. Publicaciones</h2>
            <p>
              Al publicar un aviso declaras que la información entregada es
              verídica, que tienes derecho a vender el vehículo y que las fotos
              corresponden al vehículo ofrecido. Las publicaciones pagadas tienen
              una vigencia de 30 días desde su activación. BuenAuto puede retirar
              publicaciones que infrinjan estos términos, sin derecho a
              reembolso en caso de infracción.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-[#0f172a] mb-2">4. Pagos</h2>
            <p>
              Los pagos por publicaciones, planes y destacados se procesan a
              través de <strong>MercadoPago</strong>. BuenAuto no almacena datos
              de tarjetas. Los precios se expresan en pesos chilenos (CLP) e
              incluyen impuestos cuando corresponda.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-[#0f172a] mb-2">5. Responsabilidad del comprador</h2>
            <p>
              Antes de comprar un vehículo, verifica siempre su estado mecánico y
              legal: revisión técnica, multas, prendas y limitaciones al dominio.
              Te recomendamos concretar las transacciones en lugares seguros y
              nunca transferir dinero sin haber visto el vehículo.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-[#0f172a] mb-2">6. Modificaciones</h2>
            <p>
              Podemos actualizar estos términos. Los cambios rigen desde su
              publicación en esta página. El uso continuado de la plataforma
              implica la aceptación de los términos vigentes.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-[#0f172a] mb-2">7. Contacto</h2>
            <p>
              Para dudas sobre estos términos escríbenos a{" "}
              <a href="mailto:contacto@buenauto.cl" className="text-[#1e3a5f] underline">
                contacto@buenauto.cl
              </a>
              .
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
