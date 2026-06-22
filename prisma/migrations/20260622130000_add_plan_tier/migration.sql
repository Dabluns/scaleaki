-- Tier de PRODUTO (escada de acesso), independente do período de cobrança (UserPlan).
-- Não-destrutivo: cria enum + coluna com default 'free', depois backfilla quem já paga.

-- CreateEnum
CREATE TYPE "PlanTier" AS ENUM ('free', 'basico', 'plus');

-- AlterTable
ALTER TABLE "User" ADD COLUMN "tier" "PlanTier" NOT NULL DEFAULT 'free';

-- Backfill: todo usuário pago atual (plan != free) entra como 'basico'.
-- Plus será atribuído depois via webhook do produto Cakto dedicado.
UPDATE "User" SET "tier" = 'basico' WHERE "plan" <> 'free';
