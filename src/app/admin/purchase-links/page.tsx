import { getAdminLinks, getAdminProducts } from "@/lib/data/admin";
import { LinkManager } from "./LinkManager.client";

export default async function AdminPurchaseLinksPage() {
  const [links, products] = await Promise.all([
    getAdminLinks(),
    getAdminProducts(),
  ]);

  const productOptions = products.map((p) => ({
    id: p.id,
    productName: p.productName,
    brandName: p.brandName,
  }));
  return <LinkManager initialData={links} products={productOptions} />;
}
