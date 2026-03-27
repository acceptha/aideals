/*
  Warnings:

  - You are about to drop the column `parent_id` on the `categories` table. All the data in the column will be lost.
  - You are about to drop the column `tags` on the `celeb_styles` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "categories" DROP CONSTRAINT "categories_parent_id_fkey";

-- AlterTable
ALTER TABLE "categories" DROP COLUMN "parent_id";

-- AlterTable
ALTER TABLE "celeb_styles" DROP COLUMN "tags",
ADD COLUMN     "colors" TEXT[];
