import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";

export const metadata: Metadata = {
  title: "관리자 — aideals",
};

const NAV_ITEMS = [
  { href: "/admin", label: "대시보드" },
  { href: "/admin/categories", label: "카테고리" },
  { href: "/admin/styles", label: "스타일" },
  { href: "/admin/products", label: "상품" },
  { href: "/admin/purchase-links", label: "구매처" },
] as const;

export default async function AdminLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await auth();

  if (!session) redirect("/login");
  if (session.user.role !== "admin") redirect("/");

  return (
    <div className="flex min-h-[calc(100vh-3.5rem)]">
      <aside className="w-52 shrink-0 border-r border-gray-200 bg-white">
        <div className="px-4 py-5">
          <span className="text-xs font-semibold uppercase tracking-wider text-gray-400">
            관리자
          </span>
        </div>
        <nav className="space-y-1 px-2">
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="block rounded-md px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-gray-900"
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="mt-auto border-t border-gray-200 px-4 py-4">
          <Link
            href="/"
            className="text-xs text-gray-400 hover:text-gray-600"
          >
            사이트로 돌아가기
          </Link>
        </div>
      </aside>
      <div className="flex-1 overflow-auto p-6">{children}</div>
    </div>
  );
}
