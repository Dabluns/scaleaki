-- CreateEnum
CREATE TYPE "PlataformaAnuncio" AS ENUM ('facebook_ads', 'google_ads', 'tiktok_ads', 'instagram_ads', 'linkedin_ads', 'twitter_ads', 'pinterest_ads', 'snapchat_ads');

-- CreateEnum
CREATE TYPE "TipoOferta" AS ENUM ('ecommerce', 'lead_generation', 'app_install', 'brand_awareness', 'video_views', 'conversions', 'traffic');

-- CreateEnum
CREATE TYPE "StatusOferta" AS ENUM ('ativa', 'pausada', 'arquivada', 'teste');

-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('admin', 'user');

-- CreateEnum
CREATE TYPE "UserPlan" AS ENUM ('free', 'basic', 'premium', 'enterprise');

-- CreateEnum
CREATE TYPE "Linguagem" AS ENUM ('pt_BR', 'en_US', 'es_ES', 'fr_FR');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" "UserRole" NOT NULL DEFAULT 'user',
    "plan" "UserPlan" NOT NULL DEFAULT 'free',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "lastLoginAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "emailConfirmed" BOOLEAN NOT NULL DEFAULT false,
    "emailConfirmationToken" TEXT,
    "emailConfirmationExpires" TIMESTAMP(3),

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AdminAuditLog" (
    "id" TEXT NOT NULL,
    "adminId" TEXT NOT NULL,
    "adminEmail" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "targetUserId" TEXT NOT NULL,
    "targetUserEmail" TEXT NOT NULL,
    "details" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AdminAuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Nicho" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "icone" TEXT NOT NULL,
    "descricao" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Nicho_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Oferta" (
    "id" TEXT NOT NULL,
    "titulo" TEXT NOT NULL,
    "imagem" TEXT,
    "texto" TEXT NOT NULL,
    "nichoId" TEXT NOT NULL,
    "plataforma" "PlataformaAnuncio" NOT NULL DEFAULT 'facebook_ads',
    "tipoOferta" "TipoOferta" NOT NULL DEFAULT 'ecommerce',
    "status" "StatusOferta" NOT NULL DEFAULT 'ativa',
    "tags" TEXT,
    "linguagem" "Linguagem" NOT NULL DEFAULT 'pt_BR',
    "links" TEXT NOT NULL,
    "metricas" TEXT,
    "vsl" TEXT,
    "ctr" DOUBLE PRECISION,
    "cpc" DOUBLE PRECISION,
    "cpm" DOUBLE PRECISION,
    "conversoes" INTEGER,
    "roi" DOUBLE PRECISION,
    "receita" DOUBLE PRECISION,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Oferta_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Favorito" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "ofertaId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Favorito_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserSettings" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "theme" TEXT NOT NULL DEFAULT 'auto',
    "accentColor" TEXT NOT NULL DEFAULT '#10b981',
    "density" TEXT NOT NULL DEFAULT 'comfortable',
    "fontSize" TEXT NOT NULL DEFAULT 'medium',
    "language" "Linguagem" NOT NULL DEFAULT 'pt_BR',
    "defaultLayout" TEXT NOT NULL DEFAULT 'grid',
    "itemsPerPage" INTEGER NOT NULL DEFAULT 25,
    "defaultSort" TEXT NOT NULL DEFAULT 'createdAt',
    "showMetricsOnCard" BOOLEAN NOT NULL DEFAULT true,
    "autoRefresh" BOOLEAN NOT NULL DEFAULT false,
    "refreshInterval" INTEGER DEFAULT 300,
    "emailNewOffers" BOOLEAN NOT NULL DEFAULT true,
    "emailNewOffersFreq" TEXT NOT NULL DEFAULT 'immediate',
    "emailRecommendations" BOOLEAN NOT NULL DEFAULT true,
    "emailRecoFrequency" TEXT NOT NULL DEFAULT 'weekly',
    "emailRecoTime" TEXT DEFAULT '09:00',
    "emailRecoDayOfWeek" INTEGER DEFAULT 1,
    "emailPerformance" BOOLEAN NOT NULL DEFAULT true,
    "emailPerfMinRoi" DOUBLE PRECISION DEFAULT 100.0,
    "emailPerfMinCtr" DOUBLE PRECISION DEFAULT 2.0,
    "emailWeeklySummary" BOOLEAN NOT NULL DEFAULT false,
    "emailUpdates" BOOLEAN NOT NULL DEFAULT true,
    "emailNewsletter" BOOLEAN NOT NULL DEFAULT false,
    "inAppNewOffers" BOOLEAN NOT NULL DEFAULT true,
    "inAppSimilar" BOOLEAN NOT NULL DEFAULT true,
    "inAppPerformance" BOOLEAN NOT NULL DEFAULT false,
    "inAppFrequency" TEXT NOT NULL DEFAULT 'realtime',
    "pushEnabled" BOOLEAN NOT NULL DEFAULT false,
    "pushSubscription" TEXT,
    "pushHighPerformance" BOOLEAN NOT NULL DEFAULT false,
    "pushMinRoi" DOUBLE PRECISION DEFAULT 150.0,
    "pushMinCtr" DOUBLE PRECISION DEFAULT 3.0,
    "pushReminders" BOOLEAN NOT NULL DEFAULT false,
    "pushReminderDays" INTEGER DEFAULT 7,
    "profilePublic" BOOLEAN NOT NULL DEFAULT false,
    "showActivities" BOOLEAN NOT NULL DEFAULT false,
    "shareStats" BOOLEAN NOT NULL DEFAULT false,
    "favoriteNichos" TEXT,
    "preferredPlataformas" TEXT,
    "defaultStatus" TEXT DEFAULT '["ativa","pausada","teste"]',
    "preferredTipoOferta" TEXT,
    "minRoi" DOUBLE PRECISION,
    "minCtr" DOUBLE PRECISION,
    "preferredLanguages" TEXT DEFAULT '["pt_BR"]',
    "recoAlgorithm" TEXT NOT NULL DEFAULT 'hybrid',
    "recoFrequency" TEXT NOT NULL DEFAULT 'medium',
    "recoDiversity" TEXT NOT NULL DEFAULT 'balanced',
    "excludedNichos" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserSettings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserProfile" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "avatar" TEXT,
    "avatarType" TEXT DEFAULT 'initials',
    "phone" TEXT,
    "company" TEXT,
    "position" TEXT,
    "bio" TEXT,
    "twoFactorEnabled" BOOLEAN NOT NULL DEFAULT false,
    "twoFactorSecret" TEXT,
    "twoFactorBackupCodes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ApiKey" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "keyPrefix" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ApiKey_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Webhook" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "secret" TEXT,
    "events" TEXT NOT NULL,
    "headers" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Webhook_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WebhookLog" (
    "id" TEXT NOT NULL,
    "webhookId" TEXT NOT NULL,
    "event" TEXT NOT NULL,
    "payload" TEXT,
    "response" TEXT,
    "statusCode" INTEGER,
    "success" BOOLEAN NOT NULL,
    "errorMessage" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WebhookLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "AdminAuditLog_adminId_action_createdAt_idx" ON "AdminAuditLog"("adminId", "action", "createdAt");

-- CreateIndex
CREATE INDEX "AdminAuditLog_targetUserId_createdAt_idx" ON "AdminAuditLog"("targetUserId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "Nicho_slug_key" ON "Nicho"("slug");

-- CreateIndex
CREATE INDEX "Nicho_slug_idx" ON "Nicho"("slug");

-- CreateIndex
CREATE INDEX "Nicho_isActive_idx" ON "Nicho"("isActive");

-- CreateIndex
CREATE INDEX "Oferta_nichoId_idx" ON "Oferta"("nichoId");

-- CreateIndex
CREATE INDEX "Oferta_plataforma_idx" ON "Oferta"("plataforma");

-- CreateIndex
CREATE INDEX "Oferta_tipoOferta_idx" ON "Oferta"("tipoOferta");

-- CreateIndex
CREATE INDEX "Oferta_status_idx" ON "Oferta"("status");

-- CreateIndex
CREATE INDEX "Oferta_linguagem_idx" ON "Oferta"("linguagem");

-- CreateIndex
CREATE INDEX "Oferta_isActive_idx" ON "Oferta"("isActive");

-- CreateIndex
CREATE INDEX "Oferta_createdAt_idx" ON "Oferta"("createdAt");

-- CreateIndex
CREATE INDEX "Oferta_isActive_status_idx" ON "Oferta"("isActive", "status");

-- CreateIndex
CREATE INDEX "Oferta_isActive_plataforma_idx" ON "Oferta"("isActive", "plataforma");

-- CreateIndex
CREATE INDEX "Oferta_isActive_tipoOferta_idx" ON "Oferta"("isActive", "tipoOferta");

-- CreateIndex
CREATE INDEX "Oferta_isActive_nichoId_idx" ON "Oferta"("isActive", "nichoId");

-- CreateIndex
CREATE INDEX "Oferta_isActive_linguagem_idx" ON "Oferta"("isActive", "linguagem");

-- CreateIndex
CREATE INDEX "Oferta_isActive_roi_idx" ON "Oferta"("isActive", "roi" DESC);

-- CreateIndex
CREATE INDEX "Oferta_isActive_ctr_idx" ON "Oferta"("isActive", "ctr" DESC);

-- CreateIndex
CREATE INDEX "Oferta_isActive_createdAt_idx" ON "Oferta"("isActive", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "Oferta_isActive_plataforma_tipoOferta_status_idx" ON "Oferta"("isActive", "plataforma", "tipoOferta", "status");

-- CreateIndex
CREATE INDEX "Oferta_isActive_nichoId_status_idx" ON "Oferta"("isActive", "nichoId", "status");

-- CreateIndex
CREATE INDEX "Favorito_userId_idx" ON "Favorito"("userId");

-- CreateIndex
CREATE INDEX "Favorito_ofertaId_idx" ON "Favorito"("ofertaId");

-- CreateIndex
CREATE UNIQUE INDEX "Favorito_userId_ofertaId_key" ON "Favorito"("userId", "ofertaId");

-- CreateIndex
CREATE UNIQUE INDEX "UserSettings_userId_key" ON "UserSettings"("userId");

-- CreateIndex
CREATE INDEX "UserSettings_userId_idx" ON "UserSettings"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "UserProfile_userId_key" ON "UserProfile"("userId");

-- CreateIndex
CREATE INDEX "UserProfile_userId_idx" ON "UserProfile"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "ApiKey_key_key" ON "ApiKey"("key");

-- CreateIndex
CREATE INDEX "ApiKey_userId_idx" ON "ApiKey"("userId");

-- CreateIndex
CREATE INDEX "ApiKey_keyPrefix_idx" ON "ApiKey"("keyPrefix");

-- CreateIndex
CREATE INDEX "Webhook_userId_idx" ON "Webhook"("userId");

-- CreateIndex
CREATE INDEX "WebhookLog_webhookId_createdAt_idx" ON "WebhookLog"("webhookId", "createdAt");

-- AddForeignKey
ALTER TABLE "Oferta" ADD CONSTRAINT "Oferta_nichoId_fkey" FOREIGN KEY ("nichoId") REFERENCES "Nicho"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Favorito" ADD CONSTRAINT "Favorito_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Favorito" ADD CONSTRAINT "Favorito_ofertaId_fkey" FOREIGN KEY ("ofertaId") REFERENCES "Oferta"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserSettings" ADD CONSTRAINT "UserSettings_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserProfile" ADD CONSTRAINT "UserProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ApiKey" ADD CONSTRAINT "ApiKey_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Webhook" ADD CONSTRAINT "Webhook_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WebhookLog" ADD CONSTRAINT "WebhookLog_webhookId_fkey" FOREIGN KEY ("webhookId") REFERENCES "Webhook"("id") ON DELETE CASCADE ON UPDATE CASCADE;
