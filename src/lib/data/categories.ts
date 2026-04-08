// src/lib/data/categories.ts — 카테고리 데이터 접근 레이어

import { withCache, CACHE_TTL } from "@/lib/cache";
import { prisma } from "@/lib/prisma";

const CATEGORY_SELECT = {
  id: true,
  name: true,
  iconUrl: true,
  sortOrder: true,
} as const;

/** 전체 카테고리 목록 (sortOrder 정렬) */
export const getCategories = () =>
  withCache("categories:all", CACHE_TTL.CATEGORY, () =>
    prisma.category.findMany({
      orderBy: { sortOrder: "asc" },
      select: CATEGORY_SELECT,
    }),
  );

/** 카테고리 단건 조회 (존재 확인 + 이름) */
export const getCategoryById = (id: string) =>
  withCache(`category:${id}`, CACHE_TTL.CATEGORY, () =>
    prisma.category.findUnique({
      where: { id },
      select: CATEGORY_SELECT,
    }),
  );
