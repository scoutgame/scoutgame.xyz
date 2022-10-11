-- CreateEnum
CREATE TYPE "MemberPropertyType" AS ENUM ('text', 'number', 'phone', 'url', 'email', 'wallet', 'select', 'multiselect', 'role', 'profile_pic', 'timezone', 'wallet_address');

-- CreateTable
CREATE TABLE "MemberProperty" (
    "id" UUID NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdBy" UUID NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "updatedBy" UUID NOT NULL,
    "spaceId" UUID NOT NULL,
    "type" "MemberPropertyType" NOT NULL,
    "options" JSONB,
    "index" INTEGER NOT NULL DEFAULT -1,

    CONSTRAINT "MemberProperty_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MemberPropertyValue" (
    "id" UUID NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "updatedBy" UUID NOT NULL,
    "workspaceUserPropertyId" UUID NOT NULL,
    "spaceId" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "value" JSONB,

    CONSTRAINT "MemberPropertyValue_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "MemberProperty" ADD CONSTRAINT "MemberProperty_spaceId_fkey" FOREIGN KEY ("spaceId") REFERENCES "Space"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MemberPropertyValue" ADD CONSTRAINT "MemberPropertyValue_workspaceUserPropertyId_fkey" FOREIGN KEY ("workspaceUserPropertyId") REFERENCES "MemberProperty"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MemberPropertyValue" ADD CONSTRAINT "MemberPropertyValue_spaceId_fkey" FOREIGN KEY ("spaceId") REFERENCES "Space"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MemberPropertyValue" ADD CONSTRAINT "MemberPropertyValue_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
