import express from 'express';
import prisma from '../lib/prisma';
import { logInfoFlow } from '../lib/ils';
import { deleteOrderUploads } from '../lib/orderDocuments';

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const { status, managementLevel, orderType } = req.query;
    const where: Record<string, string> = {};
    if (status && status !== 'ALL') where.status = String(status);
    if (managementLevel && managementLevel !== 'ALL') {
      where.managementLevel = String(managementLevel);
    }
    if (orderType && orderType !== 'ALL') where.orderType = String(orderType);

    const orders = await prisma.logisticsOrder.findMany({
      where,
      include: {
        counterparty: true,
        vesselCall: { include: { vessel: true, berth: true } },
        containers: { select: { id: true, containerNumber: true, status: true } },
        _count: { select: { materialFlows: true, infoEvents: true, documents: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
    res.json(orders);
  } catch (error) {
    console.error('Error fetching logistics orders:', error);
    res.status(500).json({ error: 'Failed to fetch logistics orders' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const order = await prisma.logisticsOrder.findUnique({
      where: { id: Number(req.params.id) },
      include: {
        counterparty: true,
        vesselCall: { include: { vessel: true, berth: true } },
        containers: true,
        materialFlows: { include: { container: true }, orderBy: { performedAt: 'desc' } },
        infoEvents: { include: { user: { select: { id: true, username: true } } }, orderBy: { createdAt: 'desc' } },
        documents: { orderBy: { uploadedAt: 'desc' } },
      },
    });
    if (!order) return res.status(404).json({ error: 'Order not found' });
    res.json(order);
  } catch (error) {
    console.error('Error fetching logistics order:', error);
    res.status(500).json({ error: 'Failed to fetch logistics order' });
  }
});

router.post('/', async (req, res) => {
  try {
    const {
      orderNumber,
      orderType,
      managementLevel,
      status,
      counterpartyId,
      cargoDescription,
      cargoWeight,
      origin,
      destination,
      plannedStart,
      plannedEnd,
      vesselCallId,
      notes,
      containerIds,
    } = req.body;

    if (!orderNumber || !orderType || !managementLevel) {
      return res.status(400).json({ error: 'orderNumber, orderType and managementLevel are required' });
    }

    const order = await prisma.logisticsOrder.create({
      data: {
        orderNumber,
        orderType,
        managementLevel,
        status: status || 'DRAFT',
        counterpartyId: counterpartyId ? Number(counterpartyId) : undefined,
        cargoDescription,
        cargoWeight: cargoWeight != null ? Number(cargoWeight) : undefined,
        origin,
        destination,
        plannedStart: plannedStart ? new Date(plannedStart) : undefined,
        plannedEnd: plannedEnd ? new Date(plannedEnd) : undefined,
        vesselCallId: vesselCallId ? Number(vesselCallId) : undefined,
        notes,
      },
      include: { counterparty: true, vesselCall: { include: { vessel: true } } },
    });

    if (Array.isArray(containerIds) && containerIds.length > 0) {
      await prisma.container.updateMany({
        where: { id: { in: containerIds.map(Number) } },
        data: { logisticsOrderId: order.id },
      });
    }

    await logInfoFlow({
      ilsFunction: 'PLANNING',
      eventType: 'CREATE',
      entityType: 'LOGISTICS_ORDER',
      entityId: order.id,
      orderId: order.id,
      message: `Создан логистический заказ ${order.orderNumber}`,
    });

    res.status(201).json(order);
  } catch (error) {
    console.error('Error creating logistics order:', error);
    res.status(500).json({ error: 'Failed to create logistics order' });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const id = Number(req.params.id);
    const {
      orderType,
      managementLevel,
      status,
      counterpartyId,
      cargoDescription,
      cargoWeight,
      origin,
      destination,
      plannedStart,
      plannedEnd,
      actualStart,
      actualEnd,
      vesselCallId,
      notes,
    } = req.body;

    const order = await prisma.logisticsOrder.update({
      where: { id },
      data: {
        orderType,
        managementLevel,
        status,
        counterpartyId: counterpartyId != null ? Number(counterpartyId) : undefined,
        cargoDescription,
        cargoWeight: cargoWeight != null ? Number(cargoWeight) : undefined,
        origin,
        destination,
        plannedStart: plannedStart ? new Date(plannedStart) : undefined,
        plannedEnd: plannedEnd ? new Date(plannedEnd) : undefined,
        actualStart: actualStart ? new Date(actualStart) : undefined,
        actualEnd: actualEnd ? new Date(actualEnd) : undefined,
        vesselCallId: vesselCallId != null ? Number(vesselCallId) : undefined,
        notes,
      },
      include: { counterparty: true, vesselCall: { include: { vessel: true } } },
    });

    const ilsFunction =
      order.managementLevel === 'PLANNING'
        ? 'PLANNING'
        : order.managementLevel === 'DISPATCH'
          ? 'REGULATION'
          : 'CONTROL';

    await logInfoFlow({
      ilsFunction,
      eventType: 'UPDATE',
      entityType: 'LOGISTICS_ORDER',
      entityId: order.id,
      orderId: order.id,
      message: `Обновлён заказ ${order.orderNumber}`,
    });

    res.json(order);
  } catch (error) {
    console.error('Error updating logistics order:', error);
    res.status(500).json({ error: 'Failed to update logistics order' });
  }
});

router.patch('/:id/status', async (req, res) => {
  try {
    const id = Number(req.params.id);
    const { status } = req.body;
    if (!status) return res.status(400).json({ error: 'status is required' });

    const order = await prisma.logisticsOrder.update({
      where: { id },
      data: {
        status,
        actualStart: status === 'IN_PROGRESS' ? new Date() : undefined,
        actualEnd: status === 'COMPLETED' ? new Date() : undefined,
      },
      include: { counterparty: true },
    });

    await logInfoFlow({
      ilsFunction: 'REGULATION',
      eventType: 'STATUS_CHANGE',
      entityType: 'LOGISTICS_ORDER',
      entityId: order.id,
      orderId: order.id,
      message: `Статус заказа ${order.orderNumber}: ${status}`,
    });

    res.json(order);
  } catch (error) {
    console.error('Error updating order status:', error);
    res.status(500).json({ error: 'Failed to update order status' });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const id = Number(req.params.id);
    await prisma.container.updateMany({ where: { logisticsOrderId: id }, data: { logisticsOrderId: null } });
    await prisma.logisticsOrder.delete({ where: { id } });
    deleteOrderUploads(id);
    res.status(204).send();
  } catch (error) {
    console.error('Error deleting logistics order:', error);
    res.status(500).json({ error: 'Failed to delete logistics order' });
  }
});

export default router;
