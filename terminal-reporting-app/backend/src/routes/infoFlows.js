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
        const { ilsFunction, entityType, orderId, limit } = req.query;
        const where = {};
        if (ilsFunction && ilsFunction !== 'ALL')
            where.ilsFunction = String(ilsFunction);
        if (entityType && entityType !== 'ALL')
            where.entityType = String(entityType);
        if (orderId)
            where.orderId = Number(orderId);
        const events = yield prisma_1.default.infoFlowEvent.findMany({
            where,
            include: {
                user: { select: { id: true, username: true, fullName: true } },
                order: { select: { id: true, orderNumber: true } },
            },
            orderBy: { createdAt: 'desc' },
            take: limit ? Number(limit) : 100,
        });
        res.json(events);
    }
    catch (error) {
        console.error('Error fetching info flow events:', error);
        res.status(500).json({ error: 'Failed to fetch info flow events' });
    }
}));
exports.default = router;
