import { PrismaClient } from '@prisma/client';
import { createPrismaClientOptions } from '../apps/api/src/modules/database/prisma-client-options';

const prisma = new PrismaClient(createPrismaClientOptions());

async function main(): Promise<void> {
  await prisma.$queryRaw`SELECT 1`;
  console.log('Database connection is healthy');
}

void main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error: unknown) => {
    console.error('Database connection failed');
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
