-- AlterTable
ALTER TABLE "ItemUser" ADD COLUMN "quantity" DOUBLE PRECISION NOT NULL DEFAULT 1;

-- AddCheckConstraint
ALTER TABLE "ItemUser" ADD CONSTRAINT "ItemUser_quantity_non_negative_check" CHECK ("quantity" >= 0);
