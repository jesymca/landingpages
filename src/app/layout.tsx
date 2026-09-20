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
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Cinzel:wght@400;700;900&family=Inter:wght@400;600;800;900&family=Montserrat:wght@400;600;800;900&family=Outfit:wght@400;600;800;900&family=Playfair+Display:ital,wght@0,400;0,700;1,400&family=Plus+Jakarta+Sans:wght@400;600;800&family=Poppins:wght@400;600;800&family=Roboto:wght@400;500;700&family=Space+Grotesk:wght@400;600;700&family=Syne:wght@500;700;800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className={inter.className}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
