import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Cafeterías · Control central",
  description: "Demo de albaranes y fidelización",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}
