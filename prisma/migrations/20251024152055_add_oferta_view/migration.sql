-- CreateTable
CREATE TABLE "OfertaView" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "ofertaId" TEXT NOT NULL,
    "viewedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OfertaView_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "OfertaView_userId_ofertaId_key" ON "OfertaView"("userId", "ofertaId");

-- CreateIndex
CREATE INDEX "OfertaView_userId_idx" ON "OfertaView"("userId");

-- CreateIndex
CREATE INDEX "OfertaView_ofertaId_idx" ON "OfertaView"("ofertaId");

-- CreateIndex
CREATE INDEX "OfertaView_viewedAt_idx" ON "OfertaView"("viewedAt");

-- AddForeignKey
ALTER TABLE "OfertaView" ADD CONSTRAINT "OfertaView_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OfertaView" ADD CONSTRAINT "OfertaView_ofertaId_fkey" FOREIGN KEY ("ofertaId") REFERENCES "Oferta"("id") ON DELETE CASCADE ON UPDATE CASCADE;

