'use client';

import React, { useState } from 'react';
import { Copy, Check } from 'lucide-react';

interface QrCodeDisplayProps {
  qrDataUrl?: string;
  secret: string;
  size?: number;
}

export function QrCodeDisplay({ qrDataUrl, secret, size = 180 }: QrCodeDisplayProps) {
  const [copied, setCopied] = useState(false);

  const handleCopySecret = () => {
    if (secret) {
      navigator.clipboard.writeText(secret);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center space-y-4 w-full">
      {/* Contenedor del QR con borde blanco y sombra */}
      <div className="p-3 bg-white rounded-2xl border border-zinc-700 shadow-2xl inline-block">
        {qrDataUrl ? (
          <img
            src={qrDataUrl}
            alt="Código QR 2FA TOTP TEKIRA"
            width={size}
            height={size}
            className="rounded-lg object-contain"
          />
        ) : (
          <div style={{ width: size, height: size }} className="flex items-center justify-center bg-zinc-100 text-zinc-500 text-xs font-mono">
            Generando QR...
          </div>
        )}
      </div>

      <p className="text-[11px] font-medium text-zinc-400 text-center max-w-xs">
        Abre tu aplicación autenticadora (Google Authenticator, Authy o Microsoft Authenticator) y escanea este código.
      </p>

      {/* Caja de Clave Manual con Botón Copiar 1-Click */}
      <div className="w-full max-w-xs bg-zinc-950 p-3 rounded-xl border border-zinc-800 flex items-center justify-between gap-2 shadow-inner">
        <div className="space-y-0.5 overflow-hidden">
          <span className="text-[9px] font-bold uppercase tracking-widest text-zinc-500 block">Clave Secreta Manual</span>
          <span className="font-mono text-xs font-bold text-indigo-300 select-all block tracking-wider truncate">
            {secret}
          </span>
        </div>

        <button
          type="button"
          onClick={handleCopySecret}
          className={`p-2 rounded-lg text-xs font-bold transition-all shrink-0 flex items-center gap-1 ${
            copied
              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
              : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-300 border border-zinc-700'
          }`}
          title="Copiar Clave Secreta"
        >
          {copied ? (
            <>
              <Check className="w-3.5 h-3.5" />
              <span className="text-[10px]">Copiado</span>
            </>
          ) : (
            <>
              <Copy className="w-3.5 h-3.5" />
              <span className="text-[10px]">Copiar</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}

// Mantener exportación QrCodeSvg por compatibilidad
export function QrCodeSvg({ value, size = 180 }: { value: string; size?: number }) {
  return <QrCodeDisplay secret={value} size={size} />;
}
