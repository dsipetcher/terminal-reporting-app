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
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const client_1 = require("@prisma/client");
const router = express_1.default.Router();
const prisma = new client_1.PrismaClient();
// GET /api/warehouses - Получить все склады
router.get('/', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const warehouses = yield prisma.warehouse.findMany({
            include: {
                _count: {
                    select: {
                        wagons: true,
                        containers: true,
                    },
                },
                containers: {
                    select: {
                        grossWeight: true,
                    },
                },
            },
            orderBy: { number: 'asc' },
        });
        // Расчет загрузки для каждого склада
        const warehousesWithLoad = warehouses.map(warehouse => {
            const load = warehouse.containers.reduce((sum, container) => {
                return sum + (container.grossWeight || 0);
            }, 0);
            const { containers } = warehouse, warehouseData = __rest(warehouse, ["containers"]);
            return Object.assign(Object.assign({}, warehouseData), { load });
        });
        res.json(warehousesWithLoad);
    }
    catch (error) {
        console.error('Error fetching warehouses:', error);
        res.status(500).json({ error: 'Failed to fetch warehouses' });
    }
}));
// GET /api/warehouses/:id - Получить склад по ID
router.get('/:id', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const warehouse = yield prisma.warehouse.findUnique({
            where: { id: Number(req.params.id) },
            include: {
                wagons: true,
                containers: {
                    include: {
                        vesselCall: {
                            include: {
                                vessel: true,
                            },
                        },
                    },
                },
            },
        });
        if (!warehouse) {
            return res.status(404).json({ error: 'Warehouse not found' });
        }
        // Расчет загрузки
        const load = warehouse.containers.reduce((sum, container) => {
            return sum + (container.grossWeight || 0);
        }, 0);
        res.json(Object.assign(Object.assign({}, warehouse), { load }));
    }
    catch (error) {
        console.error('Error fetching warehouse:', error);
        res.status(500).json({ error: 'Failed to fetch warehouse' });
    }
}));
// POST /api/warehouses - Создать склад
router.post('/', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const warehouse = yield prisma.warehouse.create({
            data: req.body,
        });
        res.status(201).json(warehouse);
    }
    catch (error) {
        console.error('Error creating warehouse:', error);
        res.status(400).json({ error: 'Failed to create warehouse' });
    }
}));
// PUT /api/warehouses/:id - Обновить склад
router.put('/:id', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const warehouse = yield prisma.warehouse.update({
            where: { id: Number(req.params.id) },
            data: req.body,
        });
        res.json(warehouse);
    }
    catch (error) {
        console.error('Error updating warehouse:', error);
        res.status(400).json({ error: 'Failed to update warehouse' });
    }
}));
// DELETE /api/warehouses/:id - Удалить склад
router.delete('/:id', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        yield prisma.warehouse.delete({
            where: { id: Number(req.params.id) },
        });
        res.status(204).send();
    }
    catch (error) {
        console.error('Error deleting warehouse:', error);
        res.status(400).json({ error: 'Failed to delete warehouse' });
    }
}));
exports.default = router;
