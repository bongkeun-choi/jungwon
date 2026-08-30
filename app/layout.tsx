import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";

export const viewport: Viewport = {
  themeColor: "#2563eb",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export const metadata: Metadata = {
  title: "본사 마감 관리 시스템",
  description: "엑셀 파싱/보존, Turso DB 연동, GitHub 자동 백업 본사 정산 시스템",
  manifest: "/jungwon/manifest.json",
  icons: {
    icon: "/jungwon/icon.svg",
    apple: "/jungwon/icon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <head>
        <link rel="manifest" href="/jungwon/manifest.json" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="본사마감" />
      </head>
      <body className="min-h-screen bg-slate-50 font-sans">
        {children}
        <Toaster position="top-right" richColors />
      </body>
    </html>
  );
}
