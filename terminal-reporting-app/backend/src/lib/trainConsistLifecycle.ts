import type { PrismaClient } from '@prisma/client';
import { shouldAdvanceTransportStatus } from './transportLifecycle';

/** Входящий состав: от прибытия до разгрузки. */
export const INBOUND_CONSIST_STATUS_ORDER = ['EN_ROUTE', 'ARRIVED', 'UNLOADING'] as const;

/** Исходящий состав: формирование из вагонов в парке. */
export const OUTBOUND_CONSIST_STATUS_ORDER = ['FORMING', 'DEPARTED'] as const;

export const TRAIN_CONSIST_STATUS_LABELS: Record<string, string> = {
  EN_ROUTE: 'В пути в терминал',
  ARRIVED: 'Прибыл',
  UNLOADING: 'Разгрузка',
  FORMING: 'Формирование',
  DEPARTED: 'Убыл',
};

/** Inbound consist status driven by cargo export route stage. */
export function trainConsistStatusForStage(stageType: string): string | null {
  switch (stageType) {
    case 'SUPPLIER':
      return 'EN_ROUTE';
    case 'RAIL_STATION':
      return 'ARRIVED';
    case 'WAREHOUSE':
      return 'UNLOADING';
    default:
      return null;
  }
}

export function isPastUnloadingStage(stageType: string): boolean {
  return ['BERTH', 'SHIP', 'PORT', 'DELIVERED'].includes(stageType);
}

type PrismaLike = Pick<PrismaClient, 'wagon' | 'trainConsist'>;

export async function syncWagonsToConsistStatus(
  db: PrismaLike,
  consistId: number,
  status: string,
  now: Date
): Promise<void> {
  const wagonUpdate: Record<string, unknown> = { status };
  if (status === 'ARRIVED') {
    wagonUpdate.arrivalAt = now;
  }
  if (status === 'DEPARTED') {
    wagonUpdate.departureAt = now;
  }
  await db.wagon.updateMany({
    where: { trainConsistId: consistId },
    data: wagonUpdate,
  });
}

export async function applyTrainConsistStatus(
  db: PrismaLike,
  consistId: number,
  status: string,
  extra?: { destination?: string; formedAt?: Date; departureAt?: Date }
): Promise<void> {
  const now = new Date();
  const consist = await db.trainConsist.findUnique({
    where: { id: consistId },
    select: { id: true, status: true, direction: true },
  });
  if (!consist) return;

  const order =
    consist.direction === 'OUTBOUND'
      ? OUTBOUND_CONSIST_STATUS_ORDER
      : INBOUND_CONSIST_STATUS_ORDER;

  if (
    !shouldAdvanceTransportStatus(consist.status, status, order) &&
    consist.status !== status
  ) {
    return;
  }

  await db.trainConsist.update({
    where: { id: consistId },
    data: {
      status,
      ...(status === 'FORMING' && extra?.destination
        ? { destination: extra.destination, formedAt: extra.formedAt ?? now }
        : {}),
      ...(status === 'DEPARTED' ? { departureAt: extra?.departureAt ?? now } : {}),
    },
  });

  await syncWagonsToConsistStatus(db, consistId, status, now);
}

/** После разгрузки: состав удаляется, вагоны остаются в парке без состава. */
export async function disbandConsistAfterUnloading(
  db: PrismaLike,
  consistId: number
): Promise<void> {
  await db.wagon.updateMany({
    where: { trainConsistId: consistId },
    data: {
      status: 'IN_PARK',
      trainConsistId: null,
      containerId: null,
      cargo: null,
      cargoWeight: null,
    },
  });
  await db.trainConsist.delete({ where: { id: consistId } });
}

/** Исходящий состав убыл — удаляем состав и все его вагоны. */
export async function purgeOutboundConsist(db: PrismaLike, consistId: number): Promise<void> {
  await db.wagon.deleteMany({ where: { trainConsistId: consistId } });
  await db.trainConsist.delete({ where: { id: consistId } });
}

export async function syncTrainConsistWithCargoStage(
  db: PrismaLike,
  containerId: number,
  stageType: string
): Promise<void> {
  const wagon = await db.wagon.findFirst({
    where: { containerId },
    select: { trainConsistId: true },
  });
  if (!wagon?.trainConsistId) return;

  const consist = await db.trainConsist.findUnique({
    where: { id: wagon.trainConsistId },
    select: { id: true, status: true, direction: true },
  });
  if (!consist || consist.direction !== 'INBOUND') return;

  if (isPastUnloadingStage(stageType)) {
    await disbandConsistAfterUnloading(db, consist.id);
    return;
  }

  const nextStatus = trainConsistStatusForStage(stageType);
  if (!nextStatus) return;

  if (
    !shouldAdvanceTransportStatus(consist.status, nextStatus, INBOUND_CONSIST_STATUS_ORDER)
  ) {
    return;
  }

  await applyTrainConsistStatus(db, consist.id, nextStatus);
}
