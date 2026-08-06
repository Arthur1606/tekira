import type { Metadata, Viewport } from "next";
import { Plus_Jakarta_Sans, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-plus-jakarta",
  weight: ["400", "500", "600", "700", "800"],
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains-mono",
  weight: ["400", "700"],
});

export const metadata: Metadata = {
  title: "TEKIRA — Plataforma SaaS Empresarial de Gestión Comercial",
  description: "Plataforma SaaS empresarial para control de inventarios, bodegas, SKU inteligente, caja operativa y seguridad 2FA.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "TEKIRA",
  },
  applicationName: "TEKIRA",
};

export const viewport: Viewport = {
  themeColor: "#0B0F0D",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="es"
      className={`dark ${plusJakartaSans.variable} ${jetbrainsMono.variable} h-full antialiased bg-[#0B0F0D]`}
      style={{ colorScheme: 'dark' }}
    >
      <body className="min-h-full flex flex-col bg-[#0B0F0D] text-[#F5F5F0] font-sans selection:bg-[#556B2F]/40 selection:text-[#F5F5F0]">
        {children}
      </body>
    </html>
  );
}
