// src/app/api/auth/[...nextauth]/route.ts
// NextAuth.js v5 catch-all API 핸들러

import { handlers } from "@/lib/auth";

export const { GET, POST } = handlers;
