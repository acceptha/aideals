-- CreateTable
CREATE TABLE "categories" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "parent_id" TEXT,
    "icon_url" TEXT,
    "sort_order" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "celeb_styles" (
    "id" TEXT NOT NULL,
    "celeb_name" TEXT NOT NULL,
    "image_url" TEXT NOT NULL,
    "category_id" TEXT NOT NULL,
    "tags" TEXT[],
    "gender" TEXT NOT NULL,
    "season" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "celeb_styles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "similar_products" (
    "id" TEXT NOT NULL,
    "style_id" TEXT NOT NULL,
    "brand_name" TEXT NOT NULL,
    "product_name" TEXT NOT NULL,
    "product_image_url" TEXT NOT NULL,
    "representative_price" INTEGER NOT NULL,
    "similarity_score" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "similar_products_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "purchase_links" (
    "id" TEXT NOT NULL,
    "product_id" TEXT NOT NULL,
    "platform_name" TEXT NOT NULL,
    "platform_logo_url" TEXT,
    "price" INTEGER NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'KRW',
    "product_url" TEXT NOT NULL,
    "in_stock" BOOLEAN NOT NULL DEFAULT true,
    "last_checked_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "purchase_links_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "categories" ADD CONSTRAINT "categories_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "celeb_styles" ADD CONSTRAINT "celeb_styles_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "categories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "similar_products" ADD CONSTRAINT "similar_products_style_id_fkey" FOREIGN KEY ("style_id") REFERENCES "celeb_styles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "purchase_links" ADD CONSTRAINT "purchase_links_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "similar_products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
