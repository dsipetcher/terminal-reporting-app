import type { PrismaClient } from '@prisma/client';

/** Unified carrier stages for wagons and vessel calls. */
export const TRANSPORT_CARRIER_STATUS_ORDER = [
  'EN_ROUTE',
  'ARRIVED',
  'UNLOADING',
  'DEPARTED',
] as const;

export const VESSEL_CALL_STATUS_ORDER = [
  ...TRANSPORT_CARRIER_STATUS_ORDER,
  'CANCELLED',
] as const;

export const TRANSPORT_CARRIER_STATUS_LABELS: Record<string, string> = {
  EN_ROUTE: 'В пути в терминал',
  ARRIVED: 'Прибыл',
  UNLOADING: 'Разгрузка',
  DEPARTED: 'Убыл',
  CANCELLED: 'Отменён',
};

const LEGACY_STATUS_MAP: Record<string, string> = {
  EXPECTED: 'EN_ROUTE',
  LOADING: 'UNLOADING',
  BERTHED: 'ARRIVED',
  IN_OPERATION: 'UNLOADING',
};

export function normalizeTransportStatus(status: string): string {
  return LEGACY_STATUS_MAP[status] ?? status;
}

export function transportStatusLabel(status: string): string {
  return TRANSPORT_CARRIER_STATUS_LABELS[normalizeTransportStatus(status)] ?? status;
}

function statusRank(order: readonly string[], status: string): number {
  const normalized = normalizeTransportStatus(status);
  const idx = order.indexOf(normalized);
  return idx === -1 ? -1 : idx;
}

export function shouldAdvanceTransportStatus(
  current: string,
  next: string,
  order: readonly string[]
): boolean {
  const cur = normalizeTransportStatus(current);
  const nxt = normalizeTransportStatus(next);
  if (cur === 'CANCELLED') return false;
  if (nxt === 'DEPARTED') return cur !== 'DEPARTED' && cur !== 'CANCELLED';
  return statusRank(order, nxt) > statusRank(order, cur);
}

/** Wagon status by export route stage. */
export function wagonStatusForStage(stageType: string): string | null {
  switch (stageType) {
    case 'SUPPLIER':
      return 'EN_ROUTE';
    case 'RAIL_STATION':
      return 'ARRIVED';
    case 'WAREHOUSE':
      return 'UNLOADING';
    case 'BERTH':
    case 'SHIP':
    case 'PORT':
    case 'DELIVERED':
      return 'DEPARTED';
    default:
      return null;
  }
}

/** Vessel call status by export route stage. */
export function vesselCallStatusForStage(stageType: string): string | null {
  switch (stageType) {
    case 'BERTH':
      return 'ARRIVED';
    case 'SHIP':
      return 'UNLOADING';
    case 'PORT':
    case 'DELIVERED':
      return 'DEPARTED';
    default:
      return null;
  }
}

type PrismaLike = Pick<
  PrismaClient,
  | 'container'
  | 'wagon'
  | 'vesselCall'
  | 'vessel'
  | 'logisticsOrder'
  | 'routeStage'
  | 'cargoTracking'
>;

/** Remove wagons once cargo leaves the rail front (stage BERTH+). */
export async function purgeWagonsForContainer(
  db: Pick<PrismaClient, 'wagon'>,
  containerId: number
): Promise<void> {
  await db.wagon.deleteMany({ where: { containerId } });
}

/**
 * After export chain completion: keep route snapshot, drop live transport links.
 * Deletes vessel call and vessel when no active batches remain on the call.
 */
export async function releaseTransportAfterDelivery(
  db: PrismaLike,
  containerId: number
): Promise<void> {
  const container = await db.container.findUnique({
    where: { id: containerId },
    include: {
      vesselCall: { include: { vessel: true } },
    },
  });
  if (!container) return;

  const callId = container.vesselCallId;
  if (!callId || !container.vesselCall) {
    if (callId) {
      await db.container.update({
        where: { id: containerId },
        data: { vesselCallId: null },
      });
    }
    return;
  }

  const { vessel, voyageNumber } = container.vesselCall;
  const shipLabel = `${vessel.name} · рейс ${voyageNumber}`;

  const trackings = await db.cargoTracking.findMany({
    where: { containerId },
    include: {
      route: {
        include: {
          stages: { where: { stageType: 'SHIP' } },
        },
      },
    },
  });

  for (const tracking of trackings) {
    for (const stage of tracking.route?.stages ?? []) {
      await db.routeStage.update({
        where: { id: stage.id },
        data: { locationName: shipLabel },
      });
    }
  }

  await db.container.update({
    where: { id: containerId },
    data: { vesselCallId: null },
  });

  await db.logisticsOrder.updateMany({
    where: { vesselCallId: callId },
    data: { vesselCallId: null },
  });

  const activeOnCall = await db.container.count({
    where: {
      vesselCallId: callId,
      status: { not: 'DELIVERED' },
    },
  });

  if (activeOnCall > 0) return;

  const call = await db.vesselCall.findUnique({
    where: { id: callId },
    select: { vesselId: true },
  });
  if (!call) return;

  await db.vesselCall.delete({ where: { id: callId } });

  const remainingCalls = await db.vesselCall.count({
    where: { vesselId: call.vesselId },
  });
  if (remainingCalls === 0) {
    await db.vessel.delete({ where: { id: call.vesselId } });
  }
}
