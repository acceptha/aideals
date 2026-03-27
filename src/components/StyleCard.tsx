// src/components/StyleCard.tsx — Server Component

import Image from "next/image";
import Link from "next/link";
import { Badge } from "@/components/ui/Badge";
import type { CelebStyle } from "@/types";

const GENDER_LABEL: Record<string, string> = {
  male: "남성",
  female: "여성",
  unisex: "공용",
};

const SEASON_LABEL: Record<string, string> = {
  spring: "봄",
  summer: "여름",
  fall: "가을",
  winter: "겨울",
  all: "사계절",
};

interface StyleCardProps {
  style: CelebStyle;
}

export const StyleCard = ({ style }: StyleCardProps) => {
  return (
    <Link href={`/styles/${style.id}`} className="group flex flex-col gap-2">
      <div className="relative aspect-[4/5] w-full overflow-hidden rounded-xl bg-gray-100">
        <Image
          src={style.imageUrl}
          alt={`${style.celebName} 스타일`}
          fill
          className="object-cover transition-transform duration-300 group-hover:scale-105"
          sizes="(max-width: 768px) 50vw, 25vw"
        />
      </div>
      <div className="flex flex-col gap-1 px-1">
        <p className="text-sm font-semibold text-gray-900">{style.celebName}</p>
        <div className="flex flex-wrap gap-1">
          <Badge label={GENDER_LABEL[style.gender] ?? style.gender} variant="gender" />
          <Badge label={SEASON_LABEL[style.season] ?? style.season} variant="season" />
          {style.colors.slice(0, 2).map((color) => (
            <Badge key={color} label={color} variant="tag" />
          ))}
        </div>
      </div>
    </Link>
  );
};
