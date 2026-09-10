-- CreateTable
CREATE TABLE "SchoolPhoto" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "alt" TEXT,
    "sort" INTEGER NOT NULL DEFAULT 0,
    "isDetailCover" BOOLEAN NOT NULL DEFAULT false,
    "isListCover" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SchoolPhoto_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_SimilarSchools" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_SimilarSchools_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE INDEX "SchoolPhoto_schoolId_sort_idx" ON "SchoolPhoto"("schoolId", "sort");

-- CreateIndex
CREATE INDEX "_SimilarSchools_B_index" ON "_SimilarSchools"("B");

-- AddForeignKey
ALTER TABLE "SchoolPhoto" ADD CONSTRAINT "SchoolPhoto_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_SimilarSchools" ADD CONSTRAINT "_SimilarSchools_A_fkey" FOREIGN KEY ("A") REFERENCES "School"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_SimilarSchools" ADD CONSTRAINT "_SimilarSchools_B_fkey" FOREIGN KEY ("B") REFERENCES "School"("id") ON DELETE CASCADE ON UPDATE CASCADE;