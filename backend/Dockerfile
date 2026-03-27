FROM node:20-alpine

RUN apk add --no-cache openssl libc6-compat

WORKDIR /app

COPY package*.json ./
ENV NODE_ENV=production
RUN npm ci --include=dev

COPY prisma ./prisma
RUN npx prisma generate

COPY . .
RUN npm run build

EXPOSE 3335

CMD ["sh", "-c", "npx prisma migrate deploy && npm run start"]
