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
  entities: [process.env.DATABASE_ENTITIES],
  migrations: ['dist/database/migration/history/*.js'],
  logger: 'simple-console',
  synchronize: false, // never use TRUE in production!
  logging: true, // for debugging in dev Area only
};
