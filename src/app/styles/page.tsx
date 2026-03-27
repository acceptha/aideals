import { Suspense } from "react";
import { FilterBar } from "@/components/FilterBar.client";
import { StyleCard } from "@/components/StyleCard";
import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";

interface StylesPageProps {
  searchParams: Promise<{
    categoryId?: string;
    gender?: string;
    color?: string;
  }>;
}

const SEASON_BY_MONTH: Record<number, string[]> = {
  1: ["winter"],
  2: ["winter"],
  3: ["spring", "winter"],
  4: ["spring"],
  5: ["spring"],
  6: ["summer", "spring"],
  7: ["summer"],
  8: ["summer"],
  9: ["fall", "summer"],
  10: ["fall"],
  11: ["fall"],
  12: ["winter", "fall"],
};

export default async function StylesPage({ searchParams }: StylesPageProps) {
  const params = await searchParams;
  const { categoryId, gender, color } = params;

  // 카테고리명 조회
  let title = "전체 스타일";
  if (categoryId) {
    const category = await prisma.category.findUnique({
      where: { id: categoryId },
      select: { name: true },
    });
    if (category) title = category.name;
  }

  // 필터 조건 구성
  const where: Prisma.CelebStyleWhereInput = {};
  if (categoryId) where.categoryId = categoryId;
  if (gender) where.gender = gender;
  if (color) {
    where.colors = { hasSome: color.split(",") };
  }

  const allStyles = await prisma.celebStyle.findMany({
    where,
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      celebName: true,
      imageUrl: true,
      categoryId: true,
      colors: true,
      gender: true,
      season: true,
      createdAt: true,
    },
  });

  // 시즌 자동 정렬
  const month = new Date().getMonth() + 1;
  const prioritySeasons = SEASON_BY_MONTH[month] ?? [];

  const styles = [...allStyles].sort((a, b) => {
    const aIdx = prioritySeasons.indexOf(a.season);
    const bIdx = prioritySeasons.indexOf(b.season);
    const aWeight = aIdx === -1 ? 99 : aIdx;
    const bWeight = bIdx === -1 ? 99 : bIdx;
    if (aWeight !== bWeight) return aWeight - bWeight;
    return b.createdAt.getTime() - a.createdAt.getTime();
  });

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-bold text-gray-900">{title}</h1>
        <p className="mt-0.5 text-sm text-gray-500">{styles.length}개의 스타일</p>
      </div>

      <Suspense>
        <FilterBar />
      </Suspense>

      {styles.length === 0 ? (
        <div className="flex flex-col items-center gap-2 py-20 text-gray-400">
          <span className="text-4xl">🔍</span>
          <p className="text-sm">조건에 맞는 스타일이 없어요</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          {styles.map((style) => (
            <StyleCard key={style.id} style={style} />
          ))}
        </div>
      )}
    </div>
  );
}
