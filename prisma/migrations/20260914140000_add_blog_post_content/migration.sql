-- Rozšírenie administratívneho blogu „Dobré správy zo školstva“.
ALTER TABLE "Post"
  ADD COLUMN "slug" TEXT,
  ADD COLUMN "excerpt" TEXT,
  ADD COLUMN "galleryCaption" TEXT;

CREATE UNIQUE INDEX "Post_slug_key" ON "Post"("slug");

CREATE TABLE "PostImage" (
  "id" TEXT NOT NULL,
  "postId" TEXT NOT NULL,
  "url" TEXT NOT NULL,
  "alt" TEXT,
  "sort" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "PostImage_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "PostImage_postId_sort_idx" ON "PostImage"("postId", "sort");

ALTER TABLE "PostImage"
  ADD CONSTRAINT "PostImage_postId_fkey"
  FOREIGN KEY ("postId") REFERENCES "Post"("id") ON DELETE CASCADE ON UPDATE CASCADE;
