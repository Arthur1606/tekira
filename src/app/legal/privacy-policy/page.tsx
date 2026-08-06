import Link from 'next/link';
import { ShieldCheck, ArrowLeft, Lock, FileText, CheckCircle } from 'lucide-react';

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-[#0B0F0D] text-[#F5F5F0] py-12 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="max-w-4xl mx-auto space-y-8">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#232C26] pb-6">
          <Link href="/login" className="inline-flex items-center gap-2 text-xs font-bold text-zinc-400 hover:text-[#F5F5F0] transition-colors">
            <ArrowLeft className="w-4 h-4" /> Volver al Inicio
          </Link>
          <span className="text-xs font-mono font-bold text-[#8EA653] bg-[#556B2F]/10 px-3 py-1 rounded-full border border-[#7C9A42]/30">
            TEKIRA v0.12.0
          </span>
        </div>

        <div className="space-y-3">
          <div className="w-12 h-12 bg-[#556B2F]/20 text-[#8EA653] rounded-2xl flex items-center justify-center border border-[#7C9A42]/30">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight">Política de Privacidad y Tratamiento de Datos Personales</h1>
          <p className="text-sm text-zinc-400">
            Conforme a la Ley 1581 de 2012 y el Decreto 1377 de 2013 de la República de Colombia (Habeas Data).
          </p>
        </div>

        {/* Content */}
        <div className="bg-[#0E1310] border border-[#232C26] rounded-3xl p-6 sm:p-10 space-y-8 text-sm text-zinc-300 leading-relaxed shadow-2xl">
          
          <section className="space-y-3">
            <h2 className="text-lg font-bold text-[#F5F5F0] flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-[#8EA653]" /> 1. Responsable del Tratamiento de Datos
            </h2>
            <p>
              <strong>TEKIRA</strong> actúa como responsable y encargado del tratamiento de la información recopilada a través de su plataforma SaaS de gestión comercial y control de inventarios. Nos comprometemos a proteger la privacidad y seguridad de la información de nuestros usuarios y comercios afiliados.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-bold text-[#F5F5F0] flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-[#8EA653]" /> 2. Datos Personales Recopilados
            </h2>
            <p>Recopilamos únicamente la información estrictamente necesaria para prestar nuestros servicios:</p>
            <ul className="list-disc pl-5 space-y-1 text-zinc-400">
              <li>Datos de Identificación del Usuario: Nombre, correo electrónico y credenciales de acceso.</li>
              <li>Datos de la Empresa/Comercio: Nombre comercial, NIT, dirección, teléfono institucional y moneda operada.</li>
              <li>Información Operativa Interna: Registros de ventas, compras, productos, SKU, movimientos de stock e historial de caja.</li>
              <li>Datos de Seguridad y Auditoría: Registros de inicio de sesión, verificación 2FA y logs de auditoría de roles.</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-bold text-[#F5F5F0] flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-[#8EA653]" /> 3. Propiedad de la Información Comercial
            </h2>
            <div className="p-4 bg-[#556B2F]/10 border border-[#7C9A42]/30 rounded-2xl text-[#8EA653]">
              <p className="font-bold">Principio de Propiedad del Cliente:</p>
              <p className="text-xs text-zinc-200 mt-1">
                La totalidad de los datos comerciales, financieros y de inventario generados dentro de cada comercio pertenecen única y exclusivamente al usuario titular del comercio. TEKIRA NO vende, alquila ni comercializa información con terceros bajo ninguna circunstancia.
              </p>
            </div>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-bold text-[#F5F5F0] flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-[#8EA653]" /> 4. Finalidad del Tratamiento de Datos
            </h2>
            <p>Los datos son utilizados para:</p>
            <ul className="list-disc pl-5 space-y-1 text-zinc-400">
              <li>Garantizar el correcto funcionamiento operativo del sistema SaaS TEKIRA.</li>
              <li>Validar la autenticidad del acceso mediante verificación multifactorial (2FA).</li>
              <li>Mantener el aislamiento estricto entre comercios (Multi-tenant RLS).</li>
              <li>Proporcionar soporte técnico y notificaciones sobre actualizaciones de la plataforma.</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-bold text-[#F5F5F0] flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-[#8EA653]" /> 5. Derechos del Titular (Habeas Data)
            </h2>
            <p>
              De conformidad con la Ley 1581 de 2012 de Colombia, usted tiene derecho a conocer, actualizar, rectificar y solicitar la supresión de sus datos personales almacenados en nuestros sistemas enviando una solicitud formal a nuestro canal de soporte legal.
            </p>
          </section>

          <div className="pt-6 border-t border-[#232C26] flex items-center justify-between text-xs text-zinc-500 font-mono">
            <span>Última actualización: Agosto 2026</span>
            <span>TEKIRA Legal — Versión 0.12.0</span>
          </div>

        </div>

      </div>
    </div>
  );
}
