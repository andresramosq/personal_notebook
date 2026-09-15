-- CreateTable
CREATE TABLE "Board" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "slug" TEXT,
    "name" TEXT NOT NULL DEFAULT 'Pizarra',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "BoardLink" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "parentBoardId" TEXT NOT NULL,
    "targetBoardId" TEXT NOT NULL,
    "x" REAL NOT NULL,
    "y" REAL NOT NULL,
    CONSTRAINT "BoardLink_parentBoardId_fkey" FOREIGN KEY ("parentBoardId") REFERENCES "Board" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "BoardLink_targetBoardId_fkey" FOREIGN KEY ("targetBoardId") REFERENCES "Board" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "Board_slug_key" ON "Board"("slug");

-- CreateIndex
CREATE INDEX "BoardLink_parentBoardId_idx" ON "BoardLink"("parentBoardId");
