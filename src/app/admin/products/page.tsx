import { getAdminProducts, getAdminStyles } from "@/lib/data/admin";
import { ProductManager } from "./ProductManager.client";

export default async function AdminProductsPage() {
  const [products, styles] = await Promise.all([
    getAdminProducts(),
    getAdminStyles(),
  ]);

  const styleOptions = styles.map((s) => ({ id: s.id, celebName: s.celebName }));
  return <ProductManager initialData={products} styles={styleOptions} />;
}
