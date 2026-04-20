"use client";

import { useSession, signIn, signOut } from "next-auth/react";

export const AuthButton = () => {
  const { data: session, status } = useSession();

  if (status === "loading") {
    return (
      <div className="h-8 w-16 animate-pulse rounded bg-gray-200" />
    );
  }

  if (session?.user) {
    return (
      <div className="flex items-center gap-2">
        <span className="text-sm text-gray-700">{session.user.name}</span>
        <button
          onClick={() => signOut()}
          className="rounded-md bg-gray-100 px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-200"
        >
          로그아웃
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={() => signIn()}
      className="rounded-md bg-gray-900 px-3 py-1.5 text-sm text-white hover:bg-gray-800"
    >
      로그인
    </button>
  );
};
