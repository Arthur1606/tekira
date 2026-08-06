import { ReactNode } from 'react';
import Link from 'next/link';

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen flex bg-[#09090B] font-sans">
      
      {/* Lado Izquierdo: Formulario */}
      <div className="w-full lg:w-1/2 flex flex-col justify-center px-8 sm:px-12 lg:px-24 xl:px-32 relative">
        
        {/* Logo superior */}
        <div className="absolute top-8 left-8 sm:left-12 lg:left-24">
          <Link href="/" className="inline-block">
            <span className="text-2xl font-black tracking-tighter text-zinc-100">
              TEKIRA<span className="text-indigo-600">●</span>
            </span>
          </Link>
        </div>

        <div className="w-full max-w-sm mx-auto mt-16 lg:mt-0">
          {children}
        </div>
      </div>

      {/* Lado Derecho: Imagen / Patrón (Solo visible en Desktop) */}
      <div className="hidden lg:flex w-1/2 bg-[#09090B] relative overflow-hidden items-center justify-center border-l border-zinc-800">
        
        {/* Patrón de malla (Mesh Gradient) o fondo abstracto tecnológico */}
        <div className="absolute inset-0 bg-gradient-to-br from-zinc-950 via-zinc-900 to-indigo-950 opacity-95"></div>
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10 mix-blend-overlay"></div>
        
        {/* Elemento decorativo "Cerebro Digital" / Blur */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-indigo-400 rounded-full mix-blend-multiply filter blur-3xl opacity-30"></div>

        <div className="relative z-10 text-center px-12 max-w-lg">
          <h2 className="text-4xl font-bold text-white mb-6 tracking-tight">
            El cerebro digital de tu empresa.
          </h2>
          <p className="text-lg text-indigo-100 leading-relaxed font-light">
            Centraliza tus operaciones, analiza tus datos en tiempo real y toma decisiones basadas en inteligencia, todo desde un único lugar seguro y escalable.
          </p>
        </div>
      </div>

    </div>
  );
}
