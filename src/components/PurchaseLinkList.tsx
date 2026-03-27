// src/components/PurchaseLinkList.tsx — Server Component

import type { PurchaseLink } from "@/types";

interface PurchaseLinkListProps {
  links: PurchaseLink[];
}

function formatPrice(price: number): string {
  return price.toLocaleString("ko-KR") + "원";
}

export const PurchaseLinkList = ({ links }: PurchaseLinkListProps) => {
  if (links.length === 0) {
    return (
      <div className="flex flex-col items-center gap-2 py-10 text-gray-400">
        <span className="text-3xl">🏪</span>
        <p className="text-sm">등록된 구매처가 없어요</p>
      </div>
    );
  }

  const lowestPrice = Math.min(...links.map((l) => l.price));

  return (
    <ul className="flex flex-col gap-2">
      {links.map((link) => {
        const isLowest = link.price === lowestPrice;

        return (
          <li key={link.id}>
            <a
              href={link.productUrl}
              target="_blank"
              rel="noopener noreferrer"
              className={`flex items-center justify-between rounded-xl border p-4 transition-colors hover:bg-gray-50 ${
                isLowest ? "border-purple-300 bg-purple-50" : "border-gray-200 bg-white"
              }`}
            >
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-gray-100 text-lg">
                  🏪
                </span>
                <div className="flex flex-col">
                  <span className="text-sm font-semibold text-gray-900">
                    {link.platformName}
                  </span>
                  {!link.inStock && (
                    <span className="text-xs text-red-500">품절</span>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2">
                {isLowest && (
                  <span className="rounded-full bg-purple-600 px-2 py-0.5 text-xs font-bold text-white">
                    최저가
                  </span>
                )}
                <span
                  className={`text-sm font-bold ${
                    link.inStock ? "text-gray-900" : "text-gray-400 line-through"
                  }`}
                >
                  {formatPrice(link.price)}
                </span>
                <span className="text-gray-400">›</span>
              </div>
            </a>
          </li>
        );
      })}
    </ul>
  );
};
