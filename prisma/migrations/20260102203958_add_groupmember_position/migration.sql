-- AlterTable
ALTER TABLE "GroupMember" ADD COLUMN     "position" INTEGER NOT NULL DEFAULT 0;

-- CreateIndex
CREATE INDEX "GroupMember_groupId_idx" ON "GroupMember"("groupId");

-- CreateIndex
CREATE INDEX "GroupMember_playerId_idx" ON "GroupMember"("playerId");
