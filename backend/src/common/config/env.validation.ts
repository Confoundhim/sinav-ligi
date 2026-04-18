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
  REDIS_HOST: Joi.string().hostname().default('localhost'),
  REDIS_PORT: Joi.number().default(6379),
  REDIS_PASSWORD: Joi.string().allow('').default(''),
});
