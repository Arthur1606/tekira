'use client';

import React, { useState } from 'react';
import { Copy, Check } from 'lucide-react';

interface QrCodeDisplayProps {
  qrDataUrl?: string;
  secret: string;
  size?: number;
}

export function QrCodeDisplay({ qrDataUrl, secret, size = 240 }: QrCodeDisplayProps) {
  const [copied, setCopied] = useState(false);

  const handleCopySecret = () => {
    if (secret) {
      navigator.clipboard.writeText(secret);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center space-y-6 w-full">
      {/* Contenedor del QR con borde blanco y sombra premium 240px en Desktop */}
      <div className="p-4 bg-white rounded-3xl border border-zinc-200 shadow-2xl inline-block hover:scale-[1.02] transition-transform duration-300">
        {qrDataUrl ? (
          <img
            src={qrDataUrl}
            alt="Código QR 2FA TOTP TEKIRA"
            width={size}
            height={size}
            className="rounded-xl object-contain w-[180px] h-[180px] sm:w-[220px] sm:h-[220px] lg:w-[240px] lg:h-[240px]"
          />
        ) : (
          <div style={{ width: size, height: size }} className="flex items-center justify-center bg-zinc-100 text-zinc-500 text-xs font-mono rounded-xl">
            Generando QR...
          </div>
        )}
      </div>

      <p className="text-xs font-medium text-zinc-400 text-center max-w-md leading-relaxed">
        Abre tu aplicación autenticadora (Google Authenticator, Authy o Microsoft Authenticator) y escanea este código.
      </p>

      {/* Caja de Clave Manual Amplia con Botón Copiar 1-Click */}
      <div className="w-full max-w-md bg-[#0E1310] p-4 rounded-2xl border border-[#232C26] flex items-center justify-between gap-3 shadow-inner">
        <div className="space-y-0.5 overflow-hidden flex-1 min-w-0">
          <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 block">Clave Secreta Manual</span>
          <span className="font-mono text-xs sm:text-sm font-bold text-[#8EA653] select-all block tracking-widest truncate">
            {secret}
          </span>
        </div>

        <button
          type="button"
          onClick={handleCopySecret}
          className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all shrink-0 flex items-center gap-1.5 ${
            copied
              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
              : 'bg-zinc-800 hover:bg-[#19201C] text-zinc-200 border border-[#2B372F] shadow-sm'
          }`}
          title="Copiar Clave Secreta"
        >
          {copied ? (
            <>
              <Check className="w-4 h-4 text-emerald-400" />
              <span>Copiado</span>
            </>
          ) : (
            <>
              <Copy className="w-4 h-4 text-zinc-400" />
              <span>Copiar</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}

// Mantener exportación QrCodeSvg por compatibilidad
export function QrCodeSvg({ value, size = 240 }: { value: string; size?: number }) {
  return <QrCodeDisplay secret={value} size={size} />;
}
