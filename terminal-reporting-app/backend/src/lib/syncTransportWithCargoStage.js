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
Object.defineProperty(exports, "__esModule", { value: true });
exports.wagonStatusForStage = wagonStatusForStage;
exports.vesselCallStatusForStage = vesselCallStatusForStage;
exports.syncTransportWithCargoStage = syncTransportWithCargoStage;
const WAGON_STATUS_ORDER = ['EXPECTED', 'ARRIVED', 'UNLOADING', 'LOADING', 'DEPARTED'];
const VESSEL_CALL_STATUS_ORDER = [
    'EXPECTED',
    'ARRIVED',
    'BERTHED',
    'IN_OPERATION',
    'DEPARTED',
    'CANCELLED',
];
function statusRank(order, status) {
    const idx = order.indexOf(status);
    return idx === -1 ? -1 : idx;
}
function shouldAdvanceStatus(current, next, order) {
    if (current === 'CANCELLED')
        return false;
    if (next === 'DEPARTED')
        return current !== 'DEPARTED' && current !== 'CANCELLED';
    return statusRank(order, next) > statusRank(order, current);
}
/** Ж/д вагон по этапу маршрута партии. */
function wagonStatusForStage(stageType) {
    switch (stageType) {
        case 'SUPPLIER':
            return 'EXPECTED';
        case 'RAIL_STATION':
            return 'ARRIVED';
        case 'WAREHOUSE':
            return 'UNLOADING';
        case 'BERTH':
        case 'SHIP':
        case 'PORT':
        case 'DELIVERED':
            return 'DEPARTED';
        default:
            return null;
    }
}
/** Судозаход по этапу маршрута партии. */
function vesselCallStatusForStage(stageType) {
    switch (stageType) {
        case 'BERTH':
            return 'BERTHED';
        case 'SHIP':
            return 'IN_OPERATION';
        case 'PORT':
        case 'DELIVERED':
            return 'DEPARTED';
        default:
            return null;
    }
}
function syncTransportWithCargoStage(db, containerId, stageType) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a;
        const container = yield db.container.findUnique({
            where: { id: containerId },
            select: { vesselCallId: true },
        });
        if (!container)
            return;
        const wagonStatus = wagonStatusForStage(stageType);
        if (wagonStatus) {
            const wagons = yield db.wagon.findMany({
                where: { containerId },
                select: { id: true, status: true },
            });
            const now = new Date();
            for (const wagon of wagons) {
                if (!shouldAdvanceStatus(wagon.status, wagonStatus, WAGON_STATUS_ORDER))
                    continue;
                yield db.wagon.update({
                    where: { id: wagon.id },
                    data: Object.assign(Object.assign({ status: wagonStatus }, (wagonStatus === 'ARRIVED' ? { arrivalAt: now } : {})), (wagonStatus === 'DEPARTED' ? { departureAt: now } : {})),
                });
            }
        }
        const vesselStatus = vesselCallStatusForStage(stageType);
        if (vesselStatus && container.vesselCallId) {
            const call = yield db.vesselCall.findUnique({
                where: { id: container.vesselCallId },
                select: { id: true, status: true, ata: true },
            });
            if (call && shouldAdvanceStatus(call.status, vesselStatus, VESSEL_CALL_STATUS_ORDER)) {
                const now = new Date();
                yield db.vesselCall.update({
                    where: { id: call.id },
                    data: Object.assign(Object.assign({ status: vesselStatus }, (vesselStatus === 'BERTHED' || vesselStatus === 'ARRIVED'
                        ? { ata: (_a = call.ata) !== null && _a !== void 0 ? _a : now }
                        : {})), (vesselStatus === 'DEPARTED' ? { atd: now } : {})),
                });
            }
        }
    });
}
