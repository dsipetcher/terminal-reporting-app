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
// GET /api/vessels - Получить все суда
router.get('/', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const vessels = yield prisma.vessel.findMany({
            include: {
                _count: {
                    select: { vesselCalls: true },
                },
            },
            orderBy: { name: 'asc' },
        });
        res.json(vessels);
    }
    catch (error) {
        console.error('Error fetching vessels:', error);
        res.status(500).json({ error: 'Failed to fetch vessels' });
    }
}));
// GET /api/vessels/:id - Получить судно по ID
router.get('/:id', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const vessel = yield prisma.vessel.findUnique({
            where: { id: Number(req.params.id) },
            include: {
                vesselCalls: {
                    include: {
                        berth: true,
                        _count: {
                            select: { containers: true },
                        },
                    },
                    orderBy: { eta: 'desc' },
                    take: 10,
                },
            },
        });
        if (!vessel) {
            return res.status(404).json({ error: 'Vessel not found' });
        }
        res.json(vessel);
    }
    catch (error) {
        console.error('Error fetching vessel:', error);
        res.status(500).json({ error: 'Failed to fetch vessel' });
    }
}));
// POST /api/vessels - Создать новое судно
router.post('/', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const vessel = yield prisma.vessel.create({
            data: req.body,
        });
        res.status(201).json(vessel);
    }
    catch (error) {
        console.error('Error creating vessel:', error);
        res.status(400).json({ error: 'Failed to create vessel' });
    }
}));
// PUT /api/vessels/:id - Обновить судно
router.put('/:id', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const vessel = yield prisma.vessel.update({
            where: { id: Number(req.params.id) },
            data: req.body,
        });
        res.json(vessel);
    }
    catch (error) {
        console.error('Error updating vessel:', error);
        res.status(400).json({ error: 'Failed to update vessel' });
    }
}));
// DELETE /api/vessels/:id - Удалить судно
router.delete('/:id', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        yield prisma.vessel.delete({
            where: { id: Number(req.params.id) },
        });
        res.status(204).send();
    }
    catch (error) {
        console.error('Error deleting vessel:', error);
        res.status(400).json({ error: 'Failed to delete vessel' });
    }
}));
exports.default = router;
