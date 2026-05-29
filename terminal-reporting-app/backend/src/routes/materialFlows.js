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
        const { orderId, transportMode } = req.query;
        const where = {};
        if (orderId)
            where.orderId = Number(orderId);
        if (transportMode && transportMode !== 'ALL')
            where.transportMode = String(transportMode);
        const flows = yield prisma_1.default.materialFlow.findMany({
            where,
            include: {
                order: { select: { id: true, orderNumber: true } },
                container: { select: { id: true, containerNumber: true } },
            },
            orderBy: { performedAt: 'desc' },
            take: 200,
        });
        res.json(flows);
    }
    catch (error) {
        console.error('Error fetching material flows:', error);
        res.status(500).json({ error: 'Failed to fetch material flows' });
    }
}));
router.post('/', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const { orderId, flowType, transportMode, quantity, unit, fromLocation, toLocation, containerId, performedAt, description, } = req.body;
        if (!flowType || !transportMode) {
            return res.status(400).json({ error: 'flowType and transportMode are required' });
        }
        const flow = yield prisma_1.default.materialFlow.create({
            data: {
                orderId: orderId ? Number(orderId) : undefined,
                flowType,
                transportMode,
                quantity: quantity != null ? Number(quantity) : undefined,
                unit,
                fromLocation,
                toLocation,
                containerId: containerId ? Number(containerId) : undefined,
                performedAt: performedAt ? new Date(performedAt) : new Date(),
                description,
            },
            include: {
                order: { select: { orderNumber: true } },
                container: { select: { containerNumber: true } },
            },
        });
        yield (0, ils_1.logInfoFlow)({
            ilsFunction: 'ACCOUNTING',
            eventType: 'CREATE',
            entityType: 'MATERIAL_FLOW',
            entityId: flow.id,
            orderId: (_a = flow.orderId) !== null && _a !== void 0 ? _a : undefined,
            message: `Материальный поток: ${flowType} (${transportMode}) ${fromLocation || ''} → ${toLocation || ''}`,
        });
        res.status(201).json(flow);
    }
    catch (error) {
        console.error('Error creating material flow:', error);
        res.status(500).json({ error: 'Failed to create material flow' });
    }
}));
exports.default = router;
