import type { PrismaClient } from '@prisma/client';
import {
  shouldAdvanceTransportStatus,
  VESSEL_CALL_STATUS_ORDER,
  vesselCallStatusForStage,
} from './transportLifecycle';
import { syncTrainConsistWithCargoStage } from './trainConsistLifecycle';

export {
  wagonStatusForStage,
  vesselCallStatusForStage,
  TRANSPORT_CARRIER_STATUS_LABELS,
  transportStatusLabel,
  normalizeTransportStatus,
} from './transportLifecycle';

export { trainConsistStatusForStage, TRAIN_CONSIST_STATUS_LABELS } from './trainConsistLifecycle';

type PrismaLike = Pick<PrismaClient, 'container' | 'wagon' | 'vesselCall' | 'trainConsist'>;

export async function syncTransportWithCargoStage(
  db: PrismaLike,
  containerId: number,
  stageType: string
): Promise<void> {
  const container = await db.container.findUnique({
    where: { id: containerId },
    select: { vesselCallId: true },
  });
  if (!container) return;

  await syncTrainConsistWithCargoStage(db, containerId, stageType);

  const vesselStatus = vesselCallStatusForStage(stageType);
  if (vesselStatus && container.vesselCallId) {
    const call = await db.vesselCall.findUnique({
      where: { id: container.vesselCallId },
      select: { id: true, status: true, ata: true },
    });
    if (
      call &&
      shouldAdvanceTransportStatus(call.status, vesselStatus, VESSEL_CALL_STATUS_ORDER)
    ) {
      const now = new Date();
      await db.vesselCall.update({
        where: { id: call.id },
        data: {
          status: vesselStatus,
          ...(vesselStatus === 'ARRIVED' ? { ata: call.ata ?? now } : {}),
          ...(vesselStatus === 'DEPARTED' ? { atd: now } : {}),
        },
      });
    }
  }
}
