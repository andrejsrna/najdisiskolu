-- Kontaktný box článku: názov + rich text obsah (namiesto surového HTML v stĺpci `box`).
ALTER TABLE "Post" ADD COLUMN "boxTitle" TEXT;
ALTER TABLE "Post" ADD COLUMN "boxBody" TEXT;