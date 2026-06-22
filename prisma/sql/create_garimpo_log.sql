CREATE TABLE IF NOT EXISTS "GarimpoLog" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "fbAdId" TEXT NOT NULL,
  "garimpedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "GarimpoLog_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "GarimpoLog_userId_fbAdId_key" ON "GarimpoLog"("userId", "fbAdId");
CREATE INDEX IF NOT EXISTS "GarimpoLog_userId_garimpedAt_idx" ON "GarimpoLog"("userId", "garimpedAt");

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'GarimpoLog_userId_fkey'
  ) THEN
    ALTER TABLE "GarimpoLog"
      ADD CONSTRAINT "GarimpoLog_userId_fkey"
      FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;
