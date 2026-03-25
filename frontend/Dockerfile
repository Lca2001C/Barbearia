FROM node:20-alpine

WORKDIR /app

COPY package.json package-lock.json ./
# Instalar devDependencies (TypeScript, @types) — necessário para `next dev` no container
ENV NODE_ENV=development
RUN npm ci

COPY . .

EXPOSE 3000

CMD ["npm", "run", "dev"]
