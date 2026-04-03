import type { Metadata } from "next";
import "@/styles/globals.css";   // ← so

export const metadata: Metadata = {
  title: "FamilyHub",
  // ...
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="de">
      <body>{children}</body>
    </html>
  );
}