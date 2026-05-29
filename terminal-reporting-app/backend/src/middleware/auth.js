"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.JWT_SECRET = void 0;
exports.authenticateToken = authenticateToken;
exports.requireRole = requireRole;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const JWT_SECRET = process.env.JWT_SECRET || 'terminal-local-dev-secret';
exports.JWT_SECRET = JWT_SECRET;
function authenticateToken(req, res, next) {
    const authHeader = req.headers.authorization;
    const token = (authHeader === null || authHeader === void 0 ? void 0 : authHeader.startsWith('Bearer ')) ? authHeader.slice(7) : null;
    if (!token) {
        return res.status(401).json({ error: 'Требуется авторизация' });
    }
    try {
        const payload = jsonwebtoken_1.default.verify(token, JWT_SECRET);
        req.user = payload;
        next();
    }
    catch (_a) {
        return res.status(401).json({ error: 'Недействительный или просроченный токен' });
    }
}
function requireRole(role) {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({ error: 'Требуется авторизация' });
        }
        if (req.user.role !== role) {
            return res.status(403).json({ error: 'Недостаточно прав доступа' });
        }
        next();
    };
}
