FROM node:22-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci
ARG DATABASE_URL=mysql://username:password@localhost:3306/book_store?allowPublicKeyRetrieval=true
ENV DATABASE_URL=$DATABASE_URL

COPY . .

RUN npx prisma generate
RUN npm run build

FROM node:22-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --omit=dev

COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/dist ./dist

CMD ["node", "dist/src/main.js"]