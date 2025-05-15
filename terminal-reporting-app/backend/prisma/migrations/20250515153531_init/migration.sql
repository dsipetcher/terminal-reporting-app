-- CreateTable
CREATE TABLE "Wagon" (
    "id" SERIAL NOT NULL,
    "number" TEXT NOT NULL,
    "cargo" TEXT NOT NULL,
    "warehouse" TEXT NOT NULL,
    "track" TEXT NOT NULL,
    "arrivalAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Wagon_pkey" PRIMARY KEY ("id")
);
