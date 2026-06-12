import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ProgressProvider } from "../hooks/use-progress";
import { SidebarProvider } from "../components/layout/sidebar-provider";
import { SiteHeader } from "../components/layout/site-header";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "Cloudflare Stack Lab",
    template: "%s | Cloudflare Stack Lab",
  },
  description:
    "Cloudflare の主要スタック（Workers / OpenNext / D1 / R2 / KV / Durable Objects / Containers / Flagship）を読んで・触って学ぶ日本語学習サイト。",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      <head>
        <link rel="icon" href="/favicon.svg" type="image/svg+xml"></link>
      </head>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <ProgressProvider>
          <SidebarProvider>
            <SiteHeader />
            <main>{children}</main>
          </SidebarProvider>
        </ProgressProvider>
      </body>
    </html>
  );
}
