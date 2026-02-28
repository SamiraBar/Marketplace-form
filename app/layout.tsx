import type { Metadata } from "next";
import { Unbounded, Onest } from "next/font/google";
import "./globals.css";
import { Toaster } from "sonner";

const unbounded = Unbounded({
  subsets: ["latin", "cyrillic"],
  variable: "--font-display",
  weight: ["400", "600", "700"],
});

const onest = Onest({
  subsets: ["latin", "cyrillic"],
  variable: "--font-body",
  weight: ["300", "400", "500", "600"],
});

export const metadata: Metadata = {
  title: "Создание товара | Marketplace",
  description: "Добавьте новый товар на маркетплейс",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ru" className={`${unbounded.variable} ${onest.variable}`}>
      <body>
        {children}
        <Toaster richColors position="top-right" />
      </body>
    </html>
  );
}
