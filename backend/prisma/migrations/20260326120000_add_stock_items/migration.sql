-- CreateTable
CREATE TABLE "stock_items" (
    "id" TEXT NOT NULL,
    "barber_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "quantity" INTEGER NOT NULL DEFAULT 0,
    "unit" TEXT NOT NULL DEFAULT 'un',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "stock_items_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "stock_items_barber_id_idx" ON "stock_items"("barber_id");

-- AddForeignKey
ALTER TABLE "stock_items" ADD CONSTRAINT "stock_items_barber_id_fkey" FOREIGN KEY ("barber_id") REFERENCES "barbers"("id") ON DELETE CASCADE ON UPDATE CASCADE;
