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
const router = express_1.default.Router();
router.get('/', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { partnerType } = req.query;
        const where = {};
        if (partnerType && partnerType !== 'ALL')
            where.partnerType = String(partnerType);
        const items = yield prisma_1.default.counterparty.findMany({
            where,
            include: { _count: { select: { orders: true } } },
            orderBy: { name: 'asc' },
        });
        res.json(items);
    }
    catch (error) {
        console.error('Error fetching counterparties:', error);
        res.status(500).json({ error: 'Failed to fetch counterparties' });
    }
}));
router.post('/', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { code, name, partnerType, inn, contact } = req.body;
        if (!code || !name || !partnerType) {
            return res.status(400).json({ error: 'code, name and partnerType are required' });
        }
        const item = yield prisma_1.default.counterparty.create({
            data: { code, name, partnerType, inn, contact },
        });
        res.status(201).json(item);
    }
    catch (error) {
        console.error('Error creating counterparty:', error);
        res.status(500).json({ error: 'Failed to create counterparty' });
    }
}));
router.put('/:id', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const item = yield prisma_1.default.counterparty.update({
            where: { id: Number(req.params.id) },
            data: req.body,
        });
        res.json(item);
    }
    catch (error) {
        console.error('Error updating counterparty:', error);
        res.status(500).json({ error: 'Failed to update counterparty' });
    }
}));
router.delete('/:id', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        yield prisma_1.default.counterparty.delete({ where: { id: Number(req.params.id) } });
        res.status(204).send();
    }
    catch (error) {
        console.error('Error deleting counterparty:', error);
        res.status(500).json({ error: 'Failed to delete counterparty' });
    }
}));
exports.default = router;
