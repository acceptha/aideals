// scripts/set-admin.ts
// 소셜 로그인으로 가입한 사용자에게 관리자 권한을 부여(또는 회수)한다.
// 사용자는 먼저 /login 에서 한 번 로그인해 users 테이블에 행이 있어야 한다.
//
// 실행:
//   npm run set-admin -- <email|userId>            # 관리자 권한 부여
//   npm run set-admin -- <email|userId> --revoke   # 일반 사용자로 되돌림
//   npm run set-admin -- --list                    # 관리자 목록 + 최근 가입자 조회
//
// 카카오는 이메일 동의 항목이 없으면 email이 비어 있으므로 --list 로 id를 확인해 지정한다.
// 환경변수 필요: DATABASE_URL

import "dotenv/config";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const listUsers = async () => {
  const admins = await prisma.user.findMany({
    where: { role: "admin" },
    select: { id: true, email: true, name: true },
  });
  const recent = await prisma.user.findMany({
    orderBy: { createdAt: "desc" },
    take: 10,
    select: { id: true, email: true, name: true, role: true },
  });

  console.log("\n관리자:");
  if (admins.length === 0) console.log("  (없음)");
  admins.forEach((u) => console.log(`  - ${u.id}  ${u.email ?? "(이메일 없음)"} ${u.name ?? ""}`));

  console.log("\n최근 가입자 10명:");
  if (recent.length === 0) console.log("  (없음)");
  recent.forEach((u) => console.log(`  - [${u.role}] ${u.id}  ${u.email ?? "(이메일 없음)"} ${u.name ?? ""}`));
};

const setRole = async (target: string, role: "admin" | "user") => {
  const user = await prisma.user.findFirst({
    where: { OR: [{ email: target }, { id: target }] },
    select: { id: true, role: true },
  });

  if (!user) {
    console.error(`❌ ${target} 사용자가 없습니다. 먼저 /login 에서 한 번 로그인하세요.`);
    console.error("   가입자 목록: npm run set-admin -- --list");
    process.exitCode = 1;
    return;
  }

  if (user.role === role) {
    console.log(`ℹ️  ${target} 은(는) 이미 '${role}' 입니다.`);
    return;
  }

  await prisma.user.update({ where: { id: user.id }, data: { role } });
  // role은 세션 콜백에서 매 요청마다 DB로 읽으므로 재로그인 없이 바로 반영된다
  console.log(`✅ ${target}: '${user.role}' → '${role}'`);
};

const main = async () => {
  const args = process.argv.slice(2);

  if (args.includes("--list")) {
    await listUsers();
    return;
  }

  const target = args.find((a) => !a.startsWith("--"));
  if (!target) {
    console.error("사용법: npm run set-admin -- <email|userId> [--revoke] | --list");
    process.exitCode = 1;
    return;
  }

  await setRole(target, args.includes("--revoke") ? "user" : "admin");
};

main()
  .catch((err) => {
    console.error("❌ 실패:", err instanceof Error ? err.message : err);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
