FROM node:18-alpine

WORKDIR /app

# Копируем package.json
COPY package*.json ./
COPY prisma ./prisma/

# Устанавливаем зависимости
RUN npm install

# Копируем остальные файлы
COPY . .

# Генерируем Prisma Client
RUN npx prisma generate

# Открываем порт
EXPOSE 3001

# Запускаем миграции и сервер
CMD ["sh", "-c", "npx prisma migrate deploy && npm start"]
