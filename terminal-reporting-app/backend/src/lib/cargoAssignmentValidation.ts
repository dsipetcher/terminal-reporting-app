import type { PrismaClient } from '@prisma/client';

type PrismaLike = Pick<PrismaClient, 'wagon' | 'container'>;

export async function validateWagonContainerAssignment(
  db: PrismaLike,
  containerId: number | null | undefined,
  wagonId?: number | null
): Promise<string | null> {
  if (!containerId) return null;

  const cid = Number(containerId);
  const conflict = await db.wagon.findFirst({
    where: {
      containerId: cid,
      ...(wagonId ? { NOT: { id: Number(wagonId) } } : {}),
    },
    select: { number: true },
  });
  if (conflict) {
    return `Партия уже привязана к вагону №${conflict.number}`;
  }

  if (wagonId) {
    const wagon = await db.wagon.findUnique({
      where: { id: Number(wagonId) },
      select: { containerId: true, number: true },
    });
    if (wagon?.containerId && wagon.containerId !== cid) {
      return `Вагон №${wagon.number} уже привязан к другой партии`;
    }
  }

  return null;
}

export async function validateContainerVesselAssignment(
  db: PrismaLike,
  containerId: number,
  nextVesselCallId: number | null | undefined
): Promise<string | null> {
  if (!nextVesselCallId) return null;

  const container = await db.container.findUnique({
    where: { id: containerId },
    select: { vesselCallId: true },
  });
  if (!container) return 'Партия не найдена';

  const nextId = Number(nextVesselCallId);
  if (container.vesselCallId && container.vesselCallId !== nextId) {
    return 'У партии уже назначен судозаход';
  }

  return null;
}
