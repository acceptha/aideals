"use client";

import { useState, useTransition } from "react";
import {
  createStyleAction,
  updateStyleAction,
  deleteStyleAction,
} from "../actions";

interface StyleRow {
  id: string;
  celebName: string;
  imageUrl: string;
  categoryId: string;
  colors: string[];
  gender: string;
  season: string;
  createdAt: Date;
  category: { name: string };
  _count: { products: number };
}

interface Props {
  initialData: StyleRow[];
  categories: { id: string; name: string }[];
}

const GENDERS = ["male", "female"] as const;
const SEASONS = ["spring", "summer", "fall", "winter"] as const;

export const StyleManager = ({ initialData, categories }: Props) => {
  const [editId, setEditId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleCreate = (formData: FormData) => {
    startTransition(async () => {
      const result = await createStyleAction(formData);
      if (!result.success) setError(result.error ?? "생성 실패");
      else { setShowForm(false); setError(null); }
    });
  };

  const handleUpdate = (id: string, formData: FormData) => {
    startTransition(async () => {
      const result = await updateStyleAction(id, formData);
      if (!result.success) setError(result.error ?? "수정 실패");
      else { setEditId(null); setError(null); }
    });
  };

  const handleDelete = (id: string, name: string) => {
    if (!confirm(`"${name}" 스타일을 삭제하시겠습니까?`)) return;
    startTransition(async () => {
      const result = await deleteStyleAction(id);
      if (!result.success) setError(result.error ?? "삭제 실패");
      else setError(null);
    });
  };

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-900">스타일 관리</h1>
        <button
          onClick={() => { setShowForm(!showForm); setEditId(null); }}
          className="rounded-md bg-gray-900 px-4 py-2 text-sm text-white hover:bg-gray-800"
        >
          {showForm ? "취소" : "추가"}
        </button>
      </div>

      {error && (
        <div className="mt-4 rounded-md bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
      )}

      {showForm && (
        <form action={handleCreate} className="mt-4 rounded-lg border border-gray-200 bg-white p-4">
          <h2 className="mb-3 text-sm font-semibold text-gray-700">새 스타일</h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            <input name="celebName" placeholder="셀럽명" required className="rounded-md border border-gray-300 px-3 py-2 text-sm" />
            <input name="imageUrl" placeholder="이미지 URL" required className="rounded-md border border-gray-300 px-3 py-2 text-sm" />
            <select name="categoryId" required className="rounded-md border border-gray-300 px-3 py-2 text-sm">
              <option value="">카테고리 선택</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
            <select name="gender" required className="rounded-md border border-gray-300 px-3 py-2 text-sm">
              <option value="">성별</option>
              {GENDERS.map((g) => <option key={g} value={g}>{g === "male" ? "남성" : "여성"}</option>)}
            </select>
            <select name="season" required className="rounded-md border border-gray-300 px-3 py-2 text-sm">
              <option value="">시즌</option>
              {SEASONS.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
            <input name="colors" placeholder="색상 (쉼표 구분)" className="rounded-md border border-gray-300 px-3 py-2 text-sm" />
          </div>
          <button type="submit" disabled={isPending} className="mt-3 rounded-md bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700 disabled:opacity-50">
            {isPending ? "저장 중..." : "저장"}
          </button>
        </form>
      )}

      <div className="mt-6 overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200 text-left text-gray-500">
              <th className="pb-2 font-medium">셀럽</th>
              <th className="pb-2 font-medium">카테고리</th>
              <th className="pb-2 font-medium">성별</th>
              <th className="pb-2 font-medium">시즌</th>
              <th className="pb-2 font-medium">색상</th>
              <th className="pb-2 font-medium">상품 수</th>
              <th className="pb-2 font-medium">작업</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {initialData.map((style) =>
              editId === style.id ? (
                <tr key={style.id} className="bg-yellow-50">
                  <td colSpan={7} className="p-3">
                    <form action={(fd) => handleUpdate(style.id, fd)} className="flex flex-wrap items-center gap-3">
                      <input name="celebName" defaultValue={style.celebName} required className="rounded-md border border-gray-300 px-3 py-1.5 text-sm" />
                      <input name="imageUrl" defaultValue={style.imageUrl} className="rounded-md border border-gray-300 px-3 py-1.5 text-sm" />
                      <select name="categoryId" defaultValue={style.categoryId} className="rounded-md border border-gray-300 px-3 py-1.5 text-sm">
                        {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                      </select>
                      <select name="gender" defaultValue={style.gender} className="rounded-md border border-gray-300 px-3 py-1.5 text-sm">
                        {GENDERS.map((g) => <option key={g} value={g}>{g === "male" ? "남성" : "여성"}</option>)}
                      </select>
                      <select name="season" defaultValue={style.season} className="rounded-md border border-gray-300 px-3 py-1.5 text-sm">
                        {SEASONS.map((s) => <option key={s} value={s}>{s}</option>)}
                      </select>
                      <input name="colors" defaultValue={style.colors.join(", ")} className="rounded-md border border-gray-300 px-3 py-1.5 text-sm" />
                      <button type="submit" disabled={isPending} className="rounded-md bg-blue-600 px-3 py-1.5 text-sm text-white disabled:opacity-50">저장</button>
                      <button type="button" onClick={() => setEditId(null)} className="text-sm text-gray-500">취소</button>
                    </form>
                  </td>
                </tr>
              ) : (
                <tr key={style.id} className="hover:bg-gray-50">
                  <td className="py-3 font-medium text-gray-900">{style.celebName}</td>
                  <td className="py-3 text-gray-500">{style.category.name}</td>
                  <td className="py-3 text-gray-500">{style.gender === "male" ? "남성" : "여성"}</td>
                  <td className="py-3 text-gray-500">{style.season}</td>
                  <td className="py-3 text-gray-500">{style.colors.join(", ")}</td>
                  <td className="py-3 text-gray-500">{style._count.products}</td>
                  <td className="py-3">
                    <button onClick={() => { setEditId(style.id); setShowForm(false); }} className="mr-2 text-blue-600 hover:text-blue-800">수정</button>
                    <button onClick={() => handleDelete(style.id, style.celebName)} disabled={isPending} className="text-red-600 hover:text-red-800 disabled:opacity-50">삭제</button>
                  </td>
                </tr>
              ),
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
