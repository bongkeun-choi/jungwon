import type { Metadata } from "next";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";

export const metadata: Metadata = {
  title: "본사 마감 관리 시스템",
  description: "엑셀 파싱/보존, Turso DB 연동, GitHub 자동 백업 본사 정산 시스템",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body className="min-h-screen bg-slate-50 font-sans">
        {children}
        <Toaster position="top-right" richColors />
      </body>
    </html>
  );
}
