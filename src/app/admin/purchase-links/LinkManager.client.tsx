"use client";

import { useState, useTransition } from "react";
import {
  createLinkAction,
  updateLinkAction,
  deleteLinkAction,
} from "../actions";

interface LinkRow {
  id: string;
  productId: string;
  platformName: string;
  platformLogoUrl: string | null;
  price: number;
  currency: string;
  productUrl: string;
  inStock: boolean;
  lastCheckedAt: Date;
  product: { productName: string; brandName: string };
}

interface Props {
  initialData: LinkRow[];
  products: { id: string; productName: string; brandName: string }[];
}

export const LinkManager = ({ initialData, products }: Props) => {
  const [editId, setEditId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleCreate = (formData: FormData) => {
    startTransition(async () => {
      const result = await createLinkAction(formData);
      if (!result.success) setError(result.error ?? "생성 실패");
      else { setShowForm(false); setError(null); }
    });
  };

  const handleUpdate = (id: string, formData: FormData) => {
    startTransition(async () => {
      const result = await updateLinkAction(id, formData);
      if (!result.success) setError(result.error ?? "수정 실패");
      else { setEditId(null); setError(null); }
    });
  };

  const handleDelete = (id: string, name: string) => {
    if (!confirm(`"${name}" 구매처를 삭제하시겠습니까?`)) return;
    startTransition(async () => {
      const result = await deleteLinkAction(id);
      if (!result.success) setError(result.error ?? "삭제 실패");
      else setError(null);
    });
  };

  const formatPrice = (price: number) =>
    price.toLocaleString("ko-KR") + "원";

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-900">구매처 관리</h1>
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
          <h2 className="mb-3 text-sm font-semibold text-gray-700">새 구매처</h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            <select name="productId" required className="rounded-md border border-gray-300 px-3 py-2 text-sm">
              <option value="">상품 선택</option>
              {products.map((p) => (
                <option key={p.id} value={p.id}>{p.brandName} — {p.productName}</option>
              ))}
            </select>
            <input name="platformName" placeholder="플랫폼명 (예: musinsa)" required className="rounded-md border border-gray-300 px-3 py-2 text-sm" />
            <input name="price" type="number" placeholder="가격 (원)" required className="rounded-md border border-gray-300 px-3 py-2 text-sm" />
            <input name="productUrl" placeholder="상품 URL" required className="rounded-md border border-gray-300 px-3 py-2 text-sm" />
            <input name="platformLogoUrl" placeholder="로고 URL (선택)" className="rounded-md border border-gray-300 px-3 py-2 text-sm" />
            <select name="inStock" className="rounded-md border border-gray-300 px-3 py-2 text-sm">
              <option value="true">재고 있음</option>
              <option value="false">품절</option>
            </select>
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
              <th className="pb-2 font-medium">플랫폼</th>
              <th className="pb-2 font-medium">상품</th>
              <th className="pb-2 font-medium">가격</th>
              <th className="pb-2 font-medium">재고</th>
              <th className="pb-2 font-medium">URL</th>
              <th className="pb-2 font-medium">작업</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {initialData.map((link) =>
              editId === link.id ? (
                <tr key={link.id} className="bg-yellow-50">
                  <td colSpan={6} className="p-3">
                    <form action={(fd) => handleUpdate(link.id, fd)} className="flex flex-wrap items-center gap-3">
                      <input name="platformName" defaultValue={link.platformName} required className="rounded-md border border-gray-300 px-3 py-1.5 text-sm" />
                      <input name="price" type="number" defaultValue={link.price} className="w-32 rounded-md border border-gray-300 px-3 py-1.5 text-sm" />
                      <input name="productUrl" defaultValue={link.productUrl} className="rounded-md border border-gray-300 px-3 py-1.5 text-sm" />
                      <input name="platformLogoUrl" defaultValue={link.platformLogoUrl ?? ""} placeholder="로고 URL" className="rounded-md border border-gray-300 px-3 py-1.5 text-sm" />
                      <select name="inStock" defaultValue={String(link.inStock)} className="rounded-md border border-gray-300 px-3 py-1.5 text-sm">
                        <option value="true">재고 있음</option>
                        <option value="false">품절</option>
                      </select>
                      <button type="submit" disabled={isPending} className="rounded-md bg-blue-600 px-3 py-1.5 text-sm text-white disabled:opacity-50">저장</button>
                      <button type="button" onClick={() => setEditId(null)} className="text-sm text-gray-500">취소</button>
                    </form>
                  </td>
                </tr>
              ) : (
                <tr key={link.id} className="hover:bg-gray-50">
                  <td className="py-3 font-medium text-gray-900">{link.platformName}</td>
                  <td className="py-3 text-gray-500">{link.product.brandName} — {link.product.productName}</td>
                  <td className="py-3 text-gray-500">{formatPrice(link.price)}</td>
                  <td className="py-3">
                    <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${link.inStock ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                      {link.inStock ? "재고" : "품절"}
                    </span>
                  </td>
                  <td className="max-w-[200px] truncate py-3 text-gray-400">{link.productUrl}</td>
                  <td className="py-3">
                    <button onClick={() => { setEditId(link.id); setShowForm(false); }} className="mr-2 text-blue-600 hover:text-blue-800">수정</button>
                    <button onClick={() => handleDelete(link.id, link.platformName)} disabled={isPending} className="text-red-600 hover:text-red-800 disabled:opacity-50">삭제</button>
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
