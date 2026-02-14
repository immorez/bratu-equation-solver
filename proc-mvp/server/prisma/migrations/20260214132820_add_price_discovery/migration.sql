-- AlterTable
ALTER TABLE "discovery_results" ADD COLUMN     "priceCurrency" TEXT DEFAULT 'USD',
ADD COLUMN     "priceDiscovery" JSONB,
ADD COLUMN     "priceMax" DOUBLE PRECISION,
ADD COLUMN     "priceMin" DOUBLE PRECISION;
