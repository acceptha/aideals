"use client";

import { useState, useTransition } from "react";
import {
  createCategoryAction,
  updateCategoryAction,
  deleteCategoryAction,
} from "../actions";

interface CategoryRow {
  id: string;
  name: string;
  iconUrl: string | null;
  sortOrder: number;
  _count: { styles: number };
}

interface Props {
  initialData: CategoryRow[];
}

export const CategoryManager = ({ initialData }: Props) => {
  const [editId, setEditId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleCreate = (formData: FormData) => {
    startTransition(async () => {
      const result = await createCategoryAction(formData);
      if (!result.success) {
        setError(result.error ?? "생성 실패");
      } else {
        setShowForm(false);
        setError(null);
      }
    });
  };

  const handleUpdate = (id: string, formData: FormData) => {
    startTransition(async () => {
      const result = await updateCategoryAction(id, formData);
      if (!result.success) {
        setError(result.error ?? "수정 실패");
      } else {
        setEditId(null);
        setError(null);
      }
    });
  };

  const handleDelete = (id: string, name: string) => {
    if (!confirm(`"${name}" 카테고리를 삭제하시겠습니까?`)) return;
    startTransition(async () => {
      const result = await deleteCategoryAction(id);
      if (!result.success) setError(result.error ?? "삭제 실패");
      else setError(null);
    });
  };

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-900">카테고리 관리</h1>
        <button
          onClick={() => { setShowForm(!showForm); setEditId(null); }}
          className="rounded-md bg-gray-900 px-4 py-2 text-sm text-white hover:bg-gray-800"
        >
          {showForm ? "취소" : "추가"}
        </button>
      </div>

      {error && (
        <div className="mt-4 rounded-md bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {showForm && (
        <form action={handleCreate} className="mt-4 rounded-lg border border-gray-200 bg-white p-4">
          <h2 className="mb-3 text-sm font-semibold text-gray-700">새 카테고리</h2>
          <div className="grid grid-cols-3 gap-3">
            <input name="name" placeholder="카테고리명" required className="rounded-md border border-gray-300 px-3 py-2 text-sm" />
            <input name="iconUrl" placeholder="아이콘 URL (선택)" className="rounded-md border border-gray-300 px-3 py-2 text-sm" />
            <input name="sortOrder" type="number" placeholder="정렬순서" defaultValue="0" className="rounded-md border border-gray-300 px-3 py-2 text-sm" />
          </div>
          <button type="submit" disabled={isPending} className="mt-3 rounded-md bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700 disabled:opacity-50">
            {isPending ? "저장 중..." : "저장"}
          </button>
        </form>
      )}

      <table className="mt-6 w-full text-sm">
        <thead>
          <tr className="border-b border-gray-200 text-left text-gray-500">
            <th className="pb-2 font-medium">이름</th>
            <th className="pb-2 font-medium">아이콘</th>
            <th className="pb-2 font-medium">정렬</th>
            <th className="pb-2 font-medium">스타일 수</th>
            <th className="pb-2 font-medium">작업</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {initialData.map((cat) =>
            editId === cat.id ? (
              <tr key={cat.id} className="bg-yellow-50">
                <td colSpan={5} className="p-3">
                  <form
                    action={(fd) => handleUpdate(cat.id, fd)}
                    className="flex items-center gap-3"
                  >
                    <input name="name" defaultValue={cat.name} required className="rounded-md border border-gray-300 px-3 py-1.5 text-sm" />
                    <input name="iconUrl" defaultValue={cat.iconUrl ?? ""} placeholder="아이콘 URL" className="rounded-md border border-gray-300 px-3 py-1.5 text-sm" />
                    <input name="sortOrder" type="number" defaultValue={cat.sortOrder} className="w-20 rounded-md border border-gray-300 px-3 py-1.5 text-sm" />
                    <button type="submit" disabled={isPending} className="rounded-md bg-blue-600 px-3 py-1.5 text-sm text-white hover:bg-blue-700 disabled:opacity-50">
                      저장
                    </button>
                    <button type="button" onClick={() => setEditId(null)} className="text-sm text-gray-500 hover:text-gray-700">
                      취소
                    </button>
                  </form>
                </td>
              </tr>
            ) : (
              <tr key={cat.id} className="hover:bg-gray-50">
                <td className="py-3 font-medium text-gray-900">{cat.name}</td>
                <td className="py-3 text-gray-500">{cat.iconUrl ? "O" : "-"}</td>
                <td className="py-3 text-gray-500">{cat.sortOrder}</td>
                <td className="py-3 text-gray-500">{cat._count.styles}</td>
                <td className="py-3">
                  <button onClick={() => { setEditId(cat.id); setShowForm(false); }} className="mr-2 text-blue-600 hover:text-blue-800">
                    수정
                  </button>
                  <button onClick={() => handleDelete(cat.id, cat.name)} disabled={isPending} className="text-red-600 hover:text-red-800 disabled:opacity-50">
                    삭제
                  </button>
                </td>
              </tr>
            ),
          )}
        </tbody>
      </table>
    </div>
  );
};
