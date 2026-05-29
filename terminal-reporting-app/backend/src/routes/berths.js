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
// GET /api/berths - Получить все причалы
router.get('/', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const berths = yield prisma.berth.findMany({
            include: {
                vesselCalls: {
                    where: {
                        status: {
                            in: ['BERTHED', 'IN_OPERATION'],
                        },
                    },
                    include: {
                        vessel: true,
                    },
                },
            },
            orderBy: { number: 'asc' },
        });
        res.json(berths);
    }
    catch (error) {
        console.error('Error fetching berths:', error);
        res.status(500).json({ error: 'Failed to fetch berths' });
    }
}));
// GET /api/berths/:id - Получить причал по ID
router.get('/:id', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const berth = yield prisma.berth.findUnique({
            where: { id: Number(req.params.id) },
            include: {
                vesselCalls: {
                    include: {
                        vessel: true,
                    },
                    orderBy: { eta: 'desc' },
                    take: 20,
                },
            },
        });
        if (!berth) {
            return res.status(404).json({ error: 'Berth not found' });
        }
        res.json(berth);
    }
    catch (error) {
        console.error('Error fetching berth:', error);
        res.status(500).json({ error: 'Failed to fetch berth' });
    }
}));
// POST /api/berths - Создать причал
router.post('/', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const berth = yield prisma.berth.create({
            data: req.body,
        });
        res.status(201).json(berth);
    }
    catch (error) {
        console.error('Error creating berth:', error);
        res.status(400).json({ error: 'Failed to create berth' });
    }
}));
// PUT /api/berths/:id - Обновить причал
router.put('/:id', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const berth = yield prisma.berth.update({
            where: { id: Number(req.params.id) },
            data: req.body,
        });
        res.json(berth);
    }
    catch (error) {
        console.error('Error updating berth:', error);
        res.status(400).json({ error: 'Failed to update berth' });
    }
}));
// DELETE /api/berths/:id - Удалить причал
router.delete('/:id', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        yield prisma.berth.delete({
            where: { id: Number(req.params.id) },
        });
        res.status(204).send();
    }
    catch (error) {
        console.error('Error deleting berth:', error);
        res.status(400).json({ error: 'Failed to delete berth' });
    }
}));
exports.default = router;
