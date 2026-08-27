-- AlterTable
ALTER TABLE "School" ADD COLUMN     "dualCompanies" TEXT[],
ADD COLUMN     "foreignLanguages" TEXT[],
ADD COLUMN     "internatInfo" TEXT,
ADD COLUMN     "otherTop" TEXT,
ADD COLUMN     "practice" TEXT,
ALTER COLUMN "totalStudents" SET DATA TYPE TEXT;
