import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: "aideals — 셀럽 스타일 패션 비교",
  description: "셀럽 스타일을 탐색하고 유사 상품을 브랜드·가격별로 비교하세요",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body className="min-h-screen bg-gray-50 antialiased">
        <header className="sticky top-0 z-50 border-b border-gray-200 bg-white">
          <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4">
            <Link href="/" className="text-lg font-bold tracking-tight text-gray-900">
              aideals
            </Link>
            <nav className="flex gap-4 text-sm text-gray-500">
              <Link href="/styles" className="hover:text-gray-900">
                스타일 탐색
              </Link>
            </nav>
          </div>
        </header>
        <main className="mx-auto max-w-5xl px-4 py-6">{children}</main>
      </body>
    </html>
  );
}
