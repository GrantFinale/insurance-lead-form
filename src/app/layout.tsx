import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Compare Insurance Quotes | Get the Best Rates",
  description: "Compare personalized insurance quotes for auto, home, health, life and business. Get the right coverage at the best price.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
