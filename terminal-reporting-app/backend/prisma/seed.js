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
const client_1 = require("@prisma/client");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const ils_1 = require("../src/lib/ils");
const exportRouteStages_1 = require("../src/lib/exportRouteStages");
const cargoStatusFromStage_1 = require("../src/lib/cargoStatusFromStage");
const syncTransportWithCargoStage_1 = require("../src/lib/syncTransportWithCargoStage");
const prisma = new client_1.PrismaClient();
const MOCK_BATCHES = [
    {
        containerNumber: 'COAL-2026-0001',
        containerType: 'COAL_ANTHRACITE',
        cargoCategory: 'COAL',
        supplierName: 'АО «Кузбассуголь»',
        cargoDescription: 'Уголь каменный марки Д',
        quantityTons: 4200,
        portOfLoading: 'RUNVS',
        portOfDischarge: 'TRMER',
        warehouseKey: 'coal',
        location: 'Сектор A-3',
        vesselCallKey: '204N',
        progress: 3,
        routeNumber: 'RT-COAL-001',
        routeName: 'Уголь каменный · ж/д → Мерсин',
        origin: 'Кузбасс',
        destCode: 'TRMER',
        destName: 'Порт Мерсин',
        wagon: { number: '53467821', trainNumber: '2845', track: 'Путь 12' },
        blNumber: 'BL-COAL-001',
    },
    {
        containerNumber: 'COAL-2026-0002',
        containerType: 'COAL_COKING',
        cargoCategory: 'COAL',
        supplierName: 'АО «Кузбассуголь»',
        cargoDescription: 'Уголь коксующийся K',
        quantityTons: 3800,
        portOfLoading: 'RUNVS',
        portOfDischarge: 'CNQDG',
        progress: 2,
        routeNumber: 'RT-COAL-002',
        routeName: 'Коксующийся уголь · ж/д → Циндао',
        origin: 'Кузбасс',
        destCode: 'CNQDG',
        destName: 'Порт Циндао',
        wagon: { number: '53467822', trainNumber: '2851', track: 'Путь 8' },
    },
    {
        containerNumber: 'COAL-2026-0003',
        containerType: 'COAL_ANTHRACITE',
        cargoCategory: 'COAL',
        supplierName: 'АО «Кузбассуголь»',
        cargoDescription: 'Уголь энергетический',
        quantityTons: 5100,
        portOfLoading: 'RUNVS',
        portOfDischarge: 'ITGIT',
        warehouseKey: 'coal',
        location: 'Сектор B-1',
        vesselCallKey: '205N',
        progress: 4,
        routeNumber: 'RT-COAL-003',
        routeName: 'Уголь · ж/д → погрузка в Таранто',
        origin: 'Кузбасс',
        destCode: 'ITGIT',
        destName: 'Порт Таранто',
        wagon: { number: '53467823', trainNumber: '2860', track: 'Путь 12' },
    },
    {
        containerNumber: 'COAL-2026-0004',
        containerType: 'COAL_ANTHRACITE',
        cargoCategory: 'COAL',
        supplierName: 'АО «Кузбассуголь»',
        cargoDescription: 'Уголь для экспорта в Турцию',
        quantityTons: 4600,
        portOfLoading: 'RUNVS',
        portOfDischarge: 'TRMER',
        vesselCallKey: '204N',
        progress: 5,
        routeNumber: 'RT-COAL-004',
        routeName: 'Уголь на борту (после ж/д и склада)',
        origin: 'Кузбасс',
        destCode: 'TRMER',
        destName: 'Порт Мерсин',
        wagon: { number: '53467824', trainNumber: '2872', track: 'Путь 14' },
    },
    {
        containerNumber: 'COAL-2026-0005',
        containerType: 'COAL_COKING',
        cargoCategory: 'COAL',
        supplierName: 'АО «Кузбассуголь»',
        cargoDescription: 'Коксующийся уголь — рейс в Китай',
        quantityTons: 3900,
        portOfLoading: 'RUNVS',
        portOfDischarge: 'CNQDG',
        vesselCallKey: '206N',
        progress: 6,
        routeNumber: 'RT-COAL-005',
        routeName: 'Уголь · доставлен ж/д и морем',
        origin: 'Кузбасс',
        destCode: 'CNQDG',
        destName: 'Порт Циндао',
    },
    {
        containerNumber: 'OIL-2026-0001',
        containerType: 'OIL_CRUDE',
        cargoCategory: 'OIL',
        supplierName: 'ЛУКОЙЛ-НПЗ',
        cargoDescription: 'Нефть сырая (марка «Urals»)',
        quantityTons: 6200,
        portOfLoading: 'RUNVS',
        portOfDischarge: 'TRMER',
        warehouseKey: 'oil',
        location: 'Резервуар R-2',
        vesselCallKey: 'T101',
        progress: 3,
        routeNumber: 'RT-OIL-001',
        routeName: 'Сырая нефть · ж/д с НПЗ → Мерсин',
        origin: 'Самара (НПЗ)',
        destCode: 'TRMER',
        destName: 'Порт Мерсин',
        wagon: { number: '75123401', trainNumber: 'N401', track: 'Путь 3 (налив)' },
    },
    {
        containerNumber: 'OIL-2026-0002',
        containerType: 'OIL_CRUDE',
        cargoCategory: 'OIL',
        supplierName: 'ЛУКОЙЛ-НПЗ',
        cargoDescription: 'Нефть (марка «Urals»), партия 2',
        quantityTons: 5800,
        portOfLoading: 'RUNVS',
        portOfDischarge: 'CNQDG',
        progress: 2,
        routeNumber: 'RT-OIL-002',
        routeName: 'Нефть · состав на ж/д фронте',
        origin: 'Самара (НПЗ)',
        destCode: 'CNQDG',
        destName: 'Порт Циндао',
        wagon: { number: '75123402', trainNumber: 'N408', track: 'Путь 3' },
    },
    {
        containerNumber: 'OIL-2026-0003',
        containerType: 'OIL_FUEL',
        cargoCategory: 'OIL',
        supplierName: 'ЛУКОЙЛ-НПЗ',
        cargoDescription: 'Мазут топочный М-100',
        quantityTons: 4100,
        portOfLoading: 'RUNVS',
        portOfDischarge: 'ITGIT',
        warehouseKey: 'oil',
        location: 'Резервуар R-5',
        vesselCallKey: 'T102',
        progress: 4,
        routeNumber: 'RT-OIL-003',
        routeName: 'Мазут · ж/д → налив на танкер',
        origin: 'Самара (НПЗ)',
        destCode: 'ITGIT',
        destName: 'Порт Таранто',
        wagon: { number: '75123403', trainNumber: 'N415', track: 'Путь 5' },
    },
    {
        containerNumber: 'PETRO-2026-0001',
        containerType: 'PETROLEUM',
        cargoCategory: 'PETROLEUM',
        supplierName: 'ЛУКОЙЛ-НПЗ',
        cargoDescription: 'Дизельное топливо Евро-5',
        quantityTons: 3200,
        portOfLoading: 'RUNVS',
        portOfDischarge: 'TRMER',
        progress: 1,
        routeNumber: 'RT-PETRO-001',
        routeName: 'Дизель · формирование ж/д состава на НПЗ',
        origin: 'Самара (НПЗ)',
        destCode: 'TRMER',
        destName: 'Порт Мерсин',
    },
    {
        containerNumber: 'OIL-2026-0004',
        containerType: 'OIL_FUEL',
        cargoCategory: 'OIL',
        supplierName: 'ЛУКОЙЛ-НПЗ',
        cargoDescription: 'Топливный мазут — доставлено',
        quantityTons: 4500,
        portOfLoading: 'RUNVS',
        portOfDischarge: 'CNQDG',
        vesselCallKey: 'T103',
        progress: 'delivered',
        routeNumber: 'RT-OIL-004',
        routeName: 'Мазут · цикл завершён (ж/д + море)',
        origin: 'Самара (НПЗ)',
        destCode: 'CNQDG',
        destName: 'Порт Циндао',
        blNumber: 'BL-OIL-004',
    },
];
function buildStagesForProgress(progress, overrides) {
    const base = (0, exportRouteStages_1.buildExportRouteStages)(overrides);
    const t0 = Date.now();
    if (progress === 'delivered') {
        return base.map((s) => (Object.assign(Object.assign({}, s), { status: 'COMPLETED', actualAt: new Date(t0 - (7 - s.sequence) * 86400000) })));
    }
    return base.map((s) => (Object.assign(Object.assign({}, s), { status: s.sequence < progress ? 'COMPLETED' : s.sequence === progress ? 'CURRENT' : 'PENDING', actualAt: s.sequence <= progress
            ? new Date(t0 - (progress - s.sequence + 1) * 3600000)
            : undefined })));
}
function stageTypeForProgress(progress) {
    var _a;
    if (progress === 'delivered')
        return 'PORT';
    const types = ['SUPPLIER', 'RAIL_STATION', 'WAREHOUSE', 'BERTH', 'SHIP', 'PORT'];
    return (_a = types[progress - 1]) !== null && _a !== void 0 ? _a : 'SUPPLIER';
}
function seedCounterparties() {
    return __awaiter(this, void 0, void 0, function* () {
        const partners = [
            { code: 'KUZBASS-COAL', name: 'АО «Кузбассуголь»', partnerType: 'CLIENT', contact: 'Поставщик угля' },
            { code: 'LUKOIL-NPZ', name: 'ЛУКОЙЛ-НПЗ', partnerType: 'CLIENT', contact: 'Поставщик нефтепродуктов' },
            { code: 'RZD-TERM', name: 'РЖД-Терминал', partnerType: 'RAILWAY' },
            { code: 'MSC-AGENT', name: 'Судовой агент MSC', partnerType: 'AGENT' },
        ];
        for (const p of partners) {
            yield prisma.counterparty.upsert({ where: { code: p.code }, update: p, create: p });
        }
    });
}
function seedDirectories() {
    return __awaiter(this, void 0, void 0, function* () {
        const ports = [
            { code: 'RUNVS', name: 'Новороссийск (терминал)', country: 'RU' },
            { code: 'TRMER', name: 'Мерсин', country: 'TR' },
            { code: 'CNQDG', name: 'Циндао', country: 'CN' },
            { code: 'ITGIT', name: 'Таранто', country: 'IT' },
        ];
        for (const port of ports) {
            yield prisma.portDirectory.upsert({ where: { code: port.code }, update: {}, create: port });
        }
        const cargo = [
            { code: 'COAL-ANT', name: 'Уголь каменный', category: 'BULK' },
            { code: 'COAL-COK', name: 'Уголь коксующийся', category: 'BULK' },
            { code: 'OIL-CRUDE', name: 'Нефть сырая', category: 'LIQUID' },
            { code: 'OIL-FUEL', name: 'Мазут / топливо', category: 'LIQUID' },
            { code: 'PETRO-DIESEL', name: 'Дизельное топливо', category: 'LIQUID' },
        ];
        for (const item of cargo) {
            yield prisma.cargoDirectory.upsert({ where: { code: item.code }, update: {}, create: item });
        }
    });
}
function seedTerminalInfrastructure() {
    return __awaiter(this, void 0, void 0, function* () {
        const berthBulk = yield prisma.berth.upsert({
            where: { number: 'BULK-1' },
            update: {
                name: 'Причал навалочных грузов (уголь)',
            },
            create: {
                number: 'BULK-1',
                name: 'Причал навалочных грузов (уголь)',
                berthType: 'BULK',
                length: 280,
                depth: 15,
                maxDeadweight: 150000,
            },
        });
        const berthLiquid = yield prisma.berth.upsert({
            where: { number: 'LIQUID-1' },
            update: {
                name: 'Причал наливной (нефть)',
            },
            create: {
                number: 'LIQUID-1',
                name: 'Причал наливной (нефть)',
                berthType: 'LIQUID',
                length: 220,
                depth: 12,
                maxDeadweight: 100000,
            },
        });
        const vesselBulk = yield prisma.vessel.upsert({
            where: { imoNumber: '9703291' },
            update: {},
            create: {
                name: 'VOLGOBALT-204',
                imoNumber: '9703291',
                vesselType: 'BULK_CARRIER',
                deadweight: 62000,
                flag: 'RU',
                owner: 'Volga Shipping',
            },
        });
        const vesselTanker = yield prisma.vessel.upsert({
            where: { imoNumber: '9312345' },
            update: {},
            create: {
                name: 'NORD STREAM',
                imoNumber: '9312345',
                vesselType: 'TANKER',
                deadweight: 48000,
                flag: 'MT',
                owner: 'Tanker Line',
            },
        });
        const whCoal = yield prisma.warehouse.upsert({
            where: { number: 'COAL-YARD-1' },
            update: {
                name: 'Открытая площадка угля',
            },
            create: {
                number: 'COAL-YARD-1',
                name: 'Открытая площадка угля',
                capacity: 120000,
                warehouseType: 'COAL_YARD',
                zone: 'Уголь',
            },
        });
        const whOil = yield prisma.warehouse.upsert({
            where: { number: 'OIL-TANK-1' },
            update: {
                name: 'Резервуарный парк нефти',
            },
            create: {
                number: 'OIL-TANK-1',
                name: 'Резервуарный парк нефти',
                capacity: 80000,
                warehouseType: 'OIL_TANK',
                zone: 'Нефть',
            },
        });
        const callDefs = [
            {
                key: '204N',
                vesselId: vesselBulk.id,
                voyage: '204N',
                berthId: berthBulk.id,
                status: 'DEPARTED',
                purpose: 'Погрузка угля на экспорт',
                eta: new Date('2026-05-20T10:00:00'),
                ata: new Date('2026-05-20T11:30:00'),
                atd: new Date('2026-05-22T18:00:00'),
            },
            {
                key: '205N',
                vesselId: vesselBulk.id,
                voyage: '205N',
                berthId: berthBulk.id,
                status: 'IN_OPERATION',
                purpose: 'Погрузка угля в Италию',
                eta: new Date('2026-05-24T08:00:00'),
                ata: new Date('2026-05-24T09:00:00'),
            },
            {
                key: '206N',
                vesselId: vesselBulk.id,
                voyage: '206N',
                berthId: berthBulk.id,
                status: 'DEPARTED',
                purpose: 'Рейс угля в Китай',
                eta: new Date('2026-05-10T10:00:00'),
                ata: new Date('2026-05-10T12:00:00'),
                atd: new Date('2026-05-12T16:00:00'),
            },
            {
                key: 'T101',
                vesselId: vesselTanker.id,
                voyage: 'T101',
                berthId: berthLiquid.id,
                status: 'BERTHED',
                purpose: 'Налив нефти (марка «Urals»)',
                eta: new Date('2026-05-23T14:00:00'),
                ata: new Date('2026-05-23T15:00:00'),
            },
            {
                key: 'T102',
                vesselId: vesselTanker.id,
                voyage: 'T102',
                berthId: berthLiquid.id,
                status: 'ARRIVED',
                purpose: 'Налив мазута',
                eta: new Date('2026-05-25T06:00:00'),
                ata: new Date('2026-05-25T07:30:00'),
            },
            {
                key: 'T103',
                vesselId: vesselTanker.id,
                voyage: 'T103',
                berthId: berthLiquid.id,
                status: 'DEPARTED',
                purpose: 'Экспорт мазута в Китай',
                eta: new Date('2026-05-05T08:00:00'),
                ata: new Date('2026-05-05T10:00:00'),
                atd: new Date('2026-05-07T20:00:00'),
            },
        ];
        const vesselCalls = {};
        for (const c of callDefs) {
            const existing = yield prisma.vesselCall.findFirst({
                where: { voyageNumber: c.voyage, vesselId: c.vesselId },
            });
            const call = existing !== null && existing !== void 0 ? existing : (yield prisma.vesselCall.create({
                data: {
                    vesselId: c.vesselId,
                    voyageNumber: c.voyage,
                    eta: c.eta,
                    etd: new Date(c.eta.getTime() + 86400000),
                    berthId: c.berthId,
                    status: c.status,
                    agent: 'Новороссийское судовое агентство',
                    purpose: c.purpose,
                    ata: c.ata,
                    atd: c.atd,
                },
            }));
            if (existing) {
                yield prisma.vesselCall.update({
                    where: { id: existing.id },
                    data: { status: c.status, ata: c.ata, atd: c.atd, berthId: c.berthId },
                });
            }
            vesselCalls[c.key] = call.id;
        }
        return {
            berthBulkId: berthBulk.id,
            berthLiquidId: berthLiquid.id,
            whCoalId: whCoal.id,
            whOilId: whOil.id,
            vesselBulkId: vesselBulk.id,
            vesselTankerId: vesselTanker.id,
            vesselCalls,
        };
    });
}
function clearCargoData() {
    return __awaiter(this, void 0, void 0, function* () {
        yield prisma.cargoTrackingEvent.deleteMany();
        yield prisma.cargoTracking.deleteMany();
        yield prisma.materialFlow.deleteMany();
        yield prisma.routeStage.deleteMany();
        yield prisma.logisticsRoute.deleteMany();
        yield prisma.wagon.deleteMany();
        yield prisma.container.deleteMany();
        yield prisma.logisticsOrder.deleteMany();
    });
}
function seedMockBatches(infra) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a, _b, _c, _d, _e, _f;
        const kuzbass = yield prisma.counterparty.findUnique({ where: { code: 'KUZBASS-COAL' } });
        const lukoil = yield prisma.counterparty.findUnique({ where: { code: 'LUKOIL-NPZ' } });
        const orderCoal = yield prisma.logisticsOrder.create({
            data: {
                orderNumber: 'ILS-2026-COAL',
                orderType: 'EXPORT_BULK',
                managementLevel: 'DISPATCH',
                status: 'IN_PROGRESS',
                counterpartyId: kuzbass.id,
                supplierName: 'АО «Кузбассуголь»',
                cargoDescription: 'Экспорт угля (5 партий)',
                cargoWeight: 21600,
                origin: 'Кузбасс',
                destination: 'Мерсин · Циндао · Таранто',
                plannedStart: new Date('2026-05-15'),
                actualStart: new Date('2026-05-16'),
                vesselCallId: infra.vesselCalls['204N'],
                notes: 'Групповой заказ на уголь',
            },
        });
        const orderOil = yield prisma.logisticsOrder.create({
            data: {
                orderNumber: 'ILS-2026-OIL',
                orderType: 'EXPORT_BULK',
                managementLevel: 'DISPATCH',
                status: 'IN_PROGRESS',
                counterpartyId: lukoil.id,
                supplierName: 'ЛУКОЙЛ-НПЗ',
                cargoDescription: 'Экспорт нефти и нефтепродуктов',
                cargoWeight: 23800,
                origin: 'Самара (НПЗ)',
                destination: 'Мерсин · Циндао · Таранто',
                plannedStart: new Date('2026-05-14'),
                actualStart: new Date('2026-05-15'),
                vesselCallId: infra.vesselCalls['T101'],
                notes: 'Групповой заказ на нефть',
            },
        });
        for (const batch of MOCK_BATCHES) {
            const isCoal = batch.cargoCategory === 'COAL';
            const orderId = isCoal ? orderCoal.id : orderOil.id;
            const whId = batch.warehouseKey === 'coal'
                ? infra.whCoalId
                : batch.warehouseKey === 'oil'
                    ? infra.whOilId
                    : undefined;
            const vesselCallId = batch.vesselCallKey
                ? infra.vesselCalls[batch.vesselCallKey]
                : undefined;
            const stageType = stageTypeForProgress(batch.progress);
            const containerStatus = batch.progress === 'delivered' ? 'DELIVERED' : (0, cargoStatusFromStage_1.cargoStatusFromStageType)(stageType);
            const container = yield prisma.container.create({
                data: {
                    containerNumber: batch.containerNumber,
                    containerType: batch.containerType,
                    cargoCategory: batch.cargoCategory,
                    status: containerStatus,
                    supplierName: batch.supplierName,
                    cargoDescription: batch.cargoDescription,
                    quantityTons: batch.quantityTons,
                    quantityUnit: 'TON',
                    grossWeight: batch.quantityTons,
                    warehouseId: whId,
                    location: batch.location,
                    portOfLoading: batch.portOfLoading,
                    portOfDischarge: batch.portOfDischarge,
                    vesselCallId,
                    logisticsOrderId: orderId,
                    blNumber: batch.blNumber,
                },
            });
            if (batch.wagon) {
                const wagonStatus = (_a = (0, syncTransportWithCargoStage_1.wagonStatusForStage)(stageType)) !== null && _a !== void 0 ? _a : 'EXPECTED';
                yield prisma.wagon.create({
                    data: {
                        number: batch.wagon.number,
                        wagonType: batch.cargoCategory === 'COAL' ? 'GONDOLA' : 'TANK',
                        cargo: batch.cargoDescription,
                        cargoWeight: Math.round(batch.quantityTons / 60),
                        warehouseId: whId,
                        track: batch.wagon.track,
                        trainNumber: batch.wagon.trainNumber,
                        arrivalAt: new Date(Date.now() - 86400000),
                        departureAt: wagonStatus === 'DEPARTED' ? new Date() : undefined,
                        status: wagonStatus,
                        containerId: container.id,
                    },
                });
            }
            const stageOverrides = {
                supplierName: batch.supplierName,
                supplierCode: batch.origin,
                warehouseName: batch.location ? `Склад / ${batch.location}` : undefined,
                shipName: batch.vesselCallKey
                    ? `Рейс ${batch.vesselCallKey}`
                    : undefined,
                destPortCode: batch.destCode,
                destPortName: batch.destName,
            };
            const stages = buildStagesForProgress(batch.progress, stageOverrides);
            const route = yield prisma.logisticsRoute.create({
                data: {
                    routeNumber: batch.routeNumber,
                    name: batch.routeName,
                    orderId,
                    origin: batch.origin,
                    destination: batch.destName,
                    routeKind: 'EXPORT',
                    status: batch.progress === 'delivered' ? 'COMPLETED' : 'ACTIVE',
                    stages: {
                        create: stages.map((s) => ({
                            sequence: s.sequence,
                            stageType: s.stageType,
                            locationCode: s.locationCode,
                            locationName: s.locationName,
                            transportMode: s.transportMode,
                            status: s.status,
                            plannedAt: new Date(),
                            actualAt: s.actualAt,
                        })),
                    },
                },
                include: { stages: { orderBy: { sequence: 'asc' } } },
            });
            const currentStage = batch.progress === 'delivered'
                ? route.stages[route.stages.length - 1]
                : route.stages.find((s) => s.sequence === batch.progress);
            const trackingStatus = batch.progress === 'delivered' ? 'DELIVERED' : 'AT_STAGE';
            const events = route.stages
                .filter((s) => batch.progress === 'delivered'
                ? true
                : s.sequence <= batch.progress)
                .map((s, i, arr) => {
                var _a;
                return ({
                    toStageId: s.id,
                    fromStageId: i > 0 ? arr[i - 1].id : undefined,
                    eventAt: (_a = s.actualAt) !== null && _a !== void 0 ? _a : new Date(),
                    description: `Этап: ${s.locationName}`,
                });
            });
            yield prisma.cargoTracking.create({
                data: {
                    containerId: container.id,
                    routeId: route.id,
                    currentStageId: currentStage === null || currentStage === void 0 ? void 0 : currentStage.id,
                    status: trackingStatus,
                    notes: `Мок-данные: ${batch.cargoDescription}`,
                    events: { create: events },
                },
            });
            if (batch.progress !== 'delivered' && batch.progress >= 2) {
                const atWarehouse = batch.progress >= 3;
                yield prisma.materialFlow.create({
                    data: {
                        orderId,
                        containerId: container.id,
                        flowType: atWarehouse ? 'STORAGE' : 'ARRIVAL',
                        transportMode: atWarehouse ? 'WAREHOUSE' : 'RAIL',
                        quantity: batch.quantityTons,
                        unit: 'TON',
                        fromLocation: atWarehouse
                            ? ((_c = (_b = batch.wagon) === null || _b === void 0 ? void 0 : _b.track) !== null && _c !== void 0 ? _c : 'Ж/д фронт')
                            : batch.origin,
                        toLocation: atWarehouse
                            ? ((_d = batch.location) !== null && _d !== void 0 ? _d : 'Склад терминала')
                            : ((_f = (_e = batch.wagon) === null || _e === void 0 ? void 0 : _e.track) !== null && _f !== void 0 ? _f : 'Ж/д фронт'),
                        description: atWarehouse
                            ? `Перемещение на склад после ж/д: ${batch.cargoDescription}`
                            : `Ж/д поступление ${batch.origin} → терминал: ${batch.cargoDescription}`,
                        performedAt: new Date(),
                    },
                });
            }
        }
        yield (0, ils_1.logInfoFlow)({
            ilsFunction: 'PLANNING',
            eventType: 'CREATE',
            entityType: 'LOGISTICS_ORDER',
            entityId: orderCoal.id,
            orderId: orderCoal.id,
            message: 'Seed: 10 партий груза с маршрутами ж/д → терминал → море',
        });
    });
}
function seedUsers() {
    return __awaiter(this, void 0, void 0, function* () {
        yield prisma.user.upsert({
            where: { username: 'admin' },
            update: {},
            create: {
                username: 'admin',
                passwordHash: yield bcryptjs_1.default.hash('admin', 10),
                role: 'ADMIN',
                fullName: 'Администратор ИЛС',
                department: 'ИТ',
            },
        });
        yield prisma.user.upsert({
            where: { username: 'dispatcher' },
            update: {},
            create: {
                username: 'dispatcher',
                passwordHash: yield bcryptjs_1.default.hash('dispatcher', 10),
                role: 'DISPATCHER',
                fullName: 'Диспетчер угольно-нефтяного терминала',
                department: 'Диспетчерская',
            },
        });
    });
}
function main() {
    return __awaiter(this, void 0, void 0, function* () {
        yield seedUsers();
        yield seedCounterparties();
        yield seedDirectories();
        const infra = yield seedTerminalInfrastructure();
        yield clearCargoData();
        yield seedMockBatches(infra);
        console.log(`ILS seed completed: ${MOCK_BATCHES.length} cargo batches`);
    });
}
main()
    .catch((e) => {
    console.error(e);
    process.exit(1);
})
    .finally(() => prisma.$disconnect());
