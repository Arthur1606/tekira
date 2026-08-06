import { ReactNode } from 'react';
import Link from 'next/link';

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen flex bg-[#0B0F0D] font-sans">
      
      {/* Lado Izquierdo: Formulario */}
      <div className="w-full lg:w-1/2 flex flex-col justify-center px-8 sm:px-12 lg:px-24 xl:px-32 relative">
        
        {/* Logo superior */}
        <div className="absolute top-8 left-8 sm:left-12 lg:left-24">
          <Link href="/" className="inline-flex items-center gap-2.5">
            <div className="w-8 h-8 bg-gradient-to-br from-[#556B2F] to-[#3B4B20] rounded-lg flex items-center justify-center border border-[#7C9A42]/30 shadow-lg shadow-[#556B2F]/10">
              <span className="text-[#F5F5F0] font-black text-lg leading-none tracking-tighter">T</span>
            </div>
            <span className="text-xl font-extrabold tracking-tight text-[#F5F5F0]">TEKIRA</span>
          </Link>
        </div>

        <div className="w-full max-w-sm mx-auto mt-16 lg:mt-0">
          {children}
        </div>
      </div>

      {/* Lado Derecho: Patrón visual (Solo visible en Desktop) */}
      <div className="hidden lg:flex w-1/2 bg-[#0E1310] relative overflow-hidden items-center justify-center border-l border-[#1E2621]">
        
        {/* Mesh gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#0B0F0D] via-[#141A16] to-[#1A2318] opacity-95"></div>
        
        {/* Decorative blur orbs */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-[#556B2F] rounded-full mix-blend-screen filter blur-[120px] opacity-20 animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-[#7C9A42] rounded-full mix-blend-screen filter blur-[120px] opacity-15"></div>

        <div className="relative z-10 text-center px-12 max-w-lg">
          <h2 className="text-4xl font-extrabold text-[#F5F5F0] mb-6 tracking-tight">
            El cerebro digital de tu empresa.
          </h2>
          <p className="text-base text-zinc-300 leading-relaxed font-light">
            Centraliza tus operaciones, analiza tus datos en tiempo real y toma decisiones basadas en inteligencia, todo desde un único lugar seguro y escalable.
          </p>
        </div>
      </div>

    </div>
  );
}
