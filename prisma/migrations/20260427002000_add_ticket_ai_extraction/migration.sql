-- CreateEnum
CREATE TYPE "AiExtractionStatus" AS ENUM ('SUCCESS', 'FAILED');

-- AlterEnum
ALTER TYPE "TicketState" ADD VALUE 'AI_PROCESSED';

-- CreateTable
CREATE TABLE "TicketAiExtraction" (
    "id" TEXT NOT NULL,
    "ticketId" INTEGER NOT NULL,
    "provider" TEXT NOT NULL,
    "model" TEXT,
    "rawResponse" JSONB NOT NULL,
    "status" "AiExtractionStatus" NOT NULL DEFAULT 'SUCCESS',
    "error" TEXT,

    CONSTRAINT "TicketAiExtraction_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "TicketAiExtraction_ticketId_idx" ON "TicketAiExtraction"("ticketId");

-- AddForeignKey
ALTER TABLE "TicketAiExtraction" ADD CONSTRAINT "TicketAiExtraction_ticketId_fkey" FOREIGN KEY ("ticketId") REFERENCES "Ticket"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
