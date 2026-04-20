import { auth, signIn } from "@/lib/auth";
import { redirect } from "next/navigation";

export const metadata = {
  title: "로그인 — aideals",
};

export default async function LoginPage() {
  const session = await auth();
  if (session) redirect("/");

  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <div className="w-full max-w-sm space-y-6 rounded-xl border border-gray-200 bg-white p-8 shadow-sm">
        <div className="text-center">
          <h1 className="text-xl font-bold text-gray-900">로그인</h1>
          <p className="mt-2 text-sm text-gray-500">
            소셜 계정으로 간편하게 시작하세요
          </p>
        </div>

        <div className="space-y-3">
          <form
            action={async () => {
              "use server";
              await signIn("kakao", { redirectTo: "/" });
            }}
          >
            <button
              type="submit"
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-[#FEE500] px-4 py-3 text-sm font-medium text-[#191919] hover:bg-[#FDD800]"
            >
              카카오로 시작하기
            </button>
          </form>

          <form
            action={async () => {
              "use server";
              await signIn("google", { redirectTo: "/" });
            }}
          >
            <button
              type="submit"
              className="flex w-full items-center justify-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Google로 시작하기
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
