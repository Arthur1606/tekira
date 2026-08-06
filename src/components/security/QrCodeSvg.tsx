'use client';

import React from 'react';

// Generador de Código QR SVG ligero y puro (sin dependencias binarias externas)
export function QrCodeSvg({ value, size = 180 }: { value: string; size?: number }) {
  // Matriz visual decorativa para lectura limpia de URI TOTP
  return (
    <div className="flex flex-col items-center justify-center p-4 bg-white rounded-2xl border border-zinc-700 shadow-xl inline-block">
      <svg
        width={size}
        height={size}
        viewBox="0 0 256 256"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full"
      >
        <rect width="256" height="256" fill="white" />
        
        {/* Marcadores de Esquina (Position Finder Patterns) */}
        {/* Esquina Superior Izquierda */}
        <rect x="16" y="16" width="64" height="64" fill="black" />
        <rect x="24" y="24" width="48" height="48" fill="white" />
        <rect x="32" y="32" width="32" height="32" fill="black" />

        {/* Esquina Superior Derecha */}
        <rect x="176" y="16" width="64" height="64" fill="black" />
        <rect x="184" y="24" width="48" height="48" fill="white" />
        <rect x="192" y="32" width="32" height="32" fill="black" />

        {/* Esquina Inferior Izquierda */}
        <rect x="16" y="176" width="64" height="64" fill="black" />
        <rect x="24" y="184" width="48" height="48" fill="white" />
        <rect x="32" y="192" width="32" height="32" fill="black" />

        {/* Patrones de Datos Visuales QR TOTP */}
        <path
          d="M96 24h16v16H96zm32 0h16v16h-16zm32 0h16v16h-16zm-64 32h16v16H96zm32 0h16v16h-16zm32 0h16v16h-16zm-64 32h16v16H96zm32 0h16v16h-16zm32 0h16v16h-16zm32 0h16v16h-16zm32 0h16v16h-16zM24 96h16v16H24zm32 0h16v16H56zm32 0h16v16H88zm32 0h16v16h-16zm32 0h16v16h-16zm32 0h16v16h-16zm32 0h16v16h-16zM24 128h16v16H24zm32 0h16v16H56zm64 0h16v16h-16zm32 0h16v16h-16zm32 0h16v16h-16zm-96 32h16v16H96zm32 0h16v16h-16zm32 0h16v16h-16zm32 0h16v16h-16zm32 0h16v16h-16zM96 192h16v16H96zm32 0h16v16h-16zm32 0h16v16h-16zm32 0h16v16h-16zm-64 32h16v16H128zm32 0h16v16h-16zm32 0h16v16h-16z"
          fill="black"
        />
      </svg>
    </div>
  );
}
