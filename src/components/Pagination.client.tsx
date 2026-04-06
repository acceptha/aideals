"use client";

import { useRouter, useSearchParams } from "next/navigation";

interface PaginationProps {
  currentPage: number;
  totalPages: number;
}

export const Pagination = ({ currentPage, totalPages }: PaginationProps) => {
  const router = useRouter();
  const searchParams = useSearchParams();

  if (totalPages <= 1) return null;

  const goToPage = (page: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", String(page));
    router.push(`?${params.toString()}`);
  };

  // 표시할 페이지 번호 계산 (최대 5개)
  const maxVisible = 5;
  let start = Math.max(1, currentPage - Math.floor(maxVisible / 2));
  const end = Math.min(totalPages, start + maxVisible - 1);
  if (end - start + 1 < maxVisible) {
    start = Math.max(1, end - maxVisible + 1);
  }

  const pages: number[] = [];
  for (let i = start; i <= end; i++) {
    pages.push(i);
  }

  const btnBase = "flex h-9 w-9 items-center justify-center rounded-lg text-sm font-medium transition-colors";
  const btnActive = "bg-black text-white";
  const btnInactive = "text-gray-600 hover:bg-gray-100";
  const btnDisabled = "text-gray-300 cursor-not-allowed";

  return (
    <nav className="flex items-center justify-center gap-1">
      <button
        onClick={() => goToPage(currentPage - 1)}
        disabled={currentPage <= 1}
        className={`${btnBase} ${currentPage <= 1 ? btnDisabled : btnInactive}`}
      >
        &lt;
      </button>

      {pages.map((page) => (
        <button
          key={page}
          onClick={() => goToPage(page)}
          className={`${btnBase} ${page === currentPage ? btnActive : btnInactive}`}
        >
          {page}
        </button>
      ))}

      <button
        onClick={() => goToPage(currentPage + 1)}
        disabled={currentPage >= totalPages}
        className={`${btnBase} ${currentPage >= totalPages ? btnDisabled : btnInactive}`}
      >
        &gt;
      </button>
    </nav>
  );
};
