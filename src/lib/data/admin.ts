// src/lib/data/admin.ts — 관리자 데이터 접근 레이어
// 대시보드 통계 + 엔티티별 CRUD (캐시 무효화 포함)

import { prisma } from "@/lib/prisma";
import { invalidateCache } from "@/lib/cache";

// ── Dashboard ──

export interface DashboardStats {
  categoryCount: number;
  styleCount: number;
  productCount: number;
  linkCount: number;
  userCount: number;
}

export const getDashboardStats = async (): Promise<DashboardStats> => {
  const [categoryCount, styleCount, productCount, linkCount, userCount] =
    await Promise.all([
      prisma.category.count(),
      prisma.celebStyle.count(),
      prisma.similarProduct.count(),
      prisma.purchaseLink.count(),
      prisma.user.count(),
    ]);
  return { categoryCount, styleCount, productCount, linkCount, userCount };
};

// ── Categories ──

export const getAdminCategories = () =>
  prisma.category.findMany({
    orderBy: { sortOrder: "asc" },
    include: { _count: { select: { styles: true } } },
  });

export const createCategory = async (data: {
  name: string;
  iconUrl?: string;
  sortOrder?: number;
}) => {
  const result = await prisma.category.create({ data });
  await invalidateCache("categories:*");
  return result;
};

export const updateCategory = async (
  id: string,
  data: { name?: string; iconUrl?: string; sortOrder?: number },
) => {
  const result = await prisma.category.update({ where: { id }, data });
  await invalidateCache("categories:*");
  await invalidateCache(`category:${id}`);
  return result;
};

export const deleteCategory = async (id: string) => {
  await prisma.category.delete({ where: { id } });
  await invalidateCache("categories:*");
  await invalidateCache(`category:${id}`);
};

// ── Styles ──

export const getAdminStyles = () =>
  prisma.celebStyle.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      category: { select: { name: true } },
      _count: { select: { products: true } },
    },
  });

export const createStyle = async (data: {
  celebName: string;
  imageUrl: string;
  categoryId: string;
  colors: string[];
  gender: string;
  season: string;
}) => {
  const result = await prisma.celebStyle.create({ data });
  await invalidateCache("styles:*");
  return result;
};

export const updateStyle = async (
  id: string,
  data: {
    celebName?: string;
    imageUrl?: string;
    categoryId?: string;
    colors?: string[];
    gender?: string;
    season?: string;
  },
) => {
  const result = await prisma.celebStyle.update({ where: { id }, data });
  await invalidateCache("styles:*");
  await invalidateCache(`style:${id}*`);
  return result;
};

export const deleteStyle = async (id: string) => {
  await prisma.celebStyle.delete({ where: { id } });
  await invalidateCache("styles:*");
  await invalidateCache(`style:${id}*`);
};

// ── Products ──

export const getAdminProducts = () =>
  prisma.similarProduct.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      style: { select: { celebName: true } },
      _count: { select: { purchaseLinks: true } },
    },
  });

export const createProduct = async (data: {
  styleId: string;
  brandName: string;
  productName: string;
  productImageUrl: string;
  representativePrice: number;
  similarityScore: number;
}) => {
  const result = await prisma.similarProduct.create({ data });
  await invalidateCache(`style:${data.styleId}:products*`);
  await invalidateCache("styles:*");
  return result;
};

export const updateProduct = async (
  id: string,
  data: {
    brandName?: string;
    productName?: string;
    productImageUrl?: string;
    representativePrice?: number;
    similarityScore?: number;
  },
) => {
  const result = await prisma.similarProduct.update({ where: { id }, data });
  await invalidateCache(`product:${id}*`);
  await invalidateCache(`style:${result.styleId}:products*`);
  return result;
};

export const deleteProduct = async (id: string) => {
  const product = await prisma.similarProduct.findUnique({
    where: { id },
    select: { styleId: true },
  });
  await prisma.similarProduct.delete({ where: { id } });
  await invalidateCache(`product:${id}*`);
  if (product) await invalidateCache(`style:${product.styleId}:products*`);
  return product;
};

// ── Purchase Links ──

export const getAdminLinks = () =>
  prisma.purchaseLink.findMany({
    orderBy: { lastCheckedAt: "desc" },
    include: {
      product: { select: { productName: true, brandName: true } },
    },
  });

export const createLink = async (data: {
  productId: string;
  platformName: string;
  platformLogoUrl?: string;
  price: number;
  currency?: string;
  productUrl: string;
  inStock?: boolean;
}) => {
  const result = await prisma.purchaseLink.create({
    data: { currency: "KRW", inStock: true, ...data },
  });
  await invalidateCache(`product:${data.productId}:links*`);
  return result;
};

export const updateLink = async (
  id: string,
  data: {
    platformName?: string;
    platformLogoUrl?: string;
    price?: number;
    currency?: string;
    productUrl?: string;
    inStock?: boolean;
  },
) => {
  const result = await prisma.purchaseLink.update({ where: { id }, data });
  await invalidateCache(`product:${result.productId}:links*`);
  return result;
};

export const deleteLink = async (id: string) => {
  const link = await prisma.purchaseLink.findUnique({
    where: { id },
    select: { productId: true },
  });
  await prisma.purchaseLink.delete({ where: { id } });
  if (link) await invalidateCache(`product:${link.productId}:links*`);
  return link;
};
