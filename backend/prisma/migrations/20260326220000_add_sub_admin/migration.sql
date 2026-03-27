-- AlterEnum
ALTER TYPE "Role" ADD VALUE 'SUB_ADMIN';

-- AlterTable
ALTER TABLE "users" ADD COLUMN "managed_barber_id" TEXT;

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_managed_barber_id_fkey" FOREIGN KEY ("managed_barber_id") REFERENCES "barbers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- CreateIndex
CREATE INDEX "users_managed_barber_id_idx" ON "users"("managed_barber_id");
