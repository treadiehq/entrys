-- CreateEnum
CREATE TYPE "TeamMemberRole" AS ENUM ('owner', 'admin', 'member');

-- CreateEnum
CREATE TYPE "EnvironmentName" AS ENUM ('staging', 'prod');

-- CreateEnum
CREATE TYPE "ToolType" AS ENUM ('http', 'mcp');

-- CreateEnum
CREATE TYPE "HttpMethod" AS ENUM ('GET', 'POST', 'PUT', 'DELETE');

-- CreateEnum
CREATE TYPE "PolicyAction" AS ENUM ('allow', 'deny');

-- CreateEnum
CREATE TYPE "AuditDecision" AS ENUM ('allow', 'deny', 'error');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TeamMember" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "teamId" TEXT NOT NULL,
    "role" "TeamMemberRole" NOT NULL DEFAULT 'member',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TeamMember_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MagicLinkToken" (
    "id" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "userId" TEXT,
    "teamName" TEXT,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "usedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MagicLinkToken_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Session" (
    "id" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Team" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Team_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Environment" (
    "id" TEXT NOT NULL,
    "teamId" TEXT NOT NULL,
    "name" "EnvironmentName" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Environment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AgentKey" (
    "id" TEXT NOT NULL,
    "teamId" TEXT NOT NULL,
    "envId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "keyHash" TEXT NOT NULL,
    "keyPrefix" VARCHAR(20) NOT NULL,
    "isRevoked" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastUsedAt" TIMESTAMP(3),

    CONSTRAINT "AgentKey_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Tool" (
    "id" TEXT NOT NULL,
    "teamId" TEXT NOT NULL,
    "envId" TEXT NOT NULL,
    "logicalName" VARCHAR(100) NOT NULL,
    "version" VARCHAR(20) NOT NULL,
    "displayName" TEXT NOT NULL,
    "type" "ToolType" NOT NULL DEFAULT 'http',
    "method" "HttpMethod" NOT NULL DEFAULT 'POST',
    "urlTemplate" TEXT NOT NULL,
    "headersJson" TEXT,
    "mcpToolName" VARCHAR(100),
    "allowAllAgents" BOOLEAN NOT NULL DEFAULT true,
    "redactionEnabled" BOOLEAN NOT NULL DEFAULT true,
    "isActive" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Tool_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ToolAlias" (
    "id" TEXT NOT NULL,
    "teamId" TEXT NOT NULL,
    "envId" TEXT NOT NULL,
    "alias" VARCHAR(100) NOT NULL,
    "logicalName" VARCHAR(100) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ToolAlias_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditWebhook" (
    "id" TEXT NOT NULL,
    "teamId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "isEnabled" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditWebhook_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ToolAgentAccess" (
    "id" TEXT NOT NULL,
    "toolId" TEXT NOT NULL,
    "agentKeyId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ToolAgentAccess_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ToolPolicy" (
    "id" TEXT NOT NULL,
    "toolId" TEXT NOT NULL,
    "agentKeyId" TEXT,
    "agentNamePattern" TEXT,
    "action" "PolicyAction" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ToolPolicy_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL,
    "teamId" TEXT NOT NULL,
    "envId" TEXT NOT NULL,
    "requestId" TEXT NOT NULL,
    "agentKeyId" TEXT,
    "agentLabel" TEXT NOT NULL,
    "toolName" TEXT NOT NULL,
    "logicalName" TEXT,
    "toolVersion" VARCHAR(20),
    "backendType" VARCHAR(10),
    "decision" "AuditDecision" NOT NULL,
    "statusCode" INTEGER,
    "latencyMs" INTEGER NOT NULL,
    "redactionsJson" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "TeamMember_userId_idx" ON "TeamMember"("userId");

-- CreateIndex
CREATE INDEX "TeamMember_teamId_idx" ON "TeamMember"("teamId");

-- CreateIndex
CREATE UNIQUE INDEX "TeamMember_userId_teamId_key" ON "TeamMember"("userId", "teamId");

-- CreateIndex
CREATE UNIQUE INDEX "MagicLinkToken_token_key" ON "MagicLinkToken"("token");

-- CreateIndex
CREATE INDEX "MagicLinkToken_token_idx" ON "MagicLinkToken"("token");

-- CreateIndex
CREATE INDEX "MagicLinkToken_email_idx" ON "MagicLinkToken"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Session_token_key" ON "Session"("token");

-- CreateIndex
CREATE INDEX "Session_token_idx" ON "Session"("token");

-- CreateIndex
CREATE INDEX "Session_userId_idx" ON "Session"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Team_name_key" ON "Team"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Environment_teamId_name_key" ON "Environment"("teamId", "name");

-- CreateIndex
CREATE INDEX "AgentKey_keyPrefix_idx" ON "AgentKey"("keyPrefix");

-- CreateIndex
CREATE INDEX "AgentKey_envId_idx" ON "AgentKey"("envId");

-- CreateIndex
CREATE INDEX "Tool_envId_idx" ON "Tool"("envId");

-- CreateIndex
CREATE INDEX "Tool_envId_logicalName_isActive_idx" ON "Tool"("envId", "logicalName", "isActive");

-- CreateIndex
CREATE UNIQUE INDEX "Tool_teamId_envId_logicalName_version_key" ON "Tool"("teamId", "envId", "logicalName", "version");

-- CreateIndex
CREATE INDEX "ToolAlias_envId_alias_idx" ON "ToolAlias"("envId", "alias");

-- CreateIndex
CREATE UNIQUE INDEX "ToolAlias_teamId_envId_alias_key" ON "ToolAlias"("teamId", "envId", "alias");

-- CreateIndex
CREATE INDEX "AuditWebhook_teamId_idx" ON "AuditWebhook"("teamId");

-- CreateIndex
CREATE INDEX "ToolAgentAccess_toolId_idx" ON "ToolAgentAccess"("toolId");

-- CreateIndex
CREATE INDEX "ToolAgentAccess_agentKeyId_idx" ON "ToolAgentAccess"("agentKeyId");

-- CreateIndex
CREATE UNIQUE INDEX "ToolAgentAccess_toolId_agentKeyId_key" ON "ToolAgentAccess"("toolId", "agentKeyId");

-- CreateIndex
CREATE INDEX "ToolPolicy_toolId_idx" ON "ToolPolicy"("toolId");

-- CreateIndex
CREATE INDEX "ToolPolicy_agentKeyId_idx" ON "ToolPolicy"("agentKeyId");

-- CreateIndex
CREATE UNIQUE INDEX "AuditLog_requestId_key" ON "AuditLog"("requestId");

-- CreateIndex
CREATE INDEX "AuditLog_envId_idx" ON "AuditLog"("envId");

-- CreateIndex
CREATE INDEX "AuditLog_toolName_idx" ON "AuditLog"("toolName");

-- CreateIndex
CREATE INDEX "AuditLog_logicalName_idx" ON "AuditLog"("logicalName");

-- CreateIndex
CREATE INDEX "AuditLog_createdAt_idx" ON "AuditLog"("createdAt");

-- CreateIndex
CREATE INDEX "AuditLog_agentKeyId_idx" ON "AuditLog"("agentKeyId");

-- AddForeignKey
ALTER TABLE "TeamMember" ADD CONSTRAINT "TeamMember_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TeamMember" ADD CONSTRAINT "TeamMember_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MagicLinkToken" ADD CONSTRAINT "MagicLinkToken_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Session" ADD CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Environment" ADD CONSTRAINT "Environment_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AgentKey" ADD CONSTRAINT "AgentKey_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AgentKey" ADD CONSTRAINT "AgentKey_envId_fkey" FOREIGN KEY ("envId") REFERENCES "Environment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Tool" ADD CONSTRAINT "Tool_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Tool" ADD CONSTRAINT "Tool_envId_fkey" FOREIGN KEY ("envId") REFERENCES "Environment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ToolAlias" ADD CONSTRAINT "ToolAlias_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ToolAlias" ADD CONSTRAINT "ToolAlias_envId_fkey" FOREIGN KEY ("envId") REFERENCES "Environment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditWebhook" ADD CONSTRAINT "AuditWebhook_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ToolAgentAccess" ADD CONSTRAINT "ToolAgentAccess_toolId_fkey" FOREIGN KEY ("toolId") REFERENCES "Tool"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ToolAgentAccess" ADD CONSTRAINT "ToolAgentAccess_agentKeyId_fkey" FOREIGN KEY ("agentKeyId") REFERENCES "AgentKey"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ToolPolicy" ADD CONSTRAINT "ToolPolicy_toolId_fkey" FOREIGN KEY ("toolId") REFERENCES "Tool"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ToolPolicy" ADD CONSTRAINT "ToolPolicy_agentKeyId_fkey" FOREIGN KEY ("agentKeyId") REFERENCES "AgentKey"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_envId_fkey" FOREIGN KEY ("envId") REFERENCES "Environment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_agentKeyId_fkey" FOREIGN KEY ("agentKeyId") REFERENCES "AgentKey"("id") ON DELETE SET NULL ON UPDATE CASCADE;
