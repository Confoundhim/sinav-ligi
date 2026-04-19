export const appConfig = () => ({
  app: {
    port: Number(process.env.PORT ?? 3000),
    nodeEnv: process.env.NODE_ENV ?? 'development',
    apiPrefix: process.env.API_PREFIX ?? 'api',
    swaggerPath: process.env.SWAGGER_PATH ?? 'docs',
    corsOrigin:
      process.env.CORS_ORIGIN?.split(',').map((origin) => origin.trim()) ?? [],
  },
  postgres: {
    host: process.env.POSTGRES_HOST ?? 'localhost',
    port: Number(process.env.POSTGRES_PORT ?? 5432),
    database: process.env.POSTGRES_DB ?? 'sinav_ligi',
    user: process.env.POSTGRES_USER ?? 'postgres',
    password: process.env.POSTGRES_PASSWORD ?? 'postgres',
    ssl: process.env.POSTGRES_SSL === 'true',
  },
  database: {
    url:
      process.env.DATABASE_URL ??
      `postgresql://${process.env.POSTGRES_USER ?? 'postgres'}:${process.env.POSTGRES_PASSWORD ?? 'postgres'}@${process.env.POSTGRES_HOST ?? 'localhost'}:${process.env.POSTGRES_PORT ?? '5432'}/${process.env.POSTGRES_DB ?? 'sinav_ligi'}?schema=public`,
  },
  redis: {
    host: process.env.REDIS_HOST ?? 'localhost',
    port: Number(process.env.REDIS_PORT ?? 6379),
    password: process.env.REDIS_PASSWORD || undefined,
  },
  jwt: {
    accessSecret:
      process.env.JWT_ACCESS_SECRET ?? 'change-me-access-secret-min-32-chars',
    refreshSecret:
      process.env.JWT_REFRESH_SECRET ?? 'change-me-refresh-secret-min-32-chars',
    accessExpiresIn: process.env.JWT_ACCESS_EXPIRES_IN ?? '15m',
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN ?? '7d',
  },
  google: {
    clientId: process.env.GOOGLE_CLIENT_ID ?? '',
  },
  apple: {
    appId: process.env.APPLE_APP_ID ?? '',
  },
  paytr: {
    merchantId: process.env.PAYTR_MERCHANT_ID ?? '',
    merchantKey: process.env.PAYTR_MERCHANT_KEY ?? '',
    merchantSalt: process.env.PAYTR_MERCHANT_SALT ?? '',
    testMode: Number(process.env.PAYTR_TEST_MODE ?? '1'),
    successUrl:
      process.env.PAYTR_SUCCESS_URL ?? 'http://localhost:3001/payment/success',
    failUrl: process.env.PAYTR_FAIL_URL ?? 'http://localhost:3001/payment/fail',
  },
  smtp: {
    host: process.env.SMTP_HOST ?? '',
    port: Number(process.env.SMTP_PORT ?? '587'),
    user: process.env.SMTP_USER ?? '',
    pass: process.env.SMTP_PASS ?? '',
    from: process.env.SMTP_FROM ?? 'noreply@sinavligi.com',
  },
});
