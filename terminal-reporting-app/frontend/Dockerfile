FROM node:18-alpine

WORKDIR /app

# Копируем package.json
COPY package*.json ./

# Устанавливаем зависимости
RUN npm install

# Копируем остальные файлы
COPY . .

# Собираем приложение
RUN npm run build

# Открываем порт
EXPOSE 5173

# Запускаем preview сервер для production
CMD ["npm", "run", "preview", "--", "--host", "0.0.0.0"]
