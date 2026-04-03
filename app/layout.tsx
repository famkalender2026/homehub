import type { Metadata } from "next";
import "@/styles/globals.css";
import { AppShell } from "@/components/AppShell"; // Pfad eventuell anpassen, falls AppShell woanders liegt

export const metadata: Metadata = {
  title: "FamilyHub",
  description: "Dein zentraler Familien-Hub",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="de">
      <body style={{ margin: 0, padding: 0, backgroundColor: '#f8fafc' }}>
        <AppShell>
          {children}
        </AppShell>
      </body>
    </html>
  );
}