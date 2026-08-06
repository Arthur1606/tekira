import Link from 'next/link';
import { FileText, ArrowLeft, Shield, CheckCircle, Scale } from 'lucide-react';

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-[#09090B] text-zinc-100 py-12 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="max-w-4xl mx-auto space-y-8">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-zinc-800 pb-6">
          <Link href="/login" className="inline-flex items-center gap-2 text-xs font-bold text-zinc-400 hover:text-zinc-100 transition-colors">
            <ArrowLeft className="w-4 h-4" /> Volver al Inicio
          </Link>
          <span className="text-xs font-mono font-bold text-indigo-400 bg-indigo-500/10 px-3 py-1 rounded-full border border-indigo-500/20">
            TEKIRA v0.12.0
          </span>
        </div>

        <div className="space-y-3">
          <div className="w-12 h-12 bg-indigo-600/20 text-indigo-400 rounded-2xl flex items-center justify-center border border-indigo-500/30">
            <Scale className="w-6 h-6" />
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight">Términos y Condiciones de Uso del Servicio</h1>
          <p className="text-sm text-zinc-400">
            Reglas del servicio SaaS empresarial de TEKIRA para propietarios, administradores y empleados.
          </p>
        </div>

        {/* Content */}
        <div className="bg-zinc-950 border border-zinc-800 rounded-3xl p-6 sm:p-10 space-y-8 text-sm text-zinc-300 leading-relaxed shadow-2xl">
          
          <section className="space-y-3">
            <h2 className="text-lg font-bold text-zinc-100 flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-indigo-400" /> 1. Aceptación de los Términos
            </h2>
            <p>
              Al registrarse, acceder o utilizar la plataforma TEKIRA, el usuario declara haber leído, comprendido y aceptado la totalidad de estos Términos y Condiciones de Uso. Si no está de acuerdo con alguno de los términos, no deberá acceder al sistema.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-bold text-zinc-100 flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-indigo-400" /> 2. Propiedad Intelectual Exclusiva
            </h2>
            <div className="p-4 bg-zinc-900/80 border border-zinc-800 rounded-2xl text-xs space-y-2 text-zinc-300">
              <p className="font-bold text-zinc-100">Derechos Reservados © 2026 TEKIRA:</p>
              <p>
                TEKIRA y todo su código fuente, arquitectura de base de datos, algoritmos de SKU, componentes visuales y logotipos son propiedad intelectual exclusiva de su autor. Queda prohibida la reproducción, modificación comercial, venta o distribución no autorizada.
              </p>
            </div>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-bold text-zinc-100 flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-indigo-400" /> 3. Uso Permitido y Responsabilidad de Credenciales
            </h2>
            <p>
              El uso de la plataforma es exclusivo para fines empresariales legítimos. Cada usuario es responsable de mantener la confidencialidad de su contraseña y la correcta configuración de su aplicación de autenticación de dos factores (2FA TOTP).
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-bold text-zinc-100 flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-indigo-400" /> 4. Roles y Permisos en el Comercio
            </h2>
            <ul className="list-disc pl-5 space-y-1 text-zinc-400">
              <li><strong>PROPIETARIO (Owner):</strong> Control absoluto de la organización, gestión de usuarios, eliminaciones seguras y configuraciones legales.</li>
              <li><strong>ADMINISTRADOR (Admin):</strong> Gestión operativa de ventas, compras e inventarios sin permisos de eliminación definitiva.</li>
              <li><strong>EMPLEADO (Employee):</strong> Registro de movimientos diarios con código asignado e inmutable (`TKR-EMP-XXXXXX`).</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-bold text-zinc-100 flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-indigo-400" /> 5. Suspensión de Cuentas y Seguridad
            </h2>
            <p>
              TEKIRA se reserva el derecho de suspender temporal o definitivamente cuentas que incurran en intentos de intrusión, vulneración de seguridad o uso fraudulento de la plataforma.
            </p>
          </section>

          <div className="pt-6 border-t border-zinc-800 flex items-center justify-between text-xs text-zinc-500 font-mono">
            <span>Vigencia: Versión v0.12.0</span>
            <span>TEKIRA Legal Services</span>
          </div>

        </div>

      </div>
    </div>
  );
}
