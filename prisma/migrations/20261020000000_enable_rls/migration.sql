-- Supabase PostgREST(anon/authenticated 역할)로의 직접 접근을 차단한다.
-- 정책은 추가하지 않는다: 앱은 Prisma로 테이블 소유자(postgres) 계정을 사용해 RLS를 우회하므로 영향이 없다.
ALTER TABLE "_prisma_migrations" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "categories" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "celeb_styles" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "similar_products" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "purchase_links" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "users" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "accounts" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "sessions" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "verification_tokens" ENABLE ROW LEVEL SECURITY;
