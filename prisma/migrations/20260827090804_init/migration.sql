-- CreateEnum
CREATE TYPE "Role" AS ENUM ('ADMIN', 'SCHOLSTVO', 'SKOLA');

-- CreateEnum
CREATE TYPE "Completion" AS ENUM ('MATURITA', 'VYUCNY_LIST', 'MATURITA_A_VYUCNY_LIST', 'ZAVERECNA_SKUSKA');

-- CreateEnum
CREATE TYPE "PostType" AS ENUM ('SUPER', 'NEWS');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "name" TEXT,
    "role" "Role" NOT NULL DEFAULT 'SKOLA',
    "schoolId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "School" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "district" TEXT NOT NULL,
    "languages" TEXT[],
    "hasInternat" BOOLEAN NOT NULL DEFAULT false,
    "hasCanteen" BOOLEAN NOT NULL DEFAULT false,
    "hasDual" BOOLEAN NOT NULL DEFAULT false,
    "hasNadstavba" BOOLEAN NOT NULL DEFAULT false,
    "hasNativeSpeaker" BOOLEAN NOT NULL DEFAULT false,
    "accessibility" TEXT,
    "erasmus" TEXT,
    "website" TEXT,
    "email" TEXT,
    "phone" TEXT,
    "facebook" TEXT,
    "instagram" TEXT,
    "address" TEXT,
    "mapUrl" TEXT,
    "inekoKraj" TEXT,
    "inekoSlovensko" TEXT,
    "totalStudents" INTEGER,
    "photoUrl" TEXT,
    "logoUrl" TEXT,
    "intro" TEXT,
    "modernization" TEXT,
    "plans" TEXT,
    "support" TEXT,
    "achievements" TEXT,
    "partners" TEXT,
    "graduates" TEXT,
    "other" TEXT,
    "whyUs" TEXT[],
    "clubs" TEXT[],
    "sports" TEXT[],
    "canteenOptions" TEXT[],
    "supportTeam" TEXT[],
    "certificates" TEXT[],
    "isComplete" BOOLEAN NOT NULL DEFAULT false,
    "isPublished" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "School_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Odbor" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "length" INTEGER NOT NULL,
    "completion" "Completion" NOT NULL,
    "accepts" INTEGER,
    "appliedLastYear" INTEGER,
    "places" INTEGER,
    "employment" TEXT,
    "sort" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "Odbor_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Tag" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "label" TEXT NOT NULL,

    CONSTRAINT "Tag_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Priestor" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "isDefault" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "Priestor_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Project" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "sort" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "Project_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Dod" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "time" TEXT,
    "note" TEXT,

    CONSTRAINT "Dod_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Download" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "fileUrl" TEXT NOT NULL,
    "fileName" TEXT,
    "fileSize" INTEGER,
    "sort" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "Download_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Badge" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "kind" TEXT NOT NULL DEFAULT 'ok',
    "note" TEXT,
    "createdBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Badge_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Veltrh" (
    "id" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "time" TEXT NOT NULL,
    "place" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "description" TEXT,
    "extra" TEXT,

    CONSTRAINT "Veltrh_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Post" (
    "id" TEXT NOT NULL,
    "type" "PostType" NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "coverUrl" TEXT,
    "schoolId" TEXT,
    "authorId" TEXT,
    "published" BOOLEAN NOT NULL DEFAULT false,
    "publishedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Post_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Setting" (
    "key" TEXT NOT NULL,
    "value" JSONB NOT NULL,

    CONSTRAINT "Setting_pkey" PRIMARY KEY ("key")
);

-- CreateTable
CREATE TABLE "_SchoolToTag" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_SchoolToTag_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateTable
CREATE TABLE "_SchoolToVeltrh" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_SchoolToVeltrh_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateTable
CREATE TABLE "_PriestorToSchool" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_PriestorToSchool_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "School_slug_key" ON "School"("slug");

-- CreateIndex
CREATE INDEX "Odbor_schoolId_idx" ON "Odbor"("schoolId");

-- CreateIndex
CREATE UNIQUE INDEX "Tag_code_key" ON "Tag"("code");

-- CreateIndex
CREATE UNIQUE INDEX "Priestor_name_key" ON "Priestor"("name");

-- CreateIndex
CREATE INDEX "Project_schoolId_idx" ON "Project"("schoolId");

-- CreateIndex
CREATE INDEX "Dod_schoolId_idx" ON "Dod"("schoolId");

-- CreateIndex
CREATE INDEX "Download_schoolId_idx" ON "Download"("schoolId");

-- CreateIndex
CREATE INDEX "Badge_schoolId_idx" ON "Badge"("schoolId");

-- CreateIndex
CREATE INDEX "Veltrh_date_idx" ON "Veltrh"("date");

-- CreateIndex
CREATE INDEX "Post_type_published_idx" ON "Post"("type", "published");

-- CreateIndex
CREATE INDEX "_SchoolToTag_B_index" ON "_SchoolToTag"("B");

-- CreateIndex
CREATE INDEX "_SchoolToVeltrh_B_index" ON "_SchoolToVeltrh"("B");

-- CreateIndex
CREATE INDEX "_PriestorToSchool_B_index" ON "_PriestorToSchool"("B");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Odbor" ADD CONSTRAINT "Odbor_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Project" ADD CONSTRAINT "Project_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Dod" ADD CONSTRAINT "Dod_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Download" ADD CONSTRAINT "Download_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Badge" ADD CONSTRAINT "Badge_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Post" ADD CONSTRAINT "Post_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Post" ADD CONSTRAINT "Post_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_SchoolToTag" ADD CONSTRAINT "_SchoolToTag_A_fkey" FOREIGN KEY ("A") REFERENCES "School"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_SchoolToTag" ADD CONSTRAINT "_SchoolToTag_B_fkey" FOREIGN KEY ("B") REFERENCES "Tag"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_SchoolToVeltrh" ADD CONSTRAINT "_SchoolToVeltrh_A_fkey" FOREIGN KEY ("A") REFERENCES "School"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_SchoolToVeltrh" ADD CONSTRAINT "_SchoolToVeltrh_B_fkey" FOREIGN KEY ("B") REFERENCES "Veltrh"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_PriestorToSchool" ADD CONSTRAINT "_PriestorToSchool_A_fkey" FOREIGN KEY ("A") REFERENCES "Priestor"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_PriestorToSchool" ADD CONSTRAINT "_PriestorToSchool_B_fkey" FOREIGN KEY ("B") REFERENCES "School"("id") ON DELETE CASCADE ON UPDATE CASCADE;
