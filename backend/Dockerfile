FROM node:20-alpine

# OpenSSL / compat — necessário para o Prisma no Linux (Railway)
RUN apk add --no-cache openssl libc6-compat

WORKDIR /app

COPY package*.json ./
ENV NODE_ENV=production
RUN npm ci --include=dev

COPY . .

# Cliente Prisma antes do tsc (tipos Role, AppointmentWhereInput, etc.)
RUN npx prisma generate

RUN npm run build

EXPOSE 3335

CMD ["sh", "-c", "npx prisma migrate deploy && npm run start"]
