import { config } from 'dotenv';
import { resolve } from 'path';
import { getEnvPath } from '../../common/helper/env.helper';
import { DataSourceOptions } from 'typeorm';

const envFilePath: string = getEnvPath(
  resolve(process.cwd(), 'src', 'common', 'envs'),
);
config({ path: envFilePath });

const databaseUrl = process.env.DATABASE_URL?.trim();
const useDatabaseUrl = Boolean(
  databaseUrl && databaseUrl !== 'undefined' && databaseUrl !== 'null',
);
const sslEnabled =
  process.env.DATABASE_SSL?.toLowerCase() === 'true' ||
  process.env.DATABASE_SSL?.toLowerCase() === 'require';
const configuredEntities = (process.env.DATABASE_ENTITIES ?? '')
  .split(',')
  .map((entry) => entry.trim())
  .filter(Boolean);
const configuredMigrations = (process.env.DATABASE_MIGRATIONS ?? '')
  .split(',')
  .map((entry) => entry.trim())
  .filter(Boolean);

const fallbackEntities = [
  'dist/src/database/entities/*.entity.js',
  'dist/database/entities/*.entity.js',
  'src/database/entities/*.entity.js',
];

const fallbackMigrations = [
  'dist/src/database/migration/history/*.js',
  'dist/database/migration/history/*.js',
];

export const dataSourceOptions: DataSourceOptions = {
  type: 'postgres',
  ...(useDatabaseUrl
    ? {
        url: databaseUrl,
        ssl: sslEnabled ? { rejectUnauthorized: false } : undefined,
      }
    : {
        host: process.env.DATABASE_HOST,
        port: parseInt(process.env.DATABASE_PORT, 10),
        database: process.env.DATABASE_NAME,
        username: process.env.DATABASE_USER,
        password: process.env.DATABASE_PASSWORD,
      }),
  entities:
    configuredEntities.length > 0
      ? [...configuredEntities, ...fallbackEntities]
      : fallbackEntities,
  migrations:
    configuredMigrations.length > 0
      ? [...configuredMigrations, ...fallbackMigrations]
      : fallbackMigrations,
  logger: 'simple-console',
  synchronize: false, // never use TRUE in production!
  logging: true, // for debugging in dev Area only
};
