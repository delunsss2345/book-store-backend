FROM node:22-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci
ARG DATABASE_URL=mysql://username:password@localhost:3306/book_store?allowPublicKeyRetrieval=true
ENV DATABASE_URL=$DATABASE_URL
RUN npx prisma generate

COPY . .

RUN npm run build 
RUN npm prune --production

FROM node:22-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --omit=dev

COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/prisma.config.ts ./prisma.config.ts
COPY --from=builder /app/node_modules ./node_modules 
COPY --from=builder /app/dist ./dist

CMD ["node", "dist/src/main.js"]