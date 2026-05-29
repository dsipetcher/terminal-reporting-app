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
const cors_1 = __importDefault(require("cors"));
const prisma_1 = __importDefault(require("./lib/prisma"));
const auth_1 = require("./middleware/auth");
const auth_2 = __importDefault(require("./routes/auth"));
const vessels_1 = __importDefault(require("./routes/vessels"));
const vesselCalls_1 = __importDefault(require("./routes/vesselCalls"));
const berths_1 = __importDefault(require("./routes/berths"));
const containers_1 = __importDefault(require("./routes/containers"));
const warehouses_1 = __importDefault(require("./routes/warehouses"));
const wagons_1 = __importDefault(require("./routes/wagons"));
const logisticsOrders_1 = __importDefault(require("./routes/logisticsOrders"));
const counterparties_1 = __importDefault(require("./routes/counterparties"));
const materialFlows_1 = __importDefault(require("./routes/materialFlows"));
const infoFlows_1 = __importDefault(require("./routes/infoFlows"));
const directories_1 = __importDefault(require("./routes/directories"));
const logisticsRoutes_1 = __importDefault(require("./routes/logisticsRoutes"));
const app = (0, express_1.default)();
app.use((0, cors_1.default)());
app.use(express_1.default.json());
app.get('/api/health', (_req, res) => {
    res.json({ status: 'OK', timestamp: new Date().toISOString() });
});
app.use('/api/auth', auth_2.default);
app.get('/api/dashboard/stats', auth_1.authenticateToken, (_req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const [vesselCallsCount, activeVesselCalls, containersCount, wagonsCount, warehousesCount, ordersTotal, ordersPlanning, ordersDispatch, ordersOperational, ordersInProgress, materialFlowsToday, infoEventsToday, counterpartiesCount, activeRoutes, cargoOnRoutes,] = yield Promise.all([
            prisma_1.default.vesselCall.count(),
            prisma_1.default.vesselCall.count({
                where: {
                    status: {
                        in: ['EXPECTED', 'ARRIVED', 'BERTHED', 'IN_OPERATION'],
                    },
                },
            }),
            prisma_1.default.container.count(),
            prisma_1.default.wagon.count(),
            prisma_1.default.warehouse.count(),
            prisma_1.default.logisticsOrder.count(),
            prisma_1.default.logisticsOrder.count({ where: { managementLevel: 'PLANNING' } }),
            prisma_1.default.logisticsOrder.count({ where: { managementLevel: 'DISPATCH' } }),
            prisma_1.default.logisticsOrder.count({ where: { managementLevel: 'OPERATIONAL' } }),
            prisma_1.default.logisticsOrder.count({
                where: { status: { in: ['PLANNED', 'IN_PROGRESS'] } },
            }),
            prisma_1.default.materialFlow.count({
                where: {
                    performedAt: { gte: new Date(new Date().setHours(0, 0, 0, 0)) },
                },
            }),
            prisma_1.default.infoFlowEvent.count({
                where: {
                    createdAt: { gte: new Date(new Date().setHours(0, 0, 0, 0)) },
                },
            }),
            prisma_1.default.counterparty.count(),
            prisma_1.default.logisticsRoute.count({ where: { status: 'ACTIVE' } }),
            prisma_1.default.cargoTracking.count({
                where: { status: { in: ['REGISTERED', 'IN_TRANSIT', 'AT_STAGE'] } },
            }),
        ]);
        res.json({
            vesselCallsTotal: vesselCallsCount,
            vesselCallsActive: activeVesselCalls,
            containers: containersCount,
            wagons: wagonsCount,
            warehouses: warehousesCount,
            ordersTotal,
            ordersPlanning,
            ordersDispatch,
            ordersOperational,
            ordersInProgress,
            materialFlowsToday,
            infoEventsToday,
            counterpartiesCount,
            activeRoutes,
            cargoOnRoutes,
        });
    }
    catch (error) {
        console.error('Error fetching dashboard stats:', error);
        res.status(500).json({ error: 'Failed to fetch dashboard stats' });
    }
}));
app.use('/api/vessels', auth_1.authenticateToken, vessels_1.default);
app.use('/api/vessel-calls', auth_1.authenticateToken, vesselCalls_1.default);
app.use('/api/berths', auth_1.authenticateToken, berths_1.default);
app.use('/api/containers', auth_1.authenticateToken, containers_1.default);
app.use('/api/warehouses', auth_1.authenticateToken, warehouses_1.default);
app.use('/api/wagons', auth_1.authenticateToken, wagons_1.default);
app.use('/api/logistics-orders', auth_1.authenticateToken, logisticsOrders_1.default);
app.use('/api/counterparties', auth_1.authenticateToken, counterparties_1.default);
app.use('/api/material-flows', auth_1.authenticateToken, materialFlows_1.default);
app.use('/api/info-flows', auth_1.authenticateToken, infoFlows_1.default);
app.use('/api/directories', auth_1.authenticateToken, directories_1.default);
app.use('/api/logistics-routes', auth_1.authenticateToken, logisticsRoutes_1.default);
const PORT = 3001;
app.listen(PORT, () => {
    console.log('Information Logistics System (ILS) API');
    console.log(`Server running on http://localhost:${PORT}`);
    console.log(`Health check: http://localhost:${PORT}/api/health`);
});
