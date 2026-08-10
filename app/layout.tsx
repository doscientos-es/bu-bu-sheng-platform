import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import { DashboardShell } from "@/components/layout/DashboardShell";
import "./globals.css";

const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-jakarta",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Cafeterías · Control central",
  description: "Demo de albaranes y fidelización",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es">
      <body className={jakarta.variable}>
        <DashboardShell>{children}</DashboardShell>
      </body>
    </html>
  );
}
