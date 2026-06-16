import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Flood-Rice Resilience",
  description: "Operational dashboard for flood-resilient West Java rice supply-chain planning",
  icons: {
    icon: "/figures/01b_jabar_flood_exposure_by_region.png"
  }
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
