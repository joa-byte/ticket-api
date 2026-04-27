-- AlterTable
ALTER TABLE "Item" ADD COLUMN "quantity" DOUBLE PRECISION NOT NULL DEFAULT 1;

-- AddCheckConstraint
ALTER TABLE "Item" ADD CONSTRAINT "Item_quantity_non_negative_check" CHECK ("quantity" >= 0);
