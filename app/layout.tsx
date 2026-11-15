import type { Metadata } from "next";
import { IBM_Plex_Sans, Pixelify_Sans } from "next/font/google";
import "./globals.css";

const plexSans = IBM_Plex_Sans({
  variable: "--font-body",
  subsets: ["latin", "latin-ext"],
  weight: ["400", "500", "600"],
  display: "swap",
});

const pixelSans = Pixelify_Sans({
  variable: "--font-pixel",
  subsets: ["latin", "latin-ext"],
  display: "swap",
});

export const metadata: Metadata = {
  title: { default: "Promptify · Biblioteca de Prompts", template: "%s · Promptify" },
  description: "La biblioteca interna donde compartimos Prompts para trabajar mejor.",
  robots: { index: false, follow: false },
};

export default function RootLayout({ children, modal }: LayoutProps<"/">) {
  return (
    <html
      lang="es"
      className={`${plexSans.variable} ${pixelSans.variable} h-full`}
    >
      <body className="min-h-full flex flex-col">{children}{modal}</body>
    </html>
  );
}
