-- AlterTable
ALTER TABLE "discovery_jobs" ADD COLUMN     "need" TEXT;

-- CreateTable
CREATE TABLE "discovery_products" (
    "id" TEXT NOT NULL,
    "jobId" TEXT NOT NULL,
    "productCategory" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "price" DOUBLE PRECISION NOT NULL,
    "priceCurrency" TEXT NOT NULL DEFAULT 'USD',
    "source" TEXT NOT NULL,
    "sourceUrl" TEXT,
    "sourceVendor" TEXT,
    "resultId" TEXT,
    "alternativeGroup" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "discovery_products_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "discovery_products" ADD CONSTRAINT "discovery_products_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "discovery_jobs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "discovery_products" ADD CONSTRAINT "discovery_products_resultId_fkey" FOREIGN KEY ("resultId") REFERENCES "discovery_results"("id") ON DELETE SET NULL ON UPDATE CASCADE;
