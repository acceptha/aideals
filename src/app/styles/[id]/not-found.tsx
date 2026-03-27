import Link from "next/link";

export default function StyleNotFound() {
  return (
    <div className="flex flex-col items-center gap-4 py-20">
      <span className="text-4xl">👗</span>
      <p className="text-sm text-gray-600">해당 스타일을 찾을 수 없어요</p>
      <Link
        href="/styles"
        className="rounded-full bg-black px-6 py-2 text-sm font-medium text-white hover:bg-gray-800"
      >
        스타일 목록으로
      </Link>
    </div>
  );
}
