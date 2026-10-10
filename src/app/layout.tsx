import type { Metadata } from "next";
import "@fontsource/newsreader/400.css";
import "@fontsource/newsreader/400-italic.css";
import "@fontsource/inter/400.css";
import "@fontsource/inter/500.css";
import "@fontsource/inter/600.css";
import "./globals.css";
import { LangProvider } from "@/i18n";
import { PosthogProvider } from "../components/PosthogProvider";

export const metadata: Metadata = {
  title: "The Montreal Premium: what the same GPU costs in Canada vs the US",
  description:
    "The same GPU costs 11.0% to 23.1% more per hour in a Canadian cloud region than in the nearest US region, on identical on-demand SKUs (Oct 9, 2026). Azure and AWS per-region list prices, CAD conversion, REST API, OpenAPI docs, and MCP tools. Open data, MIT licensed.",
  metadataBase: new URL("https://gpu.canada.nshipyard.com"),
  openGraph: {
    title: "The Montreal Premium: what the same GPU costs in Canada vs the US",
    description:
      "An H100 costs 23.1% more per hour in Canada Central than in East US. An AWS A10G costs 11.0% more in Canada. Scraped from the pricing APIs, October 9, 2026.",
    type: "website",
    images: [{ url: "/og-card.png", width: 1200, height: 630 }],
  },
  twitter: {
    card: "summary_large_image",
    title: "The Montreal Premium: what the same GPU costs in Canada vs the US",
    description:
      "An H100 costs 23.1% more per hour in Canada Central than in East US. An AWS A10G costs 11.0% more in Canada. Scraped from the pricing APIs, October 9, 2026.",
    images: ["/og-card.png"],
  },
  icons: {
    icon: [
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
      { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
      "/favicon.ico",
    ],
    apple: "/apple-touch-icon.png",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="h-full antialiased">
      <head>
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />
        <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
      </head>
      <body className="min-h-full flex flex-col"><PosthogProvider>
        <LangProvider>{children}</LangProvider>
      </PosthogProvider></body>
    </html>
  );
}
