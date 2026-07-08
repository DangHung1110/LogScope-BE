import { PrismaClient, ProjectRole } from '@prisma/client';
import { createPrismaClientOptions } from '../src/modules/database/prisma-client-options';

const prisma = new PrismaClient(createPrismaClientOptions());

async function main(): Promise<void> {
  const user = await prisma.user.upsert({
    create: {
      email: 'test@logscope.local',
      name: 'Test User',
      passwordHash: 'test-password-hash',
    },
    update: {
      name: 'Test User',
    },
    where: {
      email: 'test@logscope.local',
    },
  });

  const project = await prisma.project.upsert({
    create: {
      name: 'Test Project',
      ownerId: user.id,
      slug: 'test-project',
    },
    update: {
      name: 'Test Project',
      ownerId: user.id,
    },
    where: {
      slug: 'test-project',
    },
  });

  await prisma.projectMember.upsert({
    create: {
      projectId: project.id,
      role: ProjectRole.OWNER,
      userId: user.id,
    },
    update: {
      role: ProjectRole.OWNER,
    },
    where: {
      userId_projectId: {
        projectId: project.id,
        userId: user.id,
      },
    },
  });

  await prisma.apiKey.upsert({
    create: {
      keyHash: 'test-api-key-hash',
      name: 'Test API Key',
      prefix: 'lgs_test',
      projectId: project.id,
    },
    update: {
      name: 'Test API Key',
      revokedAt: null,
    },
    where: {
      prefix: 'lgs_test',
    },
  });
}

void main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error: unknown) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
