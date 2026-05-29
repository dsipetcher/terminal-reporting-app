import prisma from './prisma';

export type IlsFunction =
  | 'PLANNING'
  | 'REGULATION'
  | 'CONTROL'
  | 'ANALYSIS'
  | 'ACCOUNTING';

export async function logInfoFlow(params: {
  ilsFunction: IlsFunction;
  eventType: string;
  entityType: string;
  entityId?: number;
  message: string;
  orderId?: number;
  userId?: number;
}) {
  return prisma.infoFlowEvent.create({
    data: {
      ilsFunction: params.ilsFunction,
      eventType: params.eventType,
      entityType: params.entityType,
      entityId: params.entityId,
      message: params.message,
      orderId: params.orderId,
      userId: params.userId,
    },
  });
}
