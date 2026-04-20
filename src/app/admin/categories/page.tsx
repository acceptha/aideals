import { getAdminCategories } from "@/lib/data/admin";
import { CategoryManager } from "./CategoryManager.client";

export default async function AdminCategoriesPage() {
  const categories = await getAdminCategories();
  return <CategoryManager initialData={categories} />;
}
