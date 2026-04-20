"use server";

// src/app/admin/actions.ts — 관리자 Server Actions
// 모든 액션은 admin 권한 확인 후 data 계층 함수를 호출한다.

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import {
  createCategory,
  updateCategory,
  deleteCategory,
  createStyle,
  updateStyle,
  deleteStyle,
  createProduct,
  updateProduct,
  deleteProduct,
  createLink,
  updateLink,
  deleteLink,
} from "@/lib/data/admin";

interface ActionResult {
  success: boolean;
  error?: string;
}

async function requireAdmin(): Promise<ActionResult | null> {
  const session = await auth();
  if (!session || session.user.role !== "admin") {
    return { success: false, error: "권한이 없습니다" };
  }
  return null;
}

// ── Categories ──

export async function createCategoryAction(
  formData: FormData,
): Promise<ActionResult> {
  const denied = await requireAdmin();
  if (denied) return denied;

  const name = formData.get("name") as string;
  if (!name?.trim()) return { success: false, error: "카테고리명을 입력하세요" };

  await createCategory({
    name: name.trim(),
    iconUrl: (formData.get("iconUrl") as string) || undefined,
    sortOrder: Number(formData.get("sortOrder")) || 0,
  });
  revalidatePath("/admin/categories");
  return { success: true };
}

export async function updateCategoryAction(
  id: string,
  formData: FormData,
): Promise<ActionResult> {
  const denied = await requireAdmin();
  if (denied) return denied;

  const name = formData.get("name") as string;
  if (!name?.trim()) return { success: false, error: "카테고리명을 입력하세요" };

  await updateCategory(id, {
    name: name.trim(),
    iconUrl: (formData.get("iconUrl") as string) || undefined,
    sortOrder: Number(formData.get("sortOrder")) || 0,
  });
  revalidatePath("/admin/categories");
  return { success: true };
}

export async function deleteCategoryAction(id: string): Promise<ActionResult> {
  const denied = await requireAdmin();
  if (denied) return denied;

  try {
    await deleteCategory(id);
  } catch {
    return { success: false, error: "하위 스타일이 있어 삭제할 수 없습니다" };
  }
  revalidatePath("/admin/categories");
  return { success: true };
}

// ── Styles ──

export async function createStyleAction(
  formData: FormData,
): Promise<ActionResult> {
  const denied = await requireAdmin();
  if (denied) return denied;

  const celebName = formData.get("celebName") as string;
  const imageUrl = formData.get("imageUrl") as string;
  const categoryId = formData.get("categoryId") as string;
  const gender = formData.get("gender") as string;
  const season = formData.get("season") as string;
  const colorsRaw = formData.get("colors") as string;

  if (!celebName?.trim()) return { success: false, error: "셀럽명을 입력하세요" };
  if (!imageUrl?.trim()) return { success: false, error: "이미지 URL을 입력하세요" };
  if (!categoryId) return { success: false, error: "카테고리를 선택하세요" };
  if (!gender) return { success: false, error: "성별을 선택하세요" };
  if (!season) return { success: false, error: "시즌을 선택하세요" };

  const colors = colorsRaw
    ? colorsRaw.split(",").map((c) => c.trim()).filter(Boolean)
    : [];

  await createStyle({
    celebName: celebName.trim(),
    imageUrl: imageUrl.trim(),
    categoryId,
    colors,
    gender,
    season,
  });
  revalidatePath("/admin/styles");
  return { success: true };
}

export async function updateStyleAction(
  id: string,
  formData: FormData,
): Promise<ActionResult> {
  const denied = await requireAdmin();
  if (denied) return denied;

  const celebName = formData.get("celebName") as string;
  if (!celebName?.trim()) return { success: false, error: "셀럽명을 입력하세요" };

  const colorsRaw = formData.get("colors") as string;
  const colors = colorsRaw
    ? colorsRaw.split(",").map((c) => c.trim()).filter(Boolean)
    : [];

  await updateStyle(id, {
    celebName: celebName.trim(),
    imageUrl: (formData.get("imageUrl") as string) || undefined,
    categoryId: (formData.get("categoryId") as string) || undefined,
    colors,
    gender: (formData.get("gender") as string) || undefined,
    season: (formData.get("season") as string) || undefined,
  });
  revalidatePath("/admin/styles");
  return { success: true };
}

export async function deleteStyleAction(id: string): Promise<ActionResult> {
  const denied = await requireAdmin();
  if (denied) return denied;

  try {
    await deleteStyle(id);
  } catch {
    return { success: false, error: "하위 상품이 있어 삭제할 수 없습니다" };
  }
  revalidatePath("/admin/styles");
  return { success: true };
}

// ── Products ──

export async function createProductAction(
  formData: FormData,
): Promise<ActionResult> {
  const denied = await requireAdmin();
  if (denied) return denied;

  const styleId = formData.get("styleId") as string;
  const brandName = formData.get("brandName") as string;
  const productName = formData.get("productName") as string;
  const productImageUrl = formData.get("productImageUrl") as string;
  const representativePrice = Number(formData.get("representativePrice"));
  const similarityScore = Number(formData.get("similarityScore")) || 0;

  if (!styleId) return { success: false, error: "스타일을 선택하세요" };
  if (!brandName?.trim()) return { success: false, error: "브랜드명을 입력하세요" };
  if (!productName?.trim()) return { success: false, error: "상품명을 입력하세요" };
  if (!productImageUrl?.trim()) return { success: false, error: "이미지 URL을 입력하세요" };
  if (!representativePrice) return { success: false, error: "가격을 입력하세요" };

  await createProduct({
    styleId,
    brandName: brandName.trim(),
    productName: productName.trim(),
    productImageUrl: productImageUrl.trim(),
    representativePrice,
    similarityScore,
  });
  revalidatePath("/admin/products");
  return { success: true };
}

export async function updateProductAction(
  id: string,
  formData: FormData,
): Promise<ActionResult> {
  const denied = await requireAdmin();
  if (denied) return denied;

  const brandName = formData.get("brandName") as string;
  if (!brandName?.trim()) return { success: false, error: "브랜드명을 입력하세요" };

  await updateProduct(id, {
    brandName: brandName.trim(),
    productName: ((formData.get("productName") as string) || "").trim() || undefined,
    productImageUrl: ((formData.get("productImageUrl") as string) || "").trim() || undefined,
    representativePrice: Number(formData.get("representativePrice")) || undefined,
    similarityScore: Number(formData.get("similarityScore")) || undefined,
  });
  revalidatePath("/admin/products");
  return { success: true };
}

export async function deleteProductAction(id: string): Promise<ActionResult> {
  const denied = await requireAdmin();
  if (denied) return denied;

  try {
    await deleteProduct(id);
  } catch {
    return { success: false, error: "하위 구매처가 있어 삭제할 수 없습니다" };
  }
  revalidatePath("/admin/products");
  return { success: true };
}

// ── Purchase Links ──

export async function createLinkAction(
  formData: FormData,
): Promise<ActionResult> {
  const denied = await requireAdmin();
  if (denied) return denied;

  const productId = formData.get("productId") as string;
  const platformName = formData.get("platformName") as string;
  const price = Number(formData.get("price"));
  const productUrl = formData.get("productUrl") as string;

  if (!productId) return { success: false, error: "상품을 선택하세요" };
  if (!platformName?.trim()) return { success: false, error: "플랫폼명을 입력하세요" };
  if (!price) return { success: false, error: "가격을 입력하세요" };
  if (!productUrl?.trim()) return { success: false, error: "상품 URL을 입력하세요" };

  await createLink({
    productId,
    platformName: platformName.trim(),
    platformLogoUrl: ((formData.get("platformLogoUrl") as string) || "").trim() || undefined,
    price,
    currency: (formData.get("currency") as string) || "KRW",
    productUrl: productUrl.trim(),
    inStock: formData.get("inStock") === "true",
  });
  revalidatePath("/admin/purchase-links");
  return { success: true };
}

export async function updateLinkAction(
  id: string,
  formData: FormData,
): Promise<ActionResult> {
  const denied = await requireAdmin();
  if (denied) return denied;

  const platformName = formData.get("platformName") as string;
  if (!platformName?.trim()) return { success: false, error: "플랫폼명을 입력하세요" };

  await updateLink(id, {
    platformName: platformName.trim(),
    platformLogoUrl: ((formData.get("platformLogoUrl") as string) || "").trim() || undefined,
    price: Number(formData.get("price")) || undefined,
    currency: (formData.get("currency") as string) || undefined,
    productUrl: ((formData.get("productUrl") as string) || "").trim() || undefined,
    inStock: formData.has("inStock") ? formData.get("inStock") === "true" : undefined,
  });
  revalidatePath("/admin/purchase-links");
  return { success: true };
}

export async function deleteLinkAction(id: string): Promise<ActionResult> {
  const denied = await requireAdmin();
  if (denied) return denied;

  await deleteLink(id);
  revalidatePath("/admin/purchase-links");
  return { success: true };
}
