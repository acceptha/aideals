"use client";

import { useRouter } from "next/navigation";
import type { Category } from "@/types";

interface CategoryGridClientProps {
  categories: Category[];
}

const CATEGORY_ICONS: Record<string, string> = {
  "cat-outer": "🧥",
  "cat-top": "👕",
  "cat-bottom": "👖",
  "cat-dress": "👗",
  "cat-shoes": "👟",
  "cat-bag": "👜",
};

export const CategoryGridClient = ({ categories }: CategoryGridClientProps) => {
  const router = useRouter();

  const handleClick = (id: string) => {
    router.push(`/styles?categoryId=${id}`);
  };

  return (
    <div className="grid grid-cols-3 gap-3 md:grid-cols-6">
      {categories.map((cat) => (
        <button
          key={cat.id}
          onClick={() => handleClick(cat.id)}
          className="flex flex-col items-center gap-2 rounded-xl border-2 border-gray-200 bg-white p-4 text-gray-700 transition-all hover:border-black hover:bg-black hover:text-white"
        >
          <span className="text-2xl">{CATEGORY_ICONS[cat.id] ?? "🏷️"}</span>
          <span className="text-xs font-medium">{cat.name}</span>
        </button>
      ))}
    </div>
  );
};
