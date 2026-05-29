"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const prisma_1 = __importDefault(require("../lib/prisma"));
const ils_1 = require("../lib/ils");
const router = express_1.default.Router();
router.get('/', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { status, managementLevel, orderType } = req.query;
        const where = {};
        if (status && status !== 'ALL')
            where.status = String(status);
        if (managementLevel && managementLevel !== 'ALL') {
            where.managementLevel = String(managementLevel);
        }
        if (orderType && orderType !== 'ALL')
            where.orderType = String(orderType);
        const orders = yield prisma_1.default.logisticsOrder.findMany({
            where,
            include: {
                counterparty: true,
                vesselCall: { include: { vessel: true, berth: true } },
                containers: { select: { id: true, containerNumber: true, status: true } },
                _count: { select: { materialFlows: true, infoEvents: true } },
            },
            orderBy: { createdAt: 'desc' },
        });
        res.json(orders);
    }
    catch (error) {
        console.error('Error fetching logistics orders:', error);
        res.status(500).json({ error: 'Failed to fetch logistics orders' });
    }
}));
router.get('/:id', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const order = yield prisma_1.default.logisticsOrder.findUnique({
            where: { id: Number(req.params.id) },
            include: {
                counterparty: true,
                vesselCall: { include: { vessel: true, berth: true } },
                containers: true,
                materialFlows: { include: { container: true }, orderBy: { performedAt: 'desc' } },
                infoEvents: { include: { user: { select: { id: true, username: true } } }, orderBy: { createdAt: 'desc' } },
            },
        });
        if (!order)
            return res.status(404).json({ error: 'Order not found' });
        res.json(order);
    }
    catch (error) {
        console.error('Error fetching logistics order:', error);
        res.status(500).json({ error: 'Failed to fetch logistics order' });
    }
}));
router.post('/', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { orderNumber, orderType, managementLevel, status, counterpartyId, cargoDescription, cargoWeight, origin, destination, plannedStart, plannedEnd, vesselCallId, notes, containerIds, } = req.body;
        if (!orderNumber || !orderType || !managementLevel) {
            return res.status(400).json({ error: 'orderNumber, orderType and managementLevel are required' });
        }
        const order = yield prisma_1.default.logisticsOrder.create({
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
            yield prisma_1.default.container.updateMany({
                where: { id: { in: containerIds.map(Number) } },
                data: { logisticsOrderId: order.id },
            });
        }
        yield (0, ils_1.logInfoFlow)({
            ilsFunction: 'PLANNING',
            eventType: 'CREATE',
            entityType: 'LOGISTICS_ORDER',
            entityId: order.id,
            orderId: order.id,
            message: `Создан логистический заказ ${order.orderNumber}`,
        });
        res.status(201).json(order);
    }
    catch (error) {
        console.error('Error creating logistics order:', error);
        res.status(500).json({ error: 'Failed to create logistics order' });
    }
}));
router.put('/:id', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const id = Number(req.params.id);
        const { orderType, managementLevel, status, counterpartyId, cargoDescription, cargoWeight, origin, destination, plannedStart, plannedEnd, actualStart, actualEnd, vesselCallId, notes, } = req.body;
        const order = yield prisma_1.default.logisticsOrder.update({
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
        const ilsFunction = order.managementLevel === 'PLANNING'
            ? 'PLANNING'
            : order.managementLevel === 'DISPATCH'
                ? 'REGULATION'
                : 'CONTROL';
        yield (0, ils_1.logInfoFlow)({
            ilsFunction,
            eventType: 'UPDATE',
            entityType: 'LOGISTICS_ORDER',
            entityId: order.id,
            orderId: order.id,
            message: `Обновлён заказ ${order.orderNumber}`,
        });
        res.json(order);
    }
    catch (error) {
        console.error('Error updating logistics order:', error);
        res.status(500).json({ error: 'Failed to update logistics order' });
    }
}));
router.patch('/:id/status', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const id = Number(req.params.id);
        const { status } = req.body;
        if (!status)
            return res.status(400).json({ error: 'status is required' });
        const order = yield prisma_1.default.logisticsOrder.update({
            where: { id },
            data: {
                status,
                actualStart: status === 'IN_PROGRESS' ? new Date() : undefined,
                actualEnd: status === 'COMPLETED' ? new Date() : undefined,
            },
            include: { counterparty: true },
        });
        yield (0, ils_1.logInfoFlow)({
            ilsFunction: 'REGULATION',
            eventType: 'STATUS_CHANGE',
            entityType: 'LOGISTICS_ORDER',
            entityId: order.id,
            orderId: order.id,
            message: `Статус заказа ${order.orderNumber}: ${status}`,
        });
        res.json(order);
    }
    catch (error) {
        console.error('Error updating order status:', error);
        res.status(500).json({ error: 'Failed to update order status' });
    }
}));
router.delete('/:id', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const id = Number(req.params.id);
        yield prisma_1.default.container.updateMany({ where: { logisticsOrderId: id }, data: { logisticsOrderId: null } });
        yield prisma_1.default.logisticsOrder.delete({ where: { id } });
        res.status(204).send();
    }
    catch (error) {
        console.error('Error deleting logistics order:', error);
        res.status(500).json({ error: 'Failed to delete logistics order' });
    }
}));
exports.default = router;
