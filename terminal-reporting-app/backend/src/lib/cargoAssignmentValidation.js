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
exports.validateWagonContainerAssignment = validateWagonContainerAssignment;
exports.validateContainerVesselAssignment = validateContainerVesselAssignment;
function validateWagonContainerAssignment(db, containerId, wagonId) {
    return __awaiter(this, void 0, void 0, function* () {
        if (!containerId)
            return null;
        const cid = Number(containerId);
        const conflict = yield db.wagon.findFirst({
            where: Object.assign({ containerId: cid }, (wagonId ? { NOT: { id: Number(wagonId) } } : {})),
            select: { number: true },
        });
        if (conflict) {
            return `Партия уже привязана к вагону №${conflict.number}`;
        }
        if (wagonId) {
            const wagon = yield db.wagon.findUnique({
                where: { id: Number(wagonId) },
                select: { containerId: true, number: true },
            });
            if ((wagon === null || wagon === void 0 ? void 0 : wagon.containerId) && wagon.containerId !== cid) {
                return `Вагон №${wagon.number} уже привязан к другой партии`;
            }
        }
        return null;
    });
}
function validateContainerVesselAssignment(db, containerId, nextVesselCallId) {
    return __awaiter(this, void 0, void 0, function* () {
        if (!nextVesselCallId)
            return null;
        const container = yield db.container.findUnique({
            where: { id: containerId },
            select: { vesselCallId: true },
        });
        if (!container)
            return 'Партия не найдена';
        const nextId = Number(nextVesselCallId);
        if (container.vesselCallId && container.vesselCallId !== nextId) {
            return 'У партии уже назначен судозаход';
        }
        return null;
    });
}
