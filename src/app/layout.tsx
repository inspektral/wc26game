import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "WC26 Predictions",
  description: "Predict World Cup 2026 scores and climb the leaderboard.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
