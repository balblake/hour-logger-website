import type { Metadata } from "next";
import "./globals.css";

const configuredSiteUrl = process.env.NEXT_PUBLIC_SITE_URL;
const vercelHost =
  process.env.VERCEL_PROJECT_PRODUCTION_URL ?? process.env.VERCEL_URL;
const siteUrl = configuredSiteUrl?.startsWith("http")
  ? configuredSiteUrl
  : vercelHost
    ? `https://${vercelHost}`
    : "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Hour Logger",
    template: "%s | Hour Logger",
  },
  description:
    "A private, spreadsheet-style hour tracker for work, volunteering, training, hobbies, and custom categories.",
  applicationName: "Hour Logger",
  openGraph: {
    title: "Hour Logger",
    description:
      "Log time in hours and minutes, organize contacts, and watch your progress grow.",
    type: "website",
    images: [
      {
        url: "/og.png",
        width: 1731,
        height: 909,
        alt: "Hour Logger experience dashboard",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Hour Logger",
    description:
      "Log time in hours and minutes, organize contacts, and watch your progress grow.",
    images: ["/og.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
