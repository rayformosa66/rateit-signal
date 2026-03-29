-- CreateTable
CREATE TABLE "Merchant" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "domain" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "currentVerdict" TEXT NOT NULL,
    "lastReviewedAt" DATETIME,
    "publicSummary" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'active',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Assessment" (
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
    CONSTRAINT "Assessment_merchantId_fkey" FOREIGN KEY ("merchantId") REFERENCES "Merchant" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "UserReport" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "merchantId" TEXT,
    "domain" TEXT NOT NULL,
    "reportType" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "screenshotUrl" TEXT,
    "status" TEXT NOT NULL DEFAULT 'new',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "UserReport_merchantId_fkey" FOREIGN KEY ("merchantId") REFERENCES "Merchant" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "AdminUser" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'reviewer',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "Merchant_domain_key" ON "Merchant"("domain");

-- CreateIndex
CREATE INDEX "Assessment_merchantId_idx" ON "Assessment"("merchantId");

-- CreateIndex
CREATE INDEX "UserReport_merchantId_idx" ON "UserReport"("merchantId");

-- CreateIndex
CREATE INDEX "UserReport_domain_idx" ON "UserReport"("domain");

-- CreateIndex
CREATE UNIQUE INDEX "AdminUser_email_key" ON "AdminUser"("email");
