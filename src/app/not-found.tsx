import Link from "next/link";

export default function GlobalNotFound() {
  return (
    <div className="flex flex-col items-center gap-4 py-20">
      <span className="text-4xl">🔍</span>
      <p className="text-sm text-gray-600">페이지를 찾을 수 없어요</p>
      <Link
        href="/"
        className="rounded-full bg-black px-6 py-2 text-sm font-medium text-white hover:bg-gray-800"
      >
        홈으로 돌아가기
      </Link>
    </div>
  );
}
