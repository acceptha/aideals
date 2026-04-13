// src/lib/prisma.ts
// Prisma 클라이언트 싱글턴 (개발 환경 HMR 대응)
// Server Component 및 API Route에서만 import한다. Client Component에서 사용 금지.

import { PrismaClient } from "@prisma/client";
import { isProduction } from "./env";

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

export const prisma = globalForPrisma.prisma ?? new PrismaClient();

if (!isProduction) {
  globalForPrisma.prisma = prisma;
}
