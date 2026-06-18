import { SequelizeModuleOptions } from '@nestjs/sequelize';
import { ConfigService } from '@nestjs/config';
// Statically import the Postgres driver. Sequelize loads it via a dynamic
// require() that bundlers/serverless tracers (Vercel) can't follow, so we
// import it here and pass it through `dialectModule` below.
import * as pg from 'pg';
import { User } from '../src/users/models/user.model';
import { LoanApplication } from '../src/applications/models/application.model';
import { BankConnection } from '../src/bank-connections/models/bank-connection.model';
import { AdminNote } from '../src/admin-notes/models/admin-note.model';
import { AuditLog } from '../src/audit-logs/models/audit-log.model';
import { Document } from '../src/documents/models/document.model';

/**
 * Builds the Sequelize connection options for the NestJS runtime.
 * Schema changes are owned by sequelize-cli migrations, so `synchronize`
 * is intentionally disabled here.
 */
export const buildSequelizeOptions = (
  config: ConfigService,
): SequelizeModuleOptions => {
  const databaseUrl = config.get<string>('DATABASE_URL');

  // Cloud Postgres providers (Neon, Supabase, RDS, …) require SSL. Enabled
  // automatically when a DATABASE_URL is used, or explicitly via DB_SSL=true.
  const useSsl = !!databaseUrl || config.get<string>('DB_SSL') === 'true';
  const dialectOptions = useSsl
    ? { ssl: { require: true, rejectUnauthorized: false } }
    : undefined;

  const common: SequelizeModuleOptions = {
    dialect: 'postgres',
    dialectModule: pg,
    models: [
      User,
      LoanApplication,
      BankConnection,
      AdminNote,
      AuditLog,
      Document,
    ],
    autoLoadModels: true,
    synchronize: false,
    logging: config.get<string>('DB_LOGGING') === 'true' ? console.log : false,
    ...(dialectOptions ? { dialectOptions } : {}),
  };

  // Prefer a single connection string when provided (e.g. Neon),
  // otherwise fall back to discrete DB_* variables.
  if (databaseUrl) {
    return { ...common, uri: databaseUrl };
  }

  return {
    ...common,
    host: config.get<string>('DB_HOST', 'localhost'),
    port: config.get<number>('DB_PORT', 5432),
    username: config.get<string>('DB_USERNAME', 'postgres'),
    password: config.get<string>('DB_PASSWORD', 'Mspabitra1@'),
    database: config.get<string>('DB_NAME', 'pet_selling'),
  };
};
