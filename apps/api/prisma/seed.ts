import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { randomBytes } from 'crypto';

const prisma = new PrismaClient();

function generateAgentKey(): { plainKey: string; keyHash: string; keyPrefix: string } {
  const randomPart = randomBytes(24).toString('base64url');
  const plainKey = `ent_stag_${randomPart}`;
  const keyPrefix = plainKey.substring(0, 12);
  const keyHash = bcrypt.hashSync(plainKey, 10);
  return { plainKey, keyHash, keyPrefix };
}

async function main() {
  console.log('🌱 Seeding database...\n');

  // Create demo team
  const team = await prisma.team.upsert({
    where: { id: 'demo-team-id' },
    update: {},
    create: {
      id: 'demo-team-id',
      name: 'Demo Team',
    },
  });
  console.log(`✅ Team: ${team.name} (${team.id})`);

  // Create environments
  const staging = await prisma.environment.upsert({
    where: { teamId_name: { teamId: team.id, name: 'staging' } },
    update: {},
    create: {
      teamId: team.id,
      name: 'staging',
    },
  });
  console.log(`✅ Environment: staging (${staging.id})`);

  const prod = await prisma.environment.upsert({
    where: { teamId_name: { teamId: team.id, name: 'prod' } },
    update: {},
    create: {
      teamId: team.id,
      name: 'prod',
    },
  });
  console.log(`✅ Environment: prod (${prod.id})`);

  // Create demo agent key for staging
  const { plainKey, keyHash, keyPrefix } = generateAgentKey();
  
  // Delete existing demo agent key if exists
  await prisma.agentKey.deleteMany({
    where: { name: 'demo-agent', envId: staging.id },
  });
  
  const agentKey = await prisma.agentKey.create({
    data: {
      teamId: team.id,
      envId: staging.id,
      name: 'demo-agent',
      keyHash,
      keyPrefix,
    },
  });
  console.log(`✅ Agent Key: ${agentKey.name} (${agentKey.keyPrefix}...)`);

  // Create demo tools with versioning
  // Delete existing tools
  await prisma.tool.deleteMany({
    where: { logicalName: 'echo_httpbin', envId: staging.id },
  });
  
  // Create v1 of echo_httpbin (active)
  const toolV1 = await prisma.tool.create({
    data: {
      teamId: team.id,
      envId: staging.id,
      logicalName: 'echo_httpbin',
      version: 'v1',
      displayName: 'Echo (httpbin) v1',
      type: 'http',
      method: 'POST',
      urlTemplate: 'https://httpbin.org/anything',
      allowAllAgents: true,
      isActive: true,
    },
  });
  console.log(`✅ Tool: ${toolV1.logicalName} ${toolV1.version} [ACTIVE] -> ${toolV1.urlTemplate}`);

  // Create v2 of echo_httpbin (inactive, for testing version switching)
  const toolV2 = await prisma.tool.create({
    data: {
      teamId: team.id,
      envId: staging.id,
      logicalName: 'echo_httpbin',
      version: 'v2',
      displayName: 'Echo (httpbin) v2 - With Headers',
      type: 'http',
      method: 'POST',
      urlTemplate: 'https://httpbin.org/anything',
      headersJson: JSON.stringify({ 'X-Version': '2' }),
      allowAllAgents: true,
      isActive: false,
    },
  });
  console.log(`✅ Tool: ${toolV2.logicalName} ${toolV2.version} [inactive] -> ${toolV2.urlTemplate}`);

  // Create a tool that returns sensitive data (for testing redaction)
  await prisma.tool.deleteMany({
    where: { logicalName: 'mock_customer', envId: staging.id },
  });
  
  const mockTool = await prisma.tool.create({
    data: {
      teamId: team.id,
      envId: staging.id,
      logicalName: 'mock_customer',
      version: 'v1',
      displayName: 'Mock Customer Data',
      type: 'http',
      method: 'POST',
      urlTemplate: 'https://httpbin.org/anything',
      allowAllAgents: true,
      isActive: true,
    },
  });
  console.log(`✅ Tool: ${mockTool.logicalName} ${mockTool.version} [ACTIVE] -> ${mockTool.urlTemplate}`);

  // Create a tool alias for backwards compatibility demo
  await prisma.toolAlias.deleteMany({
    where: { alias: 'echo', envId: staging.id },
  });
  
  const alias = await prisma.toolAlias.create({
    data: {
      teamId: team.id,
      envId: staging.id,
      alias: 'echo',
      logicalName: 'echo_httpbin',
    },
  });
  console.log(`✅ Alias: "${alias.alias}" → "${alias.logicalName}"`);

  console.log('\n' + '='.repeat(60));
  console.log('🎉 SEED COMPLETE!\n');
  console.log('📋 Your demo agent key (SAVE THIS - shown only once):');
  console.log('='.repeat(60));
  console.log(`\n   ${plainKey}\n`);
  console.log('='.repeat(60));
  console.log('\n📌 Quick Test (using logical name):');
  console.log(`
curl -X POST http://localhost:3001/v1/invoke/echo_httpbin \\
  -H "Content-Type: application/json" \\
  -H "x-api-key: ${plainKey}" \\
  -d '{"input": {"message": "Hello, world!", "email": "test@example.com"}}'
`);
  console.log('📌 Quick Test (using alias):');
  console.log(`
curl -X POST http://localhost:3001/v1/invoke/echo \\
  -H "Content-Type: application/json" \\
  -H "x-api-key: ${plainKey}" \\
  -d '{"input": {"message": "Hello via alias!"}}'
`);
  console.log('='.repeat(60));
}

main()
  .catch((e) => {
    console.error('Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
