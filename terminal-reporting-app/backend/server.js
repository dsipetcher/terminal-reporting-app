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
const cors_1 = __importDefault(require("cors"));
const app = (0, express_1.default)();
const prisma = new client_1.PrismaClient();
app.use((0, cors_1.default)());
app.use(express_1.default.json());
// Получить список вагонов
app.get('/api/wagons', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const warehouses = yield prisma.warehouse.findMany({
            orderBy: { id: 'desc' },
        });
        res.json(warehouses);
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Не удалось получить склады' });
    }
}));
// Добавить вагон
app.post('/api/wagons', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { number, track, cargo, cargoWeight, arrivalAt, warehouseId } = req.body;
        const warehouseIdNumber = Number(warehouseId);
        const wagon = yield prisma.wagon.create({
            data: {
                number,
                track,
                cargo,
                cargoWeight,
                arrivalAt: new Date(arrivalAt),
                warehouse: {
                    connect: { id: warehouseIdNumber },
                },
            },
        });
        res.status(201).json(wagon);
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to create wagon' });
    }
}));
/**
 * 📦 Эндпоинты для складов
 */
// Получить список складов
app.get('/api/warehouses', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const warehouses = yield prisma.warehouse.findMany({
            orderBy: { id: 'desc' },
        });
        res.json(warehouses);
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Не удалось получить склады' });
    }
}));
// Добавить склад
app.post('/api/warehouses', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { number, capacity } = req.body;
        const warehouse = yield prisma.warehouse.create({
            data: { number, capacity },
        });
        res.status(201).json(warehouse);
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Не удалось создать склад' });
    }
}));
app.listen(3001, () => {
    console.log('✅ Backend running at http://localhost:3001');
});
