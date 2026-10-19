"use client";

import Image from "next/image";
import { useState } from "react";
import type { ImageImportResult, ImageSearchResult } from "@/types/api";

interface Props {
  open: boolean;
  /** Cloudinary 복사 시 어느 폴더에 저장할지 */
  folder: "styles" | "products" | "platforms" | "categories";
  onClose: () => void;
  /** 이미지 import 성공 시 호출됨 — 폼에 결과를 채울 때 사용 */
  onImported: (result: ImageImportResult) => void;
}

export const ImageSearchModal = ({ open, folder, onClose, onImported }: Props) => {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<ImageSearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [importingId, setImportingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (!open) return null;

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    setSearching(true);
    setError(null);
    setResults([]);

    try {
      const params = new URLSearchParams({
        q: query.trim(),
        source: "unsplash",
        page: "1",
        perPage: "20",
      });
      const res = await fetch(`/api/admin/images/search?${params}`);
      const json = await res.json();
      if (!res.ok) {
        setError(json.message ?? "검색에 실패했습니다");
        return;
      }
      setResults(json.data as ImageSearchResult[]);
    } catch {
      setError("검색 중 오류가 발생했습니다");
    } finally {
      setSearching(false);
    }
  };

  const handleSelect = async (photo: ImageSearchResult) => {
    setImportingId(photo.id);
    setError(null);

    try {
      const res = await fetch("/api/admin/images/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          imageUrl: photo.regularUrl,
          sourceUrl: photo.sourceUrl,
          photographer: photo.photographer,
          sourceName: photo.sourceName,
          licenseType: photo.sourceName.toLowerCase(),
          downloadTracker: photo.downloadTracker,
          folder,
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.message ?? "이미지 가져오기에 실패했습니다");
        return;
      }
      onImported(json.data as ImageImportResult);
      handleClose();
    } catch {
      setError("이미지 가져오기 중 오류가 발생했습니다");
    } finally {
      setImportingId(null);
    }
  };

  const handleClose = () => {
    setQuery("");
    setResults([]);
    setError(null);
    setImportingId(null);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={handleClose}
    >
      <div
        className="flex max-h-[90vh] w-full max-w-3xl flex-col overflow-hidden rounded-lg bg-white shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-gray-200 px-5 py-3">
          <h2 className="text-base font-semibold text-gray-900">이미지 검색 (Unsplash)</h2>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600"
            aria-label="닫기"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSearch} className="flex gap-2 border-b border-gray-100 px-5 py-3">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="예: winter coat woman, street fashion"
            className="flex-1 rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-gray-500 focus:outline-none"
            autoFocus
          />
          <button
            type="submit"
            disabled={searching || !query.trim()}
            className="rounded-md bg-gray-900 px-4 py-2 text-sm text-white hover:bg-gray-800 disabled:opacity-50"
          >
            {searching ? "검색 중..." : "검색"}
          </button>
        </form>

        {error && (
          <div className="mx-5 mt-3 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </div>
        )}

        <div className="flex-1 overflow-y-auto p-5">
          {results.length === 0 && !searching ? (
            <div className="flex h-40 items-center justify-center text-sm text-gray-400">
              검색어를 입력하면 결과가 여기에 표시됩니다
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
              {results.map((photo) => (
                <button
                  key={photo.id}
                  type="button"
                  disabled={importingId !== null}
                  onClick={() => handleSelect(photo)}
                  className="group relative aspect-square overflow-hidden rounded-md border border-gray-200 bg-gray-100 disabled:opacity-50"
                >
                  <Image
                    src={photo.thumbUrl}
                    alt={photo.description ?? "Unsplash photo"}
                    fill
                    sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, 25vw"
                    className="object-cover transition group-hover:scale-105"
                    unoptimized
                  />
                  <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent px-2 py-1.5 text-left">
                    <p className="truncate text-[10px] text-white/90">
                      {photo.photographer}
                    </p>
                  </div>
                  {importingId === photo.id && (
                    <div className="absolute inset-0 flex items-center justify-center bg-white/70 text-xs text-gray-700">
                      가져오는 중...
                    </div>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="border-t border-gray-100 px-5 py-2 text-center text-[11px] text-gray-400">
          이미지는 Unsplash 라이선스에 따라 사용됩니다. 작가 표기가 함께 저장됩니다.
        </div>
      </div>
    </div>
  );
};
