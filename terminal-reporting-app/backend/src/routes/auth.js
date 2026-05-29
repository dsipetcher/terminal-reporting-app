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
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const prisma_1 = __importDefault(require("../lib/prisma"));
const auth_1 = require("../middleware/auth");
const router = express_1.default.Router();
function sanitizeUser(user) {
    return {
        id: user.id,
        username: user.username,
        role: user.role,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
    };
}
router.post('/login', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { username, password } = req.body;
        if (!username || !password) {
            return res.status(400).json({ error: 'Укажите логин и пароль' });
        }
        const user = yield prisma_1.default.user.findUnique({ where: { username } });
        if (!user || !(yield bcryptjs_1.default.compare(password, user.passwordHash))) {
            return res.status(401).json({ error: 'Неверный логин или пароль' });
        }
        const token = jsonwebtoken_1.default.sign({ userId: user.id, username: user.username, role: user.role }, auth_1.JWT_SECRET, { expiresIn: '24h' });
        res.json({ token, user: sanitizeUser(user) });
    }
    catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Ошибка входа в систему' });
    }
}));
router.get('/me', auth_1.authenticateToken, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const user = yield prisma_1.default.user.findUnique({ where: { id: req.user.userId } });
        if (!user) {
            return res.status(404).json({ error: 'Пользователь не найден' });
        }
        res.json(sanitizeUser(user));
    }
    catch (error) {
        console.error('Get current user error:', error);
        res.status(500).json({ error: 'Не удалось получить данные пользователя' });
    }
}));
router.get('/users', auth_1.authenticateToken, (0, auth_1.requireRole)('ADMIN'), (_req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const users = yield prisma_1.default.user.findMany({
            orderBy: { createdAt: 'asc' },
            select: {
                id: true,
                username: true,
                role: true,
                createdAt: true,
                updatedAt: true,
            },
        });
        res.json(users);
    }
    catch (error) {
        console.error('List users error:', error);
        res.status(500).json({ error: 'Не удалось загрузить список пользователей' });
    }
}));
router.post('/users', auth_1.authenticateToken, (0, auth_1.requireRole)('ADMIN'), (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { username, password, role } = req.body;
        if (!username || !password) {
            return res.status(400).json({ error: 'Укажите логин и пароль' });
        }
        if (role && !['ADMIN', 'USER'].includes(role)) {
            return res.status(400).json({ error: 'Роль должна быть ADMIN или USER' });
        }
        const existing = yield prisma_1.default.user.findUnique({ where: { username } });
        if (existing) {
            return res.status(409).json({ error: 'Пользователь с таким логином уже существует' });
        }
        const passwordHash = yield bcryptjs_1.default.hash(password, 10);
        const user = yield prisma_1.default.user.create({
            data: {
                username,
                passwordHash,
                role: role || 'USER',
            },
        });
        res.status(201).json(sanitizeUser(user));
    }
    catch (error) {
        console.error('Create user error:', error);
        res.status(500).json({ error: 'Не удалось создать пользователя' });
    }
}));
router.put('/users/:id', auth_1.authenticateToken, (0, auth_1.requireRole)('ADMIN'), (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const id = Number(req.params.id);
        if (Number.isNaN(id)) {
            return res.status(400).json({ error: 'Некорректный идентификатор пользователя' });
        }
        const { password, role } = req.body;
        if (role && !['ADMIN', 'USER'].includes(role)) {
            return res.status(400).json({ error: 'Роль должна быть ADMIN или USER' });
        }
        if (password && password.length < 4) {
            return res.status(400).json({ error: 'Пароль должен содержать не менее 4 символов' });
        }
        const data = {};
        if (role)
            data.role = role;
        if (password)
            data.passwordHash = yield bcryptjs_1.default.hash(password, 10);
        if (Object.keys(data).length === 0) {
            return res.status(400).json({ error: 'Нет данных для обновления' });
        }
        const user = yield prisma_1.default.user.update({
            where: { id },
            data,
        });
        res.json(sanitizeUser(user));
    }
    catch (error) {
        console.error('Update user error:', error);
        res.status(500).json({ error: 'Не удалось обновить пользователя' });
    }
}));
router.delete('/users/:id', auth_1.authenticateToken, (0, auth_1.requireRole)('ADMIN'), (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const id = Number(req.params.id);
        if (Number.isNaN(id)) {
            return res.status(400).json({ error: 'Некорректный идентификатор пользователя' });
        }
        if (req.user.userId === id) {
            return res.status(400).json({ error: 'Нельзя удалить свою учётную запись' });
        }
        yield prisma_1.default.user.delete({ where: { id } });
        res.status(204).send();
    }
    catch (error) {
        console.error('Delete user error:', error);
        res.status(500).json({ error: 'Не удалось удалить пользователя' });
    }
}));
exports.default = router;
