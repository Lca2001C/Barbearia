FROM node:20-alpine

# Instala dependências necessárias para o Prisma rodar no Linux (Railway)
RUN apk add --no-cache openssl libc6-compat

WORKDIR /app

# 1. Copia os arquivos de configuração primeiro para aproveitar o cache
COPY package*.json ./

# 2. Instala as dependências
RUN npm install

# 3. COPIA TUDO (Isso garante que a pasta prisma e todo o código entrem na imagem)
COPY . .

# 4. Agora o comando vai achar a pasta prisma porque o 'COPY . .' já trouxe ela
RUN npx prisma generate

EXPOSE 3333

# Roda as migrações e inicia o app
CMD ["sh", "-c", "npx prisma migrate deploy && npm run dev"]