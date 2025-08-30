import dotenvSafe from 'dotenv-safe';
import env from 'env-var';

dotenvSafe.config();

export const envs = {
    PORT: env.get('PORT').required().asPortNumber(),
    API_PREFIX: env.get('DEFAULT_API_PREFIX').default('/api/v1').asString(),
    NODE_ENV: env.get('NODE_ENV').default('development').asString(),
    
    DB_TYPE: env.get('DB_TYPE').default('mongodb').asString(),
    APP_NAME: env.get('APP_NAME').default('My Backend APP').asString(),
    APP_VERSION: env.get('APP_VERSION').default('1.0.0').asString(),
    APP_DESCRIPTION: env.get('APP_DESCRIPTION').default('This is my backend application').asString(),
    APP_AUTHOR: env.get('APP_AUTHOR').default('Barthez Kenwou').asString(),
    APP_LICENSE: env.get('APP_LICENSE').default('MIT').asString(),
    

    // Database
    DATABASE_URL: env.get('DATABASE_URL').required().asString(),
    MONGO_USER: env.get('MONGO_USER').required().asString(),
    MONGO_PASSWORD: env.get('MONGO_PASSWORD').required().asString(),
    MONGO_DB: env.get('MONGO_DB').required().asString(),

    // Redis
    MINIO_ROOT_USER: env.get('MINIO_ROOT_USER').required().asString(),
    MINIO_ROOT_PASSWORD: env.get('MINIO_ROOT_PASSWORD').required().asString(),

    // Redis
    REDIS_HOST: env.get('REDIS_HOST').required().asString(),
    REDIS_PORT: env.get('REDIS_PORT').required().asPortNumber(),

    // MailHog SMTP
    SMTP_HOST: env.get('SMTP_HOST').required().asString(),
    SMTP_PORT: env.get('SMTP_PORT').required().asPortNumber(),
    SMTP_USER: env.get('SMTP_USER').required().asString(),
    SMTP_PASS: env.get('SMTP_PASS').required().asString(),

    // Logging
    LOG_LEVEL: env.get('LOG_LEVEL').default('info').asString(),
    LOG_TO_FILE: env.get('LOG_TO_FILE').default('false').asBool(),
    LOG_TO_MONGODB: env.get('LOG_TO_MONGODB').default('false').asBool(),

    // Rate Limiting
    RATE_LIMIT_WINDOW_MS: env.get('RATE_LIMIT_WINDOW_MS').default(900000).asInt(),
    RATE_LIMIT_MAX_REQUESTS: env.get('RATE_LIMIT_MAX_REQUESTS').default(100).asInt(),
};
