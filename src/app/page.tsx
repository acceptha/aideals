import { CategoryGridClient } from "@/components/CategoryGrid.client";
import { prisma } from "@/lib/prisma";

export default async function HomePage() {
  const categories = await prisma.category.findMany({
    orderBy: { sortOrder: "asc" },
    select: { id: true, name: true, iconUrl: true, sortOrder: true },
  });

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">어떤 스타일을 찾고 계세요?</h1>
        <p className="mt-1 text-sm text-gray-500">카테고리를 선택하면 셀럽 스타일을 탐색할 수 있어요</p>
      </div>
      <CategoryGridClient categories={categories} />
    </div>
  );
}
