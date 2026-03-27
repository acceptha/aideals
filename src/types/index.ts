// src/types/index.ts
// 도메인 엔티티 공유 타입
// Single Source of Truth: prisma/schema.prisma

export interface Category {
  id: string;
  name: string;
  iconUrl: string | null;
  sortOrder: number;
}

export interface CelebStyle {
  id: string;
  celebName: string;
  imageUrl: string;
  categoryId: string;
  colors: string[];
  gender: string;
  season: string;
  createdAt: Date;
}

export interface SimilarProduct {
  id: string;
  styleId: string;
  brandName: string;
  productName: string;
  productImageUrl: string;
  representativePrice: number;
  similarityScore: number;
  createdAt: Date;
}

export interface PurchaseLink {
  id: string;
  productId: string;
  platformName: string;
  platformLogoUrl: string | null;
  price: number;
  currency: string;
  productUrl: string;
  inStock: boolean;
  lastCheckedAt: Date;
}
