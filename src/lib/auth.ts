// src/lib/auth.ts
// NextAuth.js v5 설정. Prisma Adapter + 카카오/구글 소셜 로그인.
// 환경변수가 없으면 해당 프로바이더가 비활성화된다.

import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import Kakao from "next-auth/providers/kakao";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "@/lib/prisma";
import { env } from "@/lib/env";

import type { Provider } from "next-auth/providers";

const providers: Provider[] = [];

/** 환경변수가 설정되어 활성화된 소셜 로그인 (로그인 페이지 버튼 노출 기준) */
export const enabledProviders = {
  kakao: Boolean(env.KAKAO_CLIENT_ID && env.KAKAO_CLIENT_SECRET),
  google: Boolean(env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET),
} as const;

if (enabledProviders.kakao) {
  providers.push(
    Kakao({
      clientId: env.KAKAO_CLIENT_ID,
      clientSecret: env.KAKAO_CLIENT_SECRET,
    }),
  );
}

if (enabledProviders.google) {
  providers.push(
    Google({
      clientId: env.GOOGLE_CLIENT_ID,
      clientSecret: env.GOOGLE_CLIENT_SECRET,
    }),
  );
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  providers,
  secret: env.NEXTAUTH_SECRET,
  // Vercel 외 환경(next start, 리버스 프록시)에서도 Host 헤더를 신뢰한다
  trustHost: true,
  session: { strategy: "database" },
  pages: {
    signIn: "/login",
  },
  callbacks: {
    session({ session, user }) {
      session.user.id = user.id;
      session.user.role = user.role;
      return session;
    },
  },
});
