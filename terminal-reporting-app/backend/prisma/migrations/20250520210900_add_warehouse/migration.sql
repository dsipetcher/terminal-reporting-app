/*
  Warnings:

  - You are about to drop the column `warehouse` on the `Wagon` table. All the data in the column will be lost.
  - Added the required column `warehouseId` to the `Wagon` table without a default value. This is not possible if the table is not empty.
  - Made the column `arrivalAt` on table `Wagon` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "Wagon" DROP COLUMN "warehouse",
ADD COLUMN     "warehouseId" INTEGER NOT NULL,
ALTER COLUMN "arrivalAt" SET NOT NULL,
ALTER COLUMN "cargoWeight" DROP NOT NULL,
ALTER COLUMN "cargoWeight" DROP DEFAULT;

-- CreateTable
CREATE TABLE "Warehouse" (
    "id" SERIAL NOT NULL,
    "number" TEXT NOT NULL,
    "capacity" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "Warehouse_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Warehouse_number_key" ON "Warehouse"("number");

-- AddForeignKey
ALTER TABLE "Wagon" ADD CONSTRAINT "Wagon_warehouseId_fkey" FOREIGN KEY ("warehouseId") REFERENCES "Warehouse"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
