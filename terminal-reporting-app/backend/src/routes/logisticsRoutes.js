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
const exportRouteStages_1 = require("../lib/exportRouteStages");
const cargoStatusFromStage_1 = require("../lib/cargoStatusFromStage");
const syncTransportWithCargoStage_1 = require("../lib/syncTransportWithCargoStage");
const router = express_1.default.Router();
const routeInclude = {
    order: { select: { id: true, orderNumber: true, status: true } },
    stages: { orderBy: { sequence: 'asc' } },
    trackings: {
        include: {
            container: {
                select: {
                    id: true,
                    containerNumber: true,
                    status: true,
                    cargoCategory: true,
                    supplierName: true,
                    quantityTons: true,
                    cargoDescription: true,
                },
            },
            currentStage: true,
            events: { orderBy: { eventAt: 'desc' }, take: 5 },
        },
    },
};
router.get('/', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { status, orderId } = req.query;
        const where = {};
        if (status && status !== 'ALL')
            where.status = String(status);
        if (orderId)
            where.orderId = Number(orderId);
        const routes = yield prisma_1.default.logisticsRoute.findMany({
            where,
            include: {
                order: { select: { orderNumber: true } },
                stages: { orderBy: { sequence: 'asc' } },
                _count: { select: { trackings: true, stages: true } },
            },
            orderBy: { updatedAt: 'desc' },
        });
        res.json(routes);
    }
    catch (error) {
        console.error('Error fetching routes:', error);
        res.status(500).json({ error: 'Failed to fetch routes' });
    }
}));
function trackByBatchNumber(batchNumber) {
    return __awaiter(this, void 0, void 0, function* () {
        const container = yield prisma_1.default.container.findUnique({
            where: { containerNumber: batchNumber.toUpperCase() },
        });
        if (!container)
            return null;
        const trackings = yield prisma_1.default.cargoTracking.findMany({
            where: { containerId: container.id },
            include: {
                route: {
                    include: {
                        stages: { orderBy: { sequence: 'asc' } },
                        order: { select: { orderNumber: true } },
                    },
                },
                currentStage: true,
                events: { orderBy: { eventAt: 'desc' }, take: 20 },
            },
            orderBy: { updatedAt: 'desc' },
        });
        return { container, trackings };
    });
}
router.get('/track/batch/:batchNumber', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const result = yield trackByBatchNumber(req.params.batchNumber);
        if (!result)
            return res.status(404).json({ error: 'Cargo batch not found' });
        res.json(result);
    }
    catch (error) {
        console.error('Error tracking batch:', error);
        res.status(500).json({ error: 'Failed to track cargo batch' });
    }
}));
router.get('/track/container/:containerNumber', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const result = yield trackByBatchNumber(req.params.containerNumber);
        if (!result)
            return res.status(404).json({ error: 'Cargo batch not found' });
        res.json(result);
    }
    catch (error) {
        console.error('Error tracking batch:', error);
        res.status(500).json({ error: 'Failed to track cargo batch' });
    }
}));
router.get('/:id', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const route = yield prisma_1.default.logisticsRoute.findUnique({
            where: { id: Number(req.params.id) },
            include: routeInclude,
        });
        if (!route)
            return res.status(404).json({ error: 'Route not found' });
        res.json(route);
    }
    catch (error) {
        console.error('Error fetching route:', error);
        res.status(500).json({ error: 'Failed to fetch route' });
    }
}));
router.post('/', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const { routeNumber, name, orderId, origin, destination, status, stages, routeKind } = req.body;
        if (!routeNumber || !origin || !destination) {
            return res.status(400).json({ error: 'routeNumber, origin and destination are required' });
        }
        const stagePayload = Array.isArray(stages) && stages.length > 0
            ? stages.map((s, i) => ({
                sequence: Number(s.sequence) || i + 1,
                stageType: String(s.stageType),
                locationCode: String(s.locationCode),
                locationName: String(s.locationName),
                transportMode: s.transportMode ? String(s.transportMode) : undefined,
                plannedAt: s.plannedAt ? new Date(String(s.plannedAt)) : undefined,
                status: String(s.status || (i === 0 ? 'CURRENT' : 'PENDING')),
            }))
            : (0, exportRouteStages_1.buildExportRouteStages)({
                supplierName: origin,
                destPortCode: destination,
                destPortName: `Порт ${destination}`,
            });
        const route = yield prisma_1.default.logisticsRoute.create({
            data: {
                routeNumber,
                name: name || `Экспорт: ${origin} → ${destination}`,
                orderId: orderId ? Number(orderId) : undefined,
                origin,
                destination,
                routeKind: routeKind || 'EXPORT',
                status: status || 'PLANNED',
                stages: { create: stagePayload },
            },
            include: routeInclude,
        });
        yield (0, ils_1.logInfoFlow)({
            ilsFunction: 'PLANNING',
            eventType: 'CREATE',
            entityType: 'LOGISTICS_ROUTE',
            entityId: route.id,
            orderId: (_a = route.orderId) !== null && _a !== void 0 ? _a : undefined,
            message: `Создан маршрут ${route.routeNumber}: ${route.origin} → ${route.destination}`,
        });
        res.status(201).json(route);
    }
    catch (error) {
        console.error('Error creating route:', error);
        res.status(500).json({ error: 'Failed to create route' });
    }
}));
router.post('/:id/trackings', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const routeId = Number(req.params.id);
        const { containerId, notes } = req.body;
        if (!containerId)
            return res.status(400).json({ error: 'containerId is required' });
        const route = yield prisma_1.default.logisticsRoute.findUnique({
            where: { id: routeId },
            include: { stages: { orderBy: { sequence: 'asc' }, take: 1 } },
        });
        if (!route)
            return res.status(404).json({ error: 'Route not found' });
        const firstStage = route.stages[0];
        const tracking = yield prisma_1.default.cargoTracking.create({
            data: {
                containerId: Number(containerId),
                routeId,
                currentStageId: firstStage === null || firstStage === void 0 ? void 0 : firstStage.id,
                status: firstStage ? 'AT_STAGE' : 'REGISTERED',
                notes,
                events: firstStage
                    ? {
                        create: {
                            toStageId: firstStage.id,
                            description: `Груз зарегистрирован на этапе: ${firstStage.locationName}`,
                        },
                    }
                    : undefined,
            },
            include: {
                container: true,
                currentStage: true,
                route: { include: { stages: { orderBy: { sequence: 'asc' } } } },
            },
        });
        if (route.status === 'PLANNED') {
            yield prisma_1.default.logisticsRoute.update({
                where: { id: routeId },
                data: { status: 'ACTIVE' },
            });
        }
        if (firstStage) {
            const initialCargoStatus = (0, cargoStatusFromStage_1.cargoStatusFromStageType)(firstStage.stageType);
            yield prisma_1.default.container.update({
                where: { id: Number(containerId) },
                data: { status: initialCargoStatus },
            });
            yield (0, syncTransportWithCargoStage_1.syncTransportWithCargoStage)(prisma_1.default, Number(containerId), firstStage.stageType);
        }
        yield (0, ils_1.logInfoFlow)({
            ilsFunction: 'CONTROL',
            eventType: 'CREATE',
            entityType: 'CARGO_TRACKING',
            entityId: tracking.id,
            orderId: (_a = route.orderId) !== null && _a !== void 0 ? _a : undefined,
            message: `На маршрут ${route.routeNumber} поставлен на отслеживание контейнер ${tracking.container.containerNumber}`,
        });
        res.status(201).json(tracking);
    }
    catch (error) {
        console.error('Error creating tracking:', error);
        res.status(500).json({ error: 'Failed to register cargo on route' });
    }
}));
router.patch('/trackings/:trackingId/advance', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c, _d, _e, _f, _g, _h, _j;
    try {
        const trackingId = Number(req.params.trackingId);
        const tracking = yield prisma_1.default.cargoTracking.findUnique({
            where: { id: trackingId },
            include: {
                route: { include: { stages: { orderBy: { sequence: 'asc' } } } },
                currentStage: true,
                container: true,
            },
        });
        if (!tracking)
            return res.status(404).json({ error: 'Tracking not found' });
        const stages = tracking.route.stages;
        const currentSeq = (_b = (_a = tracking.currentStage) === null || _a === void 0 ? void 0 : _a.sequence) !== null && _b !== void 0 ? _b : 0;
        const nextStage = stages.find((s) => s.sequence > currentSeq && s.status !== 'SKIPPED');
        if (!nextStage) {
            const updated = yield prisma_1.default.cargoTracking.update({
                where: { id: trackingId },
                data: {
                    status: 'DELIVERED',
                    lastEventAt: new Date(),
                    events: {
                        create: {
                            fromStageId: (_c = tracking.currentStageId) !== null && _c !== void 0 ? _c : undefined,
                            description: 'Груз доставлен в конечную точку',
                        },
                    },
                },
                include: { container: true, currentStage: true, route: true, events: { take: 10, orderBy: { eventAt: 'desc' } } },
            });
            yield prisma_1.default.container.update({
                where: { id: tracking.containerId },
                data: { status: 'DELIVERED' },
            });
            yield (0, syncTransportWithCargoStage_1.syncTransportWithCargoStage)(prisma_1.default, tracking.containerId, 'DELIVERED');
            const allDelivered = yield prisma_1.default.cargoTracking.count({
                where: { routeId: tracking.routeId, status: { not: 'DELIVERED' } },
            });
            if (allDelivered === 0) {
                yield prisma_1.default.logisticsRoute.update({
                    where: { id: tracking.routeId },
                    data: { status: 'COMPLETED' },
                });
            }
            yield (0, ils_1.logInfoFlow)({
                ilsFunction: 'ACCOUNTING',
                eventType: 'STATUS_CHANGE',
                entityType: 'CARGO_TRACKING',
                entityId: trackingId,
                orderId: (_d = tracking.route.orderId) !== null && _d !== void 0 ? _d : undefined,
                message: `Партия ${tracking.container.containerNumber} доставлена (${tracking.route.routeNumber})`,
            });
            return res.json(updated);
        }
        if (tracking.currentStageId) {
            yield prisma_1.default.routeStage.update({
                where: { id: tracking.currentStageId },
                data: { status: 'COMPLETED', actualAt: new Date() },
            });
        }
        yield prisma_1.default.routeStage.update({
            where: { id: nextStage.id },
            data: { status: 'CURRENT', actualAt: (_e = nextStage.actualAt) !== null && _e !== void 0 ? _e : new Date() },
        });
        const cargoStatus = (0, cargoStatusFromStage_1.cargoStatusFromStageType)(nextStage.stageType);
        const updated = yield prisma_1.default.cargoTracking.update({
            where: { id: trackingId },
            data: {
                currentStageId: nextStage.id,
                status: 'AT_STAGE',
                lastEventAt: new Date(),
                events: {
                    create: {
                        fromStageId: (_f = tracking.currentStageId) !== null && _f !== void 0 ? _f : undefined,
                        toStageId: nextStage.id,
                        description: `Перемещение: ${(_h = (_g = tracking.currentStage) === null || _g === void 0 ? void 0 : _g.locationName) !== null && _h !== void 0 ? _h : 'старт'} → ${nextStage.locationName}`,
                    },
                },
            },
            include: {
                container: true,
                currentStage: true,
                route: { include: { stages: { orderBy: { sequence: 'asc' } } } },
                events: { orderBy: { eventAt: 'desc' }, take: 10 },
            },
        });
        yield prisma_1.default.container.update({
            where: { id: tracking.containerId },
            data: { status: cargoStatus },
        });
        yield (0, syncTransportWithCargoStage_1.syncTransportWithCargoStage)(prisma_1.default, tracking.containerId, nextStage.stageType);
        yield (0, ils_1.logInfoFlow)({
            ilsFunction: 'CONTROL',
            eventType: 'STATUS_CHANGE',
            entityType: 'CARGO_TRACKING',
            entityId: trackingId,
            orderId: (_j = tracking.route.orderId) !== null && _j !== void 0 ? _j : undefined,
            message: `Партия ${tracking.container.containerNumber}: ${cargoStatus} — «${nextStage.locationName}» (${tracking.route.routeNumber})`,
        });
        res.json(updated);
    }
    catch (error) {
        console.error('Error advancing tracking:', error);
        res.status(500).json({ error: 'Failed to advance cargo on route' });
    }
}));
router.delete('/:id', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        yield prisma_1.default.logisticsRoute.delete({ where: { id: Number(req.params.id) } });
        res.status(204).send();
    }
    catch (error) {
        console.error('Error deleting route:', error);
        res.status(500).json({ error: 'Failed to delete route' });
    }
}));
exports.default = router;
