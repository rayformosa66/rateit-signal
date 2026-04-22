-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Assessment" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "merchantId" TEXT NOT NULL,
    "transparencyRating" TEXT NOT NULL,
    "reliabilityRating" TEXT NOT NULL,
    "integrityRating" TEXT NOT NULL,
    "communicationRating" TEXT NOT NULL,
    "redFlags" TEXT NOT NULL,
    "internalRationale" TEXT NOT NULL,
    "publicSummary" TEXT NOT NULL,
    "publicReasons" TEXT NOT NULL,
    "reviewedBy" TEXT NOT NULL,
    "reviewedAt" DATETIME NOT NULL,
    "reviewerRole" TEXT NOT NULL DEFAULT 'reviewer',
    "triggerReason" TEXT NOT NULL DEFAULT 'Proactive review',
    "hasConflict" BOOLEAN NOT NULL DEFAULT false,
    "flaggedForReview" BOOLEAN NOT NULL DEFAULT false,
    CONSTRAINT "Assessment_merchantId_fkey" FOREIGN KEY ("merchantId") REFERENCES "Merchant" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Assessment" ("communicationRating", "id", "integrityRating", "internalRationale", "merchantId", "publicReasons", "publicSummary", "redFlags", "reliabilityRating", "reviewedAt", "reviewedBy", "transparencyRating") SELECT "communicationRating", "id", "integrityRating", "internalRationale", "merchantId", "publicReasons", "publicSummary", "redFlags", "reliabilityRating", "reviewedAt", "reviewedBy", "transparencyRating" FROM "Assessment";
DROP TABLE "Assessment";
ALTER TABLE "new_Assessment" RENAME TO "Assessment";
CREATE INDEX "Assessment_merchantId_idx" ON "Assessment"("merchantId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
