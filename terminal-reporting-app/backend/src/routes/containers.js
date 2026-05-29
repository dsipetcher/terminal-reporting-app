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
const client_1 = require("@prisma/client");
const cargoAssignmentValidation_1 = require("../lib/cargoAssignmentValidation");
const router = express_1.default.Router();
const prisma = new client_1.PrismaClient();
function pickContainerUpdateData(body, forCreate = false) {
    var _a, _b;
    const data = {};
    if (forCreate || body.containerNumber !== undefined) {
        data.containerNumber = body.containerNumber;
    }
    if (body.containerType !== undefined)
        data.containerType = body.containerType;
    if (body.status !== undefined)
        data.status = body.status;
    if (body.cargoCategory !== undefined)
        data.cargoCategory = body.cargoCategory;
    if (body.supplierName !== undefined)
        data.supplierName = body.supplierName || null;
    if (body.quantityTons !== undefined)
        data.quantityTons = (_a = body.quantityTons) !== null && _a !== void 0 ? _a : null;
    if (body.quantityUnit !== undefined)
        data.quantityUnit = body.quantityUnit;
    if (body.cargoDescription !== undefined)
        data.cargoDescription = body.cargoDescription || null;
    if (body.grossWeight !== undefined)
        data.grossWeight = (_b = body.grossWeight) !== null && _b !== void 0 ? _b : null;
    if (body.sealNumber !== undefined)
        data.sealNumber = body.sealNumber || null;
    if (body.location !== undefined)
        data.location = body.location || null;
    if (body.portOfLoading !== undefined)
        data.portOfLoading = body.portOfLoading || null;
    if (body.portOfDischarge !== undefined)
        data.portOfDischarge = body.portOfDischarge || null;
    if (body.blNumber !== undefined)
        data.blNumber = body.blNumber || null;
    if (body.customsStatus !== undefined)
        data.customsStatus = body.customsStatus || null;
    if (body.vesselCallId !== undefined)
        data.vesselCallId = body.vesselCallId || null;
    if (body.warehouseId !== undefined)
        data.warehouseId = body.warehouseId || null;
    if (body.logisticsOrderId !== undefined)
        data.logisticsOrderId = body.logisticsOrderId || null;
    return data;
}
// GET /api/containers - Получить все контейнеры
router.get('/', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { status, containerType, warehouseId } = req.query;
        const where = {};
        if (status && status !== 'ALL') {
            where.status = status;
        }
        if (containerType && containerType !== 'ALL') {
            where.containerType = containerType;
        }
        if (warehouseId) {
            where.warehouseId = Number(warehouseId);
        }
        const containers = yield prisma.container.findMany({
            where,
            include: {
                vesselCall: {
                    include: {
                        vessel: true,
                    },
                },
                warehouse: true,
            },
            orderBy: { createdAt: 'desc' },
        });
        res.json(containers);
    }
    catch (error) {
        console.error('Error fetching containers:', error);
        res.status(500).json({ error: 'Failed to fetch containers' });
    }
}));
// GET /api/containers/number/:containerNumber - Поиск по номеру
router.get('/number/:containerNumber', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const container = yield prisma.container.findUnique({
            where: { containerNumber: req.params.containerNumber },
            include: {
                vesselCall: {
                    include: {
                        vessel: true,
                    },
                },
                warehouse: true,
            },
        });
        if (!container) {
            return res.status(404).json({ error: 'Container not found' });
        }
        res.json(container);
    }
    catch (error) {
        console.error('Error fetching container:', error);
        res.status(500).json({ error: 'Failed to fetch container' });
    }
}));
// GET /api/containers/:id - Получить контейнер по ID
router.get('/:id', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const container = yield prisma.container.findUnique({
            where: { id: Number(req.params.id) },
            include: {
                vesselCall: {
                    include: {
                        vessel: true,
                        berth: true,
                    },
                },
                warehouse: true,
                wagons: true,
            },
        });
        if (!container) {
            return res.status(404).json({ error: 'Container not found' });
        }
        res.json(container);
    }
    catch (error) {
        console.error('Error fetching container:', error);
        res.status(500).json({ error: 'Failed to fetch container' });
    }
}));
// POST /api/containers - Создать контейнер
router.post('/', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const data = pickContainerUpdateData(req.body, true);
        const container = yield prisma.container.create({
            data: data,
            include: {
                vesselCall: {
                    include: {
                        vessel: true,
                    },
                },
                warehouse: true,
            },
        });
        res.status(201).json(container);
    }
    catch (error) {
        console.error('Error creating container:', error);
        if ((error === null || error === void 0 ? void 0 : error.code) === 'P2002') {
            return res.status(409).json({ error: 'Партия с таким номером уже существует' });
        }
        res.status(400).json({ error: 'Не удалось создать партию' });
    }
}));
// PUT /api/containers/:id - Обновить контейнер
router.put('/:id', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const containerId = Number(req.params.id);
        const data = pickContainerUpdateData(req.body);
        if (data.vesselCallId !== undefined && data.vesselCallId) {
            const assignmentError = yield (0, cargoAssignmentValidation_1.validateContainerVesselAssignment)(prisma, containerId, data.vesselCallId);
            if (assignmentError) {
                return res.status(409).json({ error: assignmentError });
            }
        }
        const container = yield prisma.container.update({
            where: { id: containerId },
            data: pickContainerUpdateData(req.body),
            include: {
                vesselCall: {
                    include: {
                        vessel: true,
                    },
                },
                warehouse: true,
            },
        });
        res.json(container);
    }
    catch (error) {
        console.error('Error updating container:', error);
        if ((error === null || error === void 0 ? void 0 : error.code) === 'P2002') {
            return res.status(409).json({ error: 'Партия с таким номером уже существует' });
        }
        if ((error === null || error === void 0 ? void 0 : error.code) === 'P2025') {
            return res.status(404).json({ error: 'Партия не найдена' });
        }
        res.status(400).json({ error: 'Не удалось обновить партию' });
    }
}));
// PATCH /api/containers/:id/move - Переместить контейнер
router.patch('/:id/move', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { warehouseId, location, status } = req.body;
        const container = yield prisma.container.update({
            where: { id: Number(req.params.id) },
            data: {
                warehouseId: warehouseId ? Number(warehouseId) : null,
                location,
                status: status || 'IN_TERMINAL',
            },
            include: {
                warehouse: true,
            },
        });
        res.json(container);
    }
    catch (error) {
        console.error('Error moving container:', error);
        res.status(400).json({ error: 'Failed to move container' });
    }
}));
// DELETE /api/containers/:id - Удалить контейнер
router.delete('/:id', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        yield prisma.container.delete({
            where: { id: Number(req.params.id) },
        });
        res.status(204).send();
    }
    catch (error) {
        console.error('Error deleting container:', error);
        res.status(400).json({ error: 'Failed to delete container' });
    }
}));
exports.default = router;
