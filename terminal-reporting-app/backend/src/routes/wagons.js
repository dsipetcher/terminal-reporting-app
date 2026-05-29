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
function pickWagonUpdateData(body) {
    var _a;
    const data = {};
    if (body.number !== undefined)
        data.number = body.number;
    if (body.wagonType !== undefined)
        data.wagonType = body.wagonType;
    if (body.cargo !== undefined)
        data.cargo = body.cargo || null;
    if (body.cargoWeight !== undefined)
        data.cargoWeight = (_a = body.cargoWeight) !== null && _a !== void 0 ? _a : null;
    if (body.track !== undefined)
        data.track = body.track || null;
    if (body.trainNumber !== undefined)
        data.trainNumber = body.trainNumber || null;
    if (body.status !== undefined)
        data.status = body.status;
    if (body.warehouseId !== undefined)
        data.warehouseId = body.warehouseId || null;
    if (body.containerId !== undefined)
        data.containerId = body.containerId || null;
    if (body.arrivalAt !== undefined)
        data.arrivalAt = new Date(body.arrivalAt);
    if (body.departureAt !== undefined) {
        data.departureAt = body.departureAt ? new Date(body.departureAt) : null;
    }
    return data;
}
// GET /api/wagons - Получить все вагоны
router.get('/', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { status, warehouseId } = req.query;
        const where = {};
        if (status && status !== 'ALL') {
            where.status = status;
        }
        if (warehouseId) {
            where.warehouseId = Number(warehouseId);
        }
        const wagons = yield prisma.wagon.findMany({
            where,
            include: {
                warehouse: true,
                container: true,
            },
            orderBy: { arrivalAt: 'desc' },
        });
        res.json(wagons);
    }
    catch (error) {
        console.error('Error fetching wagons:', error);
        res.status(500).json({ error: 'Не удалось загрузить вагоны' });
    }
}));
// GET /api/wagons/:id - Получить вагон по ID
router.get('/:id', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const wagon = yield prisma.wagon.findUnique({
            where: { id: Number(req.params.id) },
            include: {
                warehouse: true,
                container: {
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
        if (!wagon) {
            return res.status(404).json({ error: 'Вагон не найден' });
        }
        res.json(wagon);
    }
    catch (error) {
        console.error('Error fetching wagon:', error);
        res.status(500).json({ error: 'Не удалось загрузить вагон' });
    }
}));
// POST /api/wagons - Создать вагон
router.post('/', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const data = pickWagonUpdateData(req.body);
        if (!data.status)
            data.status = 'EXPECTED';
        const assignmentError = yield (0, cargoAssignmentValidation_1.validateWagonContainerAssignment)(prisma, data.containerId, undefined);
        if (assignmentError) {
            return res.status(409).json({ error: assignmentError });
        }
        const wagon = yield prisma.wagon.create({
            data: data,
            include: {
                warehouse: true,
                container: true,
            },
        });
        res.status(201).json(wagon);
    }
    catch (error) {
        console.error('Error creating wagon:', error);
        if ((error === null || error === void 0 ? void 0 : error.code) === 'P2002') {
            return res.status(409).json({ error: 'Вагон с таким номером уже существует' });
        }
        res.status(400).json({ error: 'Не удалось создать вагон' });
    }
}));
// PUT /api/wagons/:id - Обновить вагон
router.put('/:id', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const wagonId = Number(req.params.id);
        const data = pickWagonUpdateData(req.body);
        if (data.containerId !== undefined) {
            const assignmentError = yield (0, cargoAssignmentValidation_1.validateWagonContainerAssignment)(prisma, data.containerId, wagonId);
            if (assignmentError) {
                return res.status(409).json({ error: assignmentError });
            }
        }
        const wagon = yield prisma.wagon.update({
            where: { id: wagonId },
            data: data,
            include: {
                warehouse: true,
                container: true,
            },
        });
        res.json(wagon);
    }
    catch (error) {
        console.error('Error updating wagon:', error);
        if ((error === null || error === void 0 ? void 0 : error.code) === 'P2002') {
            return res.status(409).json({ error: 'Вагон с таким номером уже существует' });
        }
        if ((error === null || error === void 0 ? void 0 : error.code) === 'P2025') {
            return res.status(404).json({ error: 'Вагон не найден' });
        }
        res.status(400).json({ error: 'Не удалось обновить вагон' });
    }
}));
// PATCH /api/wagons/:id/status - Обновить статус вагона
router.patch('/:id/status', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { status } = req.body;
        const updateData = { status };
        if (status === 'DEPARTED' && !req.body.departureAt) {
            updateData.departureAt = new Date();
        }
        const wagon = yield prisma.wagon.update({
            where: { id: Number(req.params.id) },
            data: updateData,
            include: {
                warehouse: true,
                container: true,
            },
        });
        res.json(wagon);
    }
    catch (error) {
        console.error('Error updating wagon status:', error);
        res.status(400).json({ error: 'Не удалось обновить статус вагона' });
    }
}));
// DELETE /api/wagons/:id - Удалить вагон
router.delete('/:id', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        yield prisma.wagon.delete({
            where: { id: Number(req.params.id) },
        });
        res.status(204).send();
    }
    catch (error) {
        console.error('Error deleting wagon:', error);
        res.status(400).json({ error: 'Не удалось удалить вагон' });
    }
}));
exports.default = router;
