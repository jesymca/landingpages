import "./globals.css";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Providers } from "./providers";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "LinkBio Venezuela | Tu Creador de Páginas de Enlaces SaaS",
  description: "Crea tu página de enlaces estilo Linktree con previsualización en vivo, videos de fondo, pagos flexibles en Bolívares (BCV) y CDN Cloudflare R2.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es" className="dark">
      <body className={inter.className}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
