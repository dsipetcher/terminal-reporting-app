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
const router = express_1.default.Router();
const prisma = new client_1.PrismaClient();
// GET /api/vessel-calls - Получить все судозаходы
router.get('/', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { status, fromDate, toDate } = req.query;
        const where = {};
        if (status && status !== 'ALL') {
            where.status = status;
        }
        if (fromDate || toDate) {
            where.eta = {};
            if (fromDate)
                where.eta.gte = new Date(fromDate);
            if (toDate)
                where.eta.lte = new Date(toDate);
        }
        const vesselCalls = yield prisma.vesselCall.findMany({
            where,
            include: {
                vessel: true,
                berth: true,
                _count: {
                    select: { containers: true },
                },
            },
            orderBy: { eta: 'asc' },
        });
        res.json(vesselCalls);
    }
    catch (error) {
        console.error('Error fetching vessel calls:', error);
        res.status(500).json({ error: 'Failed to fetch vessel calls' });
    }
}));
// GET /api/vessel-calls/:id - Получить судозаход по ID
router.get('/:id', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const vesselCall = yield prisma.vesselCall.findUnique({
            where: { id: Number(req.params.id) },
            include: {
                vessel: true,
                berth: true,
                containers: true,
            },
        });
        if (!vesselCall) {
            return res.status(404).json({ error: 'Vessel call not found' });
        }
        res.json(vesselCall);
    }
    catch (error) {
        console.error('Error fetching vessel call:', error);
        res.status(500).json({ error: 'Failed to fetch vessel call' });
    }
}));
// POST /api/vessel-calls - Создать судозаход
router.post('/', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const vesselCall = yield prisma.vesselCall.create({
            data: req.body,
            include: {
                vessel: true,
                berth: true,
            },
        });
        res.status(201).json(vesselCall);
    }
    catch (error) {
        console.error('Error creating vessel call:', error);
        res.status(400).json({ error: 'Failed to create vessel call' });
    }
}));
// PUT /api/vessel-calls/:id - Обновить судозаход
router.put('/:id', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const vesselCall = yield prisma.vesselCall.update({
            where: { id: Number(req.params.id) },
            data: req.body,
            include: {
                vessel: true,
                berth: true,
            },
        });
        res.json(vesselCall);
    }
    catch (error) {
        console.error('Error updating vessel call:', error);
        res.status(400).json({ error: 'Failed to update vessel call' });
    }
}));
// PATCH /api/vessel-calls/:id/status - Обновить статус судозахода
router.patch('/:id/status', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { status, berthId } = req.body;
        const updateData = { status };
        if (status === 'BERTHED') {
            if (!berthId) {
                return res.status(400).json({ error: 'Berth is required when status is BERTHED' });
            }
            updateData.berthId = Number(berthId);
        }
        // Автоматически устанавливать фактическое время
        if (status === 'ARRIVED' && !req.body.ata) {
            updateData.ata = new Date();
        }
        if (status === 'DEPARTED' && !req.body.atd) {
            updateData.atd = new Date();
        }
        const vesselCall = yield prisma.vesselCall.update({
            where: { id: Number(req.params.id) },
            data: updateData,
            include: {
                vessel: true,
                berth: true,
            },
        });
        res.json(vesselCall);
    }
    catch (error) {
        console.error('Error updating vessel call status:', error);
        res.status(400).json({ error: 'Failed to update vessel call status' });
    }
}));
// DELETE /api/vessel-calls/:id - Удалить судозаход
router.delete('/:id', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        yield prisma.vesselCall.delete({
            where: { id: Number(req.params.id) },
        });
        res.status(204).send();
    }
    catch (error) {
        console.error('Error deleting vessel call:', error);
        res.status(400).json({ error: 'Failed to delete vessel call' });
    }
}));
exports.default = router;
