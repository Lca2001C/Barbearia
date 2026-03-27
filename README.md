# BarberShop - Sistema de Gestão para Barbearia

Sistema completo de gestão para barbearias com agendamento online, pagamento via PIX, dashboard administrativo e notificações push.

## Stack Tecnológica

| Camada     | Tecnologia                                      |
| ---------- | ----------------------------------------------- |
| Backend    | Node.js, Express, TypeScript, Prisma ORM        |
| Banco      | PostgreSQL 16                                   |
| Frontend   | Next.js 14 (App Router), Tailwind CSS, Axios    |
| Pagamentos | Mercado Pago (API PIX)                          |
| Infra      | Docker, Docker Compose                          |

## Funcionalidades

- **Agendamento**: Fluxo completo de escolha de serviço, barbeiro, data e horário com prevenção de conflitos
- **Dashboard Admin**: Visão de receita, agendamentos, clientes e barbeiros
- **Pagamento PIX**: Geração de QR Code e código copia-e-cola via Mercado Pago
- **Notificações Push**: Lembretes de agendamentos via Web Push
- **Autenticação JWT**: Access token + refresh token com controle por papel (Admin/Cliente)
- **Segurança**: Helmet, CORS, rate limiting, bcrypt, validação com Zod

## Estrutura do Projeto

```
Barbearia/
├── docker-compose.yml
├── .env.example
├── backend/
│   ├── prisma/
│   │   ├── schema.prisma         # Schema do banco de dados
│   │   └── seed.ts               # Dados iniciais
│   └── src/
│       ├── config/               # Configuração (env, prisma client)
│       ├── shared/
│       │   ├── errors/           # AppError
│       │   ├── middlewares/      # Auth, validação, error handler
│       │   └── utils/            # Hash de senhas
│       └── modules/
│           ├── auth/             # Registro, login, refresh token
│           ├── users/            # Perfil do usuário
│           ├── barbers/          # CRUD barbeiros + disponibilidade
│           ├── services/         # CRUD serviços
│           ├── appointments/     # Agendamentos
│           ├── payments/         # PIX e webhooks
│           ├── notifications/    # Push notifications
│           └── dashboard/        # Estatísticas admin
└── frontend/
    └── src/
        ├── app/                  # Pages (Next.js App Router)
        │   ├── (auth)/           # Login e registro
        │   ├── booking/          # Fluxo de agendamento
        │   ├── my-appointments/  # Agendamentos do cliente
        │   └── admin/            # Painel administrativo
        ├── components/           # Componentes reutilizáveis
        ├── contexts/             # AuthContext
        ├── hooks/                # usePushNotifications
        └── lib/                  # API client, auth helpers
```

## Início Rápido (Docker)

### Pré-requisitos

- [Docker](https://docs.docker.com/get-docker/) e [Docker Compose](https://docs.docker.com/compose/install/)

### Passos

1. Clone o repositório e entre na pasta:

```bash
cd Barbearia
```

2. Copie o arquivo de variáveis de ambiente:

```bash
cp .env.example .env
```

3. Suba todos os serviços com um único comando:

```bash
docker-compose up --build
```

4. Em outro terminal, rode as migrações e o seed:

```bash
docker-compose exec backend npx prisma migrate dev --name init
docker-compose exec backend npm run prisma:seed
```

5. Acesse a aplicação:

| Serviço                | URL/Porta                                    |
| ---------------------- | --------------------------------------------- |
| Frontend (HTTPS)       | https://localhost:8443                       |
| API (HTTPS)            | https://localhost:8443/api                   |
| Frontend (HTTP proxy)  | http://localhost:8080                        |
| API (HTTP proxy)       | http://localhost:8080/api                    |
| PostgreSQL             | localhost:5434                               |
| Prisma                 | `docker-compose exec backend npx prisma studio` |

> O ambiente usa **Caddy** como proxy reverso com TLS local (`tls internal`), fazendo a terminação HTTPS.
> `frontend` e `backend` ficam na rede interna do Docker e são roteados pelo proxy.

### Credenciais do Admin (seed)

- **Email**: admin@barbearia.com
- **Senha**: admin123

## Desenvolvimento Local (sem Docker)

### Pré-requisitos

- Node.js 20+
- PostgreSQL 16+

### Backend

```bash
cd backend
cp .env.example .env          # Edite com suas credenciais do banco
npm install
npx prisma generate
npx prisma migrate dev --name init
npm run prisma:seed
npm run dev                    # http://localhost:3335
```

### Frontend

```bash
cd frontend
cp .env.example .env.local
npm install
npm run dev                    # http://localhost:3100
```

## Variáveis de Ambiente

### Backend (`backend/.env`)

| Variável                   | Descrição                             | Obrigatório |
| -------------------------- | ------------------------------------- | ----------- |
| DATABASE_URL               | URL de conexão do PostgreSQL          | Sim         |
| JWT_SECRET                 | Chave secreta para access tokens      | Sim         |
| JWT_REFRESH_SECRET         | Chave secreta para refresh tokens     | Sim         |
| PORT                       | Porta interna da API (padrão: 3335)   | Não         |
| CORS_ORIGIN                | Origens permitidas (separadas por vírgula) | Não    |
| FRONTEND_URL               | URL pública do frontend (HTTPS)       | Não         |
| COOKIE_SECURE              | Cookies apenas via HTTPS              | Não         |
| COOKIE_SAMESITE            | `lax`, `strict` ou `none`             | Não         |
| MERCADOPAGO_ACCESS_TOKEN   | Token de acesso da API Mercado Pago   | Não*        |
| VAPID_PUBLIC_KEY            | Chave pública VAPID (push)           | Não*        |
| VAPID_PRIVATE_KEY           | Chave privada VAPID (push)           | Não*        |
| VAPID_EMAIL                 | Email para VAPID                     | Não*        |

> *Sem o token do Mercado Pago, o sistema gera códigos PIX mock para testes.
> Para gerar chaves VAPID: `npx web-push generate-vapid-keys`

### Variáveis raiz (`.env`)

| Variável             | Descrição |
| -------------------- | --------- |
| APP_HTTP_PORT        | Porta HTTP do proxy Caddy (padrão: 8080) |
| APP_HTTPS_PORT       | Porta HTTPS do proxy Caddy (padrão: 8443) |
| APP_URL              | URL pública do frontend (HTTPS) |
| API_URL              | URL pública da API (HTTPS) |
| NEXT_PUBLIC_API_URL  | URL da API usada pelo frontend |

### Frontend (`frontend/.env.local`)

| Variável                        | Descrição                     |
| ------------------------------- | ----------------------------- |
| NEXT_PUBLIC_API_URL             | URL base da API               |
| NEXT_PUBLIC_VAPID_PUBLIC_KEY    | Chave pública VAPID (push)    |

## API Endpoints

### Autenticação
| Método | Rota              | Descrição          | Auth |
| ------ | ----------------- | ------------------ | ---- |
| POST   | /api/auth         | Registrar usuário  | Não  |
| POST   | /api/auth/login   | Login              | Não  |
| POST   | /api/auth/refresh | Renovar tokens     | Não  |

### Usuários
| Método | Rota           | Descrição           | Auth  |
| ------ | -------------- | ------------------- | ----- |
| GET    | /api/users/me  | Perfil do usuário   | Sim   |
| PUT    | /api/users/me  | Atualizar perfil    | Sim   |
| GET    | /api/users     | Listar usuários     | Admin |

### Barbeiros
| Método | Rota                               | Descrição             | Auth  |
| ------ | ---------------------------------- | --------------------- | ----- |
| GET    | /api/barbers                       | Listar barbeiros      | Não   |
| GET    | /api/barbers/:id                   | Detalhes do barbeiro  | Não   |
| GET    | /api/barbers/:id/availability      | Horários disponíveis  | Não   |
| POST   | /api/barbers                       | Criar barbeiro        | Admin |
| PUT    | /api/barbers/:id                   | Atualizar barbeiro    | Admin |
| DELETE | /api/barbers/:id                   | Desativar barbeiro    | Admin |
| PUT    | /api/barbers/:id/working-hours     | Configurar horários   | Admin |

### Serviços
| Método | Rota               | Descrição          | Auth  |
| ------ | ------------------ | ------------------ | ----- |
| GET    | /api/services      | Listar serviços    | Não   |
| POST   | /api/services      | Criar serviço      | Admin |
| PUT    | /api/services/:id  | Atualizar serviço  | Admin |
| DELETE | /api/services/:id  | Desativar serviço  | Admin |

### Agendamentos
| Método | Rota                                | Descrição              | Auth  |
| ------ | ----------------------------------- | ---------------------- | ----- |
| POST   | /api/appointments                   | Criar agendamento      | Sim   |
| GET    | /api/appointments                   | Listar agendamentos    | Sim   |
| GET    | /api/appointments/upcoming          | Próximos agendamentos  | Admin |
| GET    | /api/appointments/today             | Agendamentos de hoje   | Admin |
| GET    | /api/appointments/week              | Agendamentos da semana | Admin |
| GET    | /api/appointments/:id               | Detalhes               | Sim   |
| PATCH  | /api/appointments/:id/cancel        | Cancelar               | Sim   |
| PATCH  | /api/appointments/:id/complete      | Marcar como concluído  | Admin |

### Pagamentos
| Método | Rota                      | Descrição           | Auth |
| ------ | ------------------------- | ------------------- | ---- |
| POST   | /api/payments/pix         | Gerar código PIX    | Sim  |
| POST   | /api/payments/webhook     | Webhook Mercado Pago| Não  |
| GET    | /api/payments/:id/status  | Status do pagamento | Sim  |

### Dashboard
| Método | Rota                  | Descrição          | Auth  |
| ------ | --------------------- | ------------------ | ----- |
| GET    | /api/dashboard/stats  | Estatísticas       | Admin |

## Deploy

### Opção 1: Railway

1. Crie um projeto no [Railway](https://railway.app)
2. Adicione um serviço PostgreSQL
3. Conecte o repositório GitHub
4. Configure as variáveis de ambiente
5. Railway detecta automaticamente o Dockerfile

### Opção 2: Render

1. Crie um Web Service no [Render](https://render.com) para o backend
2. Crie um banco PostgreSQL no Render
3. Crie outro Web Service para o frontend
4. Configure as variáveis de ambiente em cada serviço

### Opção 3: Fly.io

```bash
# Backend
cd backend
fly launch
fly secrets set DATABASE_URL="..." JWT_SECRET="..." JWT_REFRESH_SECRET="..."

# Frontend
cd frontend
fly launch
fly secrets set NEXT_PUBLIC_API_URL="https://seu-backend.fly.dev/api"
```

## Troubleshooting (HTTPS e Docker)

- **Porta em uso**: ajuste `APP_HTTP_PORT`, `APP_HTTPS_PORT` e `DB_PORT` no `.env`.
- **Container com nome em conflito**: rode `docker-compose down` e depois `docker rm -f barbearia_web barbearia_api barbearia_db barbearia_proxy` se necessário.
- **Certificado local no navegador**: no primeiro acesso HTTPS, aceite o certificado local gerado pelo Caddy (ambiente de desenvolvimento).
- **API não responde no HTTPS**: confira se `barbearia_proxy`, `barbearia_api` e `barbearia_web` estão `Up` com `docker ps`.

## Licença

MIT
