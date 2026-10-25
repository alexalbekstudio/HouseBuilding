/*
  Warnings:

  - The values [PLANIRANO] on the enum `PhaseStatus` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the column `vendorId` on the `Expense` table. All the data in the column will be lost.
  - You are about to drop the column `budget` on the `Phase` table. All the data in the column will be lost.
  - You are about to drop the column `description` on the `Phase` table. All the data in the column will be lost.
  - You are about to drop the `Vendor` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `projectId` to the `Expense` table without a default value. This is not possible if the table is not empty.
  - Added the required column `projectId` to the `Phase` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "ExpenseCategory" AS ENUM ('MATERIJAL', 'RADNA_SNAGA', 'TAKSE_DOZVOLE', 'PREVOZ', 'OSTALO');

-- CreateEnum
CREATE TYPE "PaymentMethod" AS ENUM ('GOTOVINA', 'RACUN', 'KARTICA');

-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('PLACENO', 'CEKA_SE');

-- AlterEnum
BEGIN;
CREATE TYPE "PhaseStatus_new" AS ENUM ('NIJE_POCETO', 'U_TOKU', 'ZAVRSENO');
ALTER TABLE "Phase" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "Phase" ALTER COLUMN "status" TYPE "PhaseStatus_new" USING ("status"::text::"PhaseStatus_new");
ALTER TYPE "PhaseStatus" RENAME TO "PhaseStatus_old";
ALTER TYPE "PhaseStatus_new" RENAME TO "PhaseStatus";
DROP TYPE "PhaseStatus_old";
ALTER TABLE "Phase" ALTER COLUMN "status" SET DEFAULT 'NIJE_POCETO';
COMMIT;

-- DropForeignKey
ALTER TABLE "Expense" DROP CONSTRAINT "Expense_phaseId_fkey";

-- DropForeignKey
ALTER TABLE "Expense" DROP CONSTRAINT "Expense_vendorId_fkey";

-- AlterTable
ALTER TABLE "Expense" DROP COLUMN "vendorId",
ADD COLUMN     "category" "ExpenseCategory" NOT NULL DEFAULT 'MATERIJAL',
ADD COLUMN     "companyId" INTEGER,
ADD COLUMN     "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "documentNo" TEXT,
ADD COLUMN     "note" TEXT,
ADD COLUMN     "ocrRawText" TEXT,
ADD COLUMN     "paymentMethod" "PaymentMethod" NOT NULL DEFAULT 'GOTOVINA',
ADD COLUMN     "projectId" INTEGER NOT NULL,
ADD COLUMN     "status" "PaymentStatus" NOT NULL DEFAULT 'PLACENO',
ALTER COLUMN "paidDate" DROP NOT NULL,
ALTER COLUMN "paidDate" DROP DEFAULT,
ALTER COLUMN "phaseId" DROP NOT NULL;

-- AlterTable
ALTER TABLE "Phase" DROP COLUMN "budget",
DROP COLUMN "description",
ADD COLUMN     "budgetPlan" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
ADD COLUMN     "projectId" INTEGER NOT NULL,
ADD COLUMN     "subtitle" TEXT,
ALTER COLUMN "orderIndex" DROP DEFAULT,
ALTER COLUMN "status" SET DEFAULT 'NIJE_POCETO';

-- DropTable
DROP TABLE "Vendor";

-- CreateTable
CREATE TABLE "Project" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "location" TEXT,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "totalBudget" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Project_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Company" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "pib" TEXT,
    "address" TEXT,
    "factoryAddress" TEXT,
    "city" TEXT,
    "postalCode" TEXT,
    "contactPerson" TEXT,
    "phone" TEXT,
    "email" TEXT,
    "category" TEXT,
    "note" TEXT,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "projectId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Company_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Document" (
    "id" SERIAL NOT NULL,
    "title" TEXT NOT NULL,
    "fileUrl" TEXT NOT NULL,
    "fileType" TEXT,
    "ocrText" TEXT,
    "projectId" INTEGER NOT NULL,
    "phaseId" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Document_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Material" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "unit" TEXT NOT NULL DEFAULT 'kom',
    "category" TEXT,
    "description" TEXT,
    "priceEst" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "projectId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Material_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Capital" (
    "id" SERIAL NOT NULL,
    "sourceName" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "category" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "note" TEXT,
    "projectId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Capital_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Reminder" (
    "id" SERIAL NOT NULL,
    "title" TEXT NOT NULL,
    "dueDate" TIMESTAMP(3) NOT NULL,
    "priority" TEXT NOT NULL DEFAULT 'Srednje',
    "category" TEXT NOT NULL DEFAULT 'Opšte',
    "isDone" BOOLEAN NOT NULL DEFAULT false,
    "note" TEXT,
    "projectId" INTEGER NOT NULL,
    "phaseId" INTEGER,
    "companyId" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Reminder_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Phase" ADD CONSTRAINT "Phase_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Company" ADD CONSTRAINT "Company_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Expense" ADD CONSTRAINT "Expense_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Expense" ADD CONSTRAINT "Expense_phaseId_fkey" FOREIGN KEY ("phaseId") REFERENCES "Phase"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Expense" ADD CONSTRAINT "Expense_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Document" ADD CONSTRAINT "Document_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Document" ADD CONSTRAINT "Document_phaseId_fkey" FOREIGN KEY ("phaseId") REFERENCES "Phase"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Material" ADD CONSTRAINT "Material_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Capital" ADD CONSTRAINT "Capital_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Reminder" ADD CONSTRAINT "Reminder_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Reminder" ADD CONSTRAINT "Reminder_phaseId_fkey" FOREIGN KEY ("phaseId") REFERENCES "Phase"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Reminder" ADD CONSTRAINT "Reminder_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE SET NULL ON UPDATE CASCADE;
