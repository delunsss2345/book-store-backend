FROM node:22-alpine as builder

WORKDIR /app

COPY package*.json ./
RUN npm ci  

COPY . .
RUN npx prisma generate
RUN npm run build 

FROM node:22-alpine

WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev

COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/dist ./dist

CMD [ "node" , "dist/src/main"]
