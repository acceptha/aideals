"use client";

import { useState, useTransition } from "react";
import {
  createProductAction,
  updateProductAction,
  deleteProductAction,
} from "../actions";

interface ProductRow {
  id: string;
  styleId: string;
  brandName: string;
  productName: string;
  productImageUrl: string;
  representativePrice: number;
  similarityScore: number;
  createdAt: Date;
  style: { celebName: string };
  _count: { purchaseLinks: number };
}

interface Props {
  initialData: ProductRow[];
  styles: { id: string; celebName: string }[];
}

export const ProductManager = ({ initialData, styles }: Props) => {
  const [editId, setEditId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleCreate = (formData: FormData) => {
    startTransition(async () => {
      const result = await createProductAction(formData);
      if (!result.success) setError(result.error ?? "생성 실패");
      else { setShowForm(false); setError(null); }
    });
  };

  const handleUpdate = (id: string, formData: FormData) => {
    startTransition(async () => {
      const result = await updateProductAction(id, formData);
      if (!result.success) setError(result.error ?? "수정 실패");
      else { setEditId(null); setError(null); }
    });
  };

  const handleDelete = (id: string, name: string) => {
    if (!confirm(`"${name}" 상품을 삭제하시겠습니까?`)) return;
    startTransition(async () => {
      const result = await deleteProductAction(id);
      if (!result.success) setError(result.error ?? "삭제 실패");
      else setError(null);
    });
  };

  const formatPrice = (price: number) =>
    price.toLocaleString("ko-KR") + "원";

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-900">상품 관리</h1>
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
          <h2 className="mb-3 text-sm font-semibold text-gray-700">새 상품</h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            <select name="styleId" required className="rounded-md border border-gray-300 px-3 py-2 text-sm">
              <option value="">스타일 선택</option>
              {styles.map((s) => (
                <option key={s.id} value={s.id}>{s.celebName}</option>
              ))}
            </select>
            <input name="brandName" placeholder="브랜드명" required className="rounded-md border border-gray-300 px-3 py-2 text-sm" />
            <input name="productName" placeholder="상품명" required className="rounded-md border border-gray-300 px-3 py-2 text-sm" />
            <input name="productImageUrl" placeholder="이미지 URL" required className="rounded-md border border-gray-300 px-3 py-2 text-sm" />
            <input name="representativePrice" type="number" placeholder="대표가격 (원)" required className="rounded-md border border-gray-300 px-3 py-2 text-sm" />
            <input name="similarityScore" type="number" step="0.01" min="0" max="1" placeholder="유사도 (0~1)" defaultValue="0.8" className="rounded-md border border-gray-300 px-3 py-2 text-sm" />
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
              <th className="pb-2 font-medium">브랜드</th>
              <th className="pb-2 font-medium">상품명</th>
              <th className="pb-2 font-medium">가격</th>
              <th className="pb-2 font-medium">유사도</th>
              <th className="pb-2 font-medium">셀럽</th>
              <th className="pb-2 font-medium">구매처</th>
              <th className="pb-2 font-medium">작업</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {initialData.map((product) =>
              editId === product.id ? (
                <tr key={product.id} className="bg-yellow-50">
                  <td colSpan={7} className="p-3">
                    <form action={(fd) => handleUpdate(product.id, fd)} className="flex flex-wrap items-center gap-3">
                      <input name="brandName" defaultValue={product.brandName} required className="rounded-md border border-gray-300 px-3 py-1.5 text-sm" />
                      <input name="productName" defaultValue={product.productName} className="rounded-md border border-gray-300 px-3 py-1.5 text-sm" />
                      <input name="productImageUrl" defaultValue={product.productImageUrl} className="rounded-md border border-gray-300 px-3 py-1.5 text-sm" />
                      <input name="representativePrice" type="number" defaultValue={product.representativePrice} className="w-32 rounded-md border border-gray-300 px-3 py-1.5 text-sm" />
                      <input name="similarityScore" type="number" step="0.01" defaultValue={product.similarityScore} className="w-24 rounded-md border border-gray-300 px-3 py-1.5 text-sm" />
                      <button type="submit" disabled={isPending} className="rounded-md bg-blue-600 px-3 py-1.5 text-sm text-white disabled:opacity-50">저장</button>
                      <button type="button" onClick={() => setEditId(null)} className="text-sm text-gray-500">취소</button>
                    </form>
                  </td>
                </tr>
              ) : (
                <tr key={product.id} className="hover:bg-gray-50">
                  <td className="py-3 font-medium text-gray-900">{product.brandName}</td>
                  <td className="py-3 text-gray-700">{product.productName}</td>
                  <td className="py-3 text-gray-500">{formatPrice(product.representativePrice)}</td>
                  <td className="py-3 text-gray-500">{(product.similarityScore * 100).toFixed(0)}%</td>
                  <td className="py-3 text-gray-500">{product.style.celebName}</td>
                  <td className="py-3 text-gray-500">{product._count.purchaseLinks}</td>
                  <td className="py-3">
                    <button onClick={() => { setEditId(product.id); setShowForm(false); }} className="mr-2 text-blue-600 hover:text-blue-800">수정</button>
                    <button onClick={() => handleDelete(product.id, product.productName)} disabled={isPending} className="text-red-600 hover:text-red-800 disabled:opacity-50">삭제</button>
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
