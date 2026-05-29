import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import prisma from '../lib/prisma';
import { authenticateToken, requireRole, JWT_SECRET } from '../middleware/auth';

const router = express.Router();

function sanitizeUser(user: { id: number; username: string; role: string; createdAt: Date; updatedAt: Date }) {
  return {
    id: user.id,
    username: user.username,
    role: user.role,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
}

router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: 'Укажите логин и пароль' });
    }

    const user = await prisma.user.findUnique({ where: { username } });

    if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
      return res.status(401).json({ error: 'Неверный логин или пароль' });
    }

    const token = jwt.sign(
      { userId: user.id, username: user.username, role: user.role },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({ token, user: sanitizeUser(user) });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Ошибка входа в систему' });
  }
});

router.get('/me', authenticateToken, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({ where: { id: req.user!.userId } });

    if (!user) {
      return res.status(404).json({ error: 'Пользователь не найден' });
    }

    res.json(sanitizeUser(user));
  } catch (error) {
    console.error('Get current user error:', error);
    res.status(500).json({ error: 'Не удалось получить данные пользователя' });
  }
});

router.get('/users', authenticateToken, requireRole('ADMIN'), async (_req, res) => {
  try {
    const users = await prisma.user.findMany({
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
  } catch (error) {
    console.error('List users error:', error);
    res.status(500).json({ error: 'Не удалось загрузить список пользователей' });
  }
});

router.post('/users', authenticateToken, requireRole('ADMIN'), async (req, res) => {
  try {
    const { username, password, role } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: 'Укажите логин и пароль' });
    }

    if (role && !['ADMIN', 'USER'].includes(role)) {
      return res.status(400).json({ error: 'Роль должна быть ADMIN или USER' });
    }

    const existing = await prisma.user.findUnique({ where: { username } });
    if (existing) {
      return res.status(409).json({ error: 'Пользователь с таким логином уже существует' });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: {
        username,
        passwordHash,
        role: role || 'USER',
      },
    });

    res.status(201).json(sanitizeUser(user));
  } catch (error) {
    console.error('Create user error:', error);
    res.status(500).json({ error: 'Не удалось создать пользователя' });
  }
});

router.put('/users/:id', authenticateToken, requireRole('ADMIN'), async (req, res) => {
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

    const data: { role?: string; passwordHash?: string } = {};
    if (role) data.role = role;
    if (password) data.passwordHash = await bcrypt.hash(password, 10);

    if (Object.keys(data).length === 0) {
      return res.status(400).json({ error: 'Нет данных для обновления' });
    }

    const user = await prisma.user.update({
      where: { id },
      data,
    });

    res.json(sanitizeUser(user));
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({ error: 'Не удалось обновить пользователя' });
  }
});

router.delete('/users/:id', authenticateToken, requireRole('ADMIN'), async (req, res) => {
  try {
    const id = Number(req.params.id);

    if (Number.isNaN(id)) {
      return res.status(400).json({ error: 'Некорректный идентификатор пользователя' });
    }

    if (req.user!.userId === id) {
      return res.status(400).json({ error: 'Нельзя удалить свою учётную запись' });
    }

    await prisma.user.delete({ where: { id } });
    res.status(204).send();
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ error: 'Не удалось удалить пользователя' });
  }
});

export default router;
