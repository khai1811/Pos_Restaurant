FROM node:18-alpine

WORKDIR /app

# Copy các file khai báo dependencies
COPY package*.json ./
COPY prisma ./prisma/

# Cài đặt đầy đủ dependencies
RUN npm install

# Copy toàn bộ source code
COPY . .

# Generate Prisma Client & TSOA routes/spec
RUN npx prisma generate
RUN npx tsoa spec-and-routes

# Build TypeScript sang JavaScript
RUN npm run build

EXPOSE 5000

# Chạy sync database và khởi chạy đúng file server.js
CMD ["sh", "-c", "npx prisma db push && node dist/server.js"]