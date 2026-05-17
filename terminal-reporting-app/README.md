# 🚢 Terminal Operating System (TOS)

**Система управления операциями морского порта**

[![Deploy to GitHub Pages](https://github.com/yourusername/terminal-reporting-app/workflows/Deploy%20to%20GitHub%20Pages/badge.svg)](https://github.com/yourusername/terminal-reporting-app/actions)

---

## ⚡ Запуск за 10 секунд

### Windows:
```bash
start.bat
```

### Linux/Mac:
```bash
chmod +x start.sh
./start.sh
```

**Готово!** Приложение откроется автоматически на http://localhost:5173

> **Что делает скрипт:**  
> ✓ Проверяет Node.js  
> ✓ Устанавливает зависимости  
> ✓ Создает базу данных SQLite  
> ✓ Запускает миграции  
> ✓ Запускает backend (3001) и frontend (5173)  
> ✓ Открывает браузер

---

## 📋 Что включено

✅ **Полный функционал портовой системы:**
- 🚢 Морской фронт: суда, судозаходы, причалы
- 📦 Контейнеры: учет по ISO 6346
- 🚂 Вагоны: ж/д транспорт
- 🚛 Автотранспорт: тайм-слоты
- 🏭 Склады: управление с визуализацией
- 📊 Dashboard: статистика в реальном времени

✅ **3 способа развертывания:**
1. **SQLite** - без PostgreSQL (самый простой)
2. **Docker** - полная изоляция
3. **GitHub Pages + Railway** - публичный доступ

---

## 🎯 Способы развертывания

### 1️⃣ SQLite (Рекомендуется для начала)

**Преимущества:** Не требует установки PostgreSQL!

```bash
# Backend
cd backend
npm install
npx prisma migrate dev --name init
npm run dev

# Frontend (в новом терминале)
cd frontend
npm install
npm run dev
```

### 2️⃣ Docker Compose

**Преимущества:** Все в контейнерах, включая PostgreSQL

```bash
docker-compose up --build
```

### 3️⃣ GitHub Pages (Production)

**Преимущества:** Публичный доступ из интернета

См. подробности в [РАЗВЕРТЫВАНИЕ.md](./РАЗВЕРТЫВАНИЕ.md)

---

## 📚 Документация

📖 **[РАЗВЕРТЫВАНИЕ.md](./РАЗВЕРТЫВАНИЕ.md)** - 3 способа развертывания  
📖 **[ЗАПУСК.md](./ЗАПУСК.md)** - Детальная инструкция  
📖 **[ТРЕБОВАНИЯ.md](./ТРЕБОВАНИЯ.md)** - Полные требования  
📖 **[ПЛАН_РЕАЛИЗАЦИИ.md](./ПЛАН_РЕАЛИЗАЦИИ.md)** - План разработки  

---

## 🛠 Технологии

**Backend:**
- Node.js + TypeScript
- Express.js + Prisma ORM
- SQLite / PostgreSQL

**Frontend:**
- React 18 + TypeScript
- React Router v6
- Tailwind CSS

---

## 📂 Структура

```
terminal-reporting-app/
├── start.bat              # Запуск для Windows
├── start.sh               # Запуск для Linux/Mac
├── docker-compose.yml     # Docker конфигурация
├── backend/               # Node.js API
│   ├── Dockerfile
│   └── dev.db            # SQLite БД (создается автоматически)
├── frontend/              # React приложение
│   └── Dockerfile
└── docs/                  # Документация
```

---

## 🎨 Функции

### Dashboard
- Статистика в реальном времени
- Активные судозаходы
- Быстрый доступ

### Судозаходы
- Планирование ETA/ETD
- Назначение причалов
- Управление статусами

### Контейнеры
- Поиск по номеру ISO 6346
- 12 типов контейнеров
- Адресное хранение

### Вагоны & Автотранспорт
- Учет ж/д вагонов
- Тайм-слотирование
- Check-in/Check-out

---

## 🔧 Команды

### Backend
```bash
npm run dev              # Разработка
npx prisma studio        # Просмотр БД
npx prisma migrate dev   # Создать миграцию
```

### Frontend
```bash
npm run dev              # Разработка
npm run build            # Production сборка
npm run preview          # Предпросмотр
```

### Docker
```bash
docker-compose up        # Запуск
docker-compose down      # Остановка
docker-compose logs      # Логи
```

---

## 🌐 Развертывание на GitHub Pages

1. **Форкнуть репозиторий**
2. **Настроить Railway/Render для backend**
3. **Добавить VITE_API_URL в GitHub Secrets**
4. **Push в main branch** - автодеплой!

Подробности: [РАЗВЕРТЫВАНИЕ.md](./РАЗВЕРТЫВАНИЕ.md)

---

## 📊 API Endpoints

```
GET  /api/dashboard/stats       # Статистика
GET  /api/vessels               # Суда
GET  /api/vessel-calls          # Судозаходы
GET  /api/berths                # Причалы
GET  /api/containers            # Контейнеры
GET  /api/wagons                # Вагоны
GET  /api/trucks                # Автотранспорт
GET  /api/warehouses            # Склады
```

Полный список: [ЗАПУСК.md](./ЗАПУСК.md#api-endpoints)

---

## 🆘 Решение проблем

### База данных не создается?
```bash
cd backend
npx prisma migrate reset --force
npx prisma migrate dev --name init
```

### Порты заняты?
Измените порты в:
- Backend: `backend/src/index.ts` (3001)
- Frontend: `frontend/vite.config.ts` (5173)

### Миграции не работают?
Используйте SQLite вместо PostgreSQL:
```bash
# Уже настроено в schema.prisma!
npx prisma migrate dev --name init
```

---

## 📞 Поддержка

1. Проверьте [РАЗВЕРТЫВАНИЕ.md](./РАЗВЕРТЫВАНИЕ.md)
2. Используйте `start.bat` / `start.sh`
3. Попробуйте SQLite вместо PostgreSQL

---

## 🎓 Основано на реальных системах

- **Solvo.TOS** (№1 в России)
- **SeaTerminal**
- **Navis Horizon**
- Международные стандарты: ISO 6346, UN/EDIFACT

---

## ✅ Готово к использованию

Система полностью реализована и протестирована!

**Начните прямо сейчас:** Запустите `start.bat` (Windows) или `start.sh` (Linux/Mac)

---

**Terminal Operating System v1.0** 🚢⚓📦

*Разработано на основе лучших практик портовой индустрии*

