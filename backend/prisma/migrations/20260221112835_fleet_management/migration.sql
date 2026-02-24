/*
  Warnings:

  - The primary key for the `devices` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `scentSlots` on the `devices` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "public"."user" DROP CONSTRAINT "user_deviceId_fkey";

-- AlterTable
ALTER TABLE "devices" DROP CONSTRAINT "devices_pkey",
DROP COLUMN "scentSlots",
ADD COLUMN     "lastSeen" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "status" TEXT NOT NULL DEFAULT 'OFFLINE',
ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "id" SET DATA TYPE TEXT,
ADD CONSTRAINT "devices_pkey" PRIMARY KEY ("id");
DROP SEQUENCE "devices_id_seq";

-- AlterTable
ALTER TABLE "orders" ADD COLUMN     "amount" DECIMAL(65,30) NOT NULL DEFAULT 0.00,
ADD COLUMN     "quantity" INTEGER NOT NULL DEFAULT 1,
ADD COLUMN     "status" TEXT NOT NULL DEFAULT 'PENDING',
ADD COLUMN     "transaction_id" TEXT;

-- AlterTable
ALTER TABLE "user" ALTER COLUMN "deviceId" SET DATA TYPE TEXT;

-- CreateTable
CREATE TABLE "device_slots" (
    "id" SERIAL NOT NULL,
    "device_id" TEXT NOT NULL,
    "slot_number" INTEGER NOT NULL,
    "cologne_id" TEXT NOT NULL,
    "capacity_ml" INTEGER NOT NULL DEFAULT 1000,
    "current_ml" DOUBLE PRECISION NOT NULL DEFAULT 1000,

    CONSTRAINT "device_slots_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DiscountCode" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "percent" INTEGER NOT NULL,
    "maxUsages" INTEGER NOT NULL DEFAULT 1,
    "usedCount" INTEGER NOT NULL DEFAULT 0,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DiscountCode_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "device_slots_device_id_slot_number_key" ON "device_slots"("device_id", "slot_number");

-- CreateIndex
CREATE UNIQUE INDEX "DiscountCode_code_key" ON "DiscountCode"("code");

-- AddForeignKey
ALTER TABLE "orders" ADD CONSTRAINT "orders_device_id_fkey" FOREIGN KEY ("device_id") REFERENCES "devices"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user" ADD CONSTRAINT "user_deviceId_fkey" FOREIGN KEY ("deviceId") REFERENCES "devices"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "device_slots" ADD CONSTRAINT "device_slots_device_id_fkey" FOREIGN KEY ("device_id") REFERENCES "devices"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "device_slots" ADD CONSTRAINT "device_slots_cologne_id_fkey" FOREIGN KEY ("cologne_id") REFERENCES "colognes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
