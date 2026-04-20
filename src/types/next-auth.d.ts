// src/types/next-auth.d.ts
// NextAuth.js v5 타입 확장 — 세션에 role 필드 추가

import "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
    };
  }

  interface User {
    role: string;
  }
}
