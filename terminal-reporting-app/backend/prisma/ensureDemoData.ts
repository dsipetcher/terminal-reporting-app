import { PrismaClient } from '@prisma/client';
import { runDemoSeed, EXPECTED_MOCK_BATCH_COUNT } from './seed.js';

const prisma = new PrismaClient();

export async function ensureDemoData() {
  const batchCount = await prisma.cargoTracking.count();
  const coalOrder = await prisma.logisticsOrder.findUnique({
    where: { orderNumber: 'ILS-2026-COAL' },
  });

  if (batchCount >= EXPECTED_MOCK_BATCH_COUNT && coalOrder) {
    console.log(`Demo data already present (${batchCount} cargo batches)`);
    return;
  }

  console.log(
    batchCount > 0
      ? `Demo data outdated (${batchCount}/${EXPECTED_MOCK_BATCH_COUNT} batches), re-seeding...`
      : 'Demo cargo data missing, running full seed...'
  );
  await runDemoSeed();
}

const isDirectRun = process.argv[1]?.replace(/\\/g, '/').endsWith('prisma/ensureDemoData.ts');

if (isDirectRun) {
  ensureDemoData()
    .catch((error) => {
      console.error(error);
      process.exit(1);
    })
    .finally(() => prisma.$disconnect());
}
