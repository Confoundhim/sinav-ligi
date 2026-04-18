# Sınav Ligi Backend

NestJS tabanlı backend iskeleti. Proje, KPSS hazırlık platformu için modüler monolith yapıda hazırlandı.

## Teknoloji

- NestJS
- TypeScript strict mode
- PostgreSQL
- Redis
- Pino logger
- Swagger/OpenAPI
- Docker Compose

## Modüller

- `src/auth`
- `src/users`
- `src/exams`
- `src/questions`
- `src/payments`
- `src/rankings`
- `src/duels`
- `src/notifications`
- `src/admin`
- `src/wallet`
- `src/achievements`
- `src/common`
- `src/health`

## Kurulum

```bash
npm install
```

## Geliştirme

```bash
npm run start:dev
```

Uygulama varsayılan olarak `http://localhost:3000` üzerinde açılır.

- Health: `GET /health`
- Swagger UI: `GET /docs`

## Ortam Değişkenleri

Kök dizindeki örnek dosyayı kopyalayın:

```bash
copy ..\\.env.example ..\\.env
```

Uygulama `.env` olmadan da varsayılan değerlerle açılır. Veritabanı ve Redis kontrolü `/health` çağrısında raporlanır.

## Docker Compose

Kök dizinden çalıştırın:

```bash
docker compose up --build
```

Servisler:

- PostgreSQL 16
- Redis 7
- Backend (`npm run start:dev`)

## Doğrulama

```bash
npm run build
npm run lint
npm run test:e2e -- --runInBand
```