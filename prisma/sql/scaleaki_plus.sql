-- Scaleaki+ features — aplicação direta (idempotente) na live DB Supabase.
-- Cross-schema (auth.users) impede migrate diff; SQL escrito à mão.

-- ─── Enums ───────────────────────────────────────────────────────────────────
DO $$ BEGIN
  CREATE TYPE "ProductSource" AS ENUM ('dropshipping','mercadolivre','aliexpress','shopee','shein');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE "AdPlatform" AS ENUM ('youtube','tiktok');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE "PlacaStatus" AS ENUM ('pendente','aprovada','enviada','rejeitada');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ─── ScaledProduct ───────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS "ScaledProduct" (
  "id" TEXT PRIMARY KEY,
  "source" "ProductSource" NOT NULL,
  "externalId" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "description" TEXT,
  "imageUrl" TEXT,
  "productUrl" TEXT NOT NULL,
  "storeName" TEXT,
  "price" DOUBLE PRECISION,
  "originalPrice" DOUBLE PRECISION,
  "discountPct" INTEGER,
  "currency" TEXT DEFAULT 'BRL',
  "soldCount" INTEGER DEFAULT 0,
  "rating" DOUBLE PRECISION,
  "reviewCount" INTEGER DEFAULT 0,
  "category" TEXT,
  "escala" INTEGER DEFAULT 0,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "scraperLastRun" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE UNIQUE INDEX IF NOT EXISTS "ScaledProduct_source_externalId_key" ON "ScaledProduct"("source","externalId");
CREATE INDEX IF NOT EXISTS "ScaledProduct_source_idx" ON "ScaledProduct"("source");
CREATE INDEX IF NOT EXISTS "ScaledProduct_isActive_idx" ON "ScaledProduct"("isActive");
CREATE INDEX IF NOT EXISTS "ScaledProduct_source_isActive_escala_idx" ON "ScaledProduct"("source","isActive","escala" DESC);
CREATE INDEX IF NOT EXISTS "ScaledProduct_source_isActive_soldCount_idx" ON "ScaledProduct"("source","isActive","soldCount" DESC);
CREATE INDEX IF NOT EXISTS "ScaledProduct_source_isActive_discountPct_idx" ON "ScaledProduct"("source","isActive","discountPct" DESC);

-- ─── ScaledAd ────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS "ScaledAd" (
  "id" TEXT PRIMARY KEY,
  "platform" "AdPlatform" NOT NULL,
  "externalId" TEXT NOT NULL,
  "advertiser" TEXT,
  "title" TEXT,
  "adCopy" TEXT,
  "thumbnailUrl" TEXT,
  "videoUrl" TEXT,
  "landingUrl" TEXT,
  "views" INTEGER DEFAULT 0,
  "likes" INTEGER DEFAULT 0,
  "shares" INTEGER DEFAULT 0,
  "ctaText" TEXT,
  "region" TEXT DEFAULT 'BR',
  "firstSeen" TIMESTAMP(3),
  "lastSeen" TIMESTAMP(3),
  "escala" INTEGER DEFAULT 0,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "scraperLastRun" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE UNIQUE INDEX IF NOT EXISTS "ScaledAd_platform_externalId_key" ON "ScaledAd"("platform","externalId");
CREATE INDEX IF NOT EXISTS "ScaledAd_platform_idx" ON "ScaledAd"("platform");
CREATE INDEX IF NOT EXISTS "ScaledAd_isActive_idx" ON "ScaledAd"("isActive");
CREATE INDEX IF NOT EXISTS "ScaledAd_platform_isActive_escala_idx" ON "ScaledAd"("platform","isActive","escala" DESC);
CREATE INDEX IF NOT EXISTS "ScaledAd_platform_isActive_views_idx" ON "ScaledAd"("platform","isActive","views" DESC);

-- ─── ScaleflixVideo ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS "ScaleflixVideo" (
  "id" TEXT PRIMARY KEY,
  "title" TEXT NOT NULL,
  "description" TEXT,
  "thumbnailUrl" TEXT,
  "videoUrl" TEXT NOT NULL,
  "durationSec" INTEGER,
  "module" TEXT,
  "ordem" INTEGER NOT NULL DEFAULT 0,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS "ScaleflixVideo_isActive_idx" ON "ScaleflixVideo"("isActive");
CREATE INDEX IF NOT EXISTS "ScaleflixVideo_module_idx" ON "ScaleflixVideo"("module");
CREATE INDEX IF NOT EXISTS "ScaleflixVideo_isActive_ordem_idx" ON "ScaleflixVideo"("isActive","ordem");

-- ─── PlacaRequest ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS "PlacaRequest" (
  "id" TEXT PRIMARY KEY,
  "userId" TEXT NOT NULL,
  "faturamento" DOUBLE PRECISION NOT NULL,
  "periodo" TEXT NOT NULL,
  "comprovante" TEXT,
  "observacao" TEXT,
  "status" "PlacaStatus" NOT NULL DEFAULT 'pendente',
  "adminNote" TEXT,
  "trackingUrl" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "PlacaRequest_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE INDEX IF NOT EXISTS "PlacaRequest_userId_idx" ON "PlacaRequest"("userId");
CREATE INDEX IF NOT EXISTS "PlacaRequest_status_idx" ON "PlacaRequest"("status");

-- ─── FunnelExtraction ────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS "FunnelExtraction" (
  "id" TEXT PRIMARY KEY,
  "userId" TEXT NOT NULL,
  "domain" TEXT NOT NULL,
  "checkout" TEXT,
  "tecnologia" TEXT,
  "subdomains" TEXT,
  "activePixels" TEXT,
  "externalServices" TEXT,
  "screenshot" TEXT,
  "redirectChain" TEXT,
  "urlscanUuid" TEXT,
  "estimatedVisits" INTEGER,
  "trafficSources" TEXT,
  "topCountries" TEXT,
  "status" TEXT NOT NULL DEFAULT 'pending',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "FunnelExtraction_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE INDEX IF NOT EXISTS "FunnelExtraction_userId_idx" ON "FunnelExtraction"("userId");
CREATE INDEX IF NOT EXISTS "FunnelExtraction_domain_idx" ON "FunnelExtraction"("domain");
