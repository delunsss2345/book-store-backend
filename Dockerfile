FROM node:22-alpine
WORKDIR /app

COPY package*.json ./
RUN npm ci  
# Xoá node_modules cài lại

COPY . .
# Prisma reads DATABASE_URL while generating client at build-time.
# Use a dummy value so image build does not depend on runtime secrets.
RUN DATABASE_URL="mysql://root:root@localhost:3306/nest_auth" npx prisma generate && npm run build

EXPOSE 3301
CMD ["node", "dist/src/main.js"]
