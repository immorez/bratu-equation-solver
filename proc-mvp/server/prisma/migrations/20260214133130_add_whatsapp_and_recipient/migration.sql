-- AlterEnum
ALTER TYPE "CommunicationType" ADD VALUE 'WHATSAPP';

-- AlterTable
ALTER TABLE "communications" ADD COLUMN     "recipient" TEXT;
