import * as Joi from 'joi';

export const envValidationSchema = Joi.object({
  PORT: Joi.number().default(3000),
  NODE_ENV: Joi.string()
    .valid('development', 'test', 'production')
    .default('development'),
  API_PREFIX: Joi.string().default('api'),
  SWAGGER_PATH: Joi.string().default('docs'),
  CORS_ORIGIN: Joi.string().default(
    'http://localhost:3001,http://localhost:5173',
  ),
  POSTGRES_HOST: Joi.string().hostname().default('localhost'),
  POSTGRES_PORT: Joi.number().default(5432),
  POSTGRES_DB: Joi.string().default('sinav_ligi'),
  POSTGRES_USER: Joi.string().default('postgres'),
  POSTGRES_PASSWORD: Joi.string().allow('').default('postgres'),
  POSTGRES_SSL: Joi.string().valid('true', 'false').default('false'),
  DATABASE_URL: Joi.string()
    .uri({ scheme: ['postgresql', 'postgres'] })
    .optional(),
  REDIS_HOST: Joi.string().hostname().default('localhost'),
  REDIS_PORT: Joi.number().default(6379),
  REDIS_PASSWORD: Joi.string().allow('').default(''),
  JWT_ACCESS_SECRET: Joi.string().default(
    'change-me-access-secret-min-32-chars',
  ),
  JWT_REFRESH_SECRET: Joi.string().default(
    'change-me-refresh-secret-min-32-chars',
  ),
  JWT_ACCESS_EXPIRES_IN: Joi.string().default('15m'),
  JWT_REFRESH_EXPIRES_IN: Joi.string().default('7d'),
  GOOGLE_CLIENT_ID: Joi.string().allow('').default(''),
  APPLE_APP_ID: Joi.string().allow('').default(''),
  PAYTR_MERCHANT_ID: Joi.string().allow('').default(''),
  PAYTR_MERCHANT_KEY: Joi.string().allow('').default(''),
  PAYTR_MERCHANT_SALT: Joi.string().allow('').default(''),
  PAYTR_TEST_MODE: Joi.number().valid(0, 1).default(1),
  PAYTR_SUCCESS_URL: Joi.string()
    .uri()
    .allow('')
    .default('http://localhost:3001/payment/success'),
  PAYTR_FAIL_URL: Joi.string()
    .uri()
    .allow('')
    .default('http://localhost:3001/payment/fail'),
  SMTP_HOST: Joi.string().hostname().allow('').default(''),
  SMTP_PORT: Joi.number().default(587),
  SMTP_USER: Joi.string().allow('').default(''),
  SMTP_PASS: Joi.string().allow('').default(''),
  SMTP_FROM: Joi.string().email().allow('').default('noreply@sinavligi.com'),
});
