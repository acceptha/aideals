import { getAdminStyles, getAdminCategories } from "@/lib/data/admin";
import { StyleManager } from "./StyleManager.client";

export default async function AdminStylesPage() {
  const [styles, categories] = await Promise.all([
    getAdminStyles(),
    getAdminCategories(),
  ]);

  const categoryOptions = categories.map((c) => ({ id: c.id, name: c.name }));
  return <StyleManager initialData={styles} categories={categoryOptions} />;
}
