import { getDashboardStats } from "@/lib/data/admin";

export default async function AdminDashboardPage() {
  const stats = await getDashboardStats();

  const cards = [
    { label: "카테고리", value: stats.categoryCount, href: "/admin/categories" },
    { label: "스타일", value: stats.styleCount, href: "/admin/styles" },
    { label: "상품", value: stats.productCount, href: "/admin/products" },
    { label: "구매처", value: stats.linkCount, href: "/admin/purchase-links" },
    { label: "사용자", value: stats.userCount, href: null },
  ];

  return (
    <div>
      <h1 className="text-xl font-bold text-gray-900">대시보드</h1>
      <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
        {cards.map((card) => (
          <div
            key={card.label}
            className="rounded-lg border border-gray-200 bg-white p-5"
          >
            <p className="text-sm text-gray-500">{card.label}</p>
            <p className="mt-1 text-2xl font-bold text-gray-900">
              {card.value.toLocaleString()}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
