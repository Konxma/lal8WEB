import 'reflect-metadata';
import './env';
import { DataSource, DataSourceOptions } from 'typeorm';
import { join } from 'node:path';
export const databaseOptions: DataSourceOptions = {
 type: 'postgres', host: process.env.DB_HOST || '127.0.0.1',
 port: Number(process.env.DB_PORT || 5432), username: process.env.DB_USER || 'nest_user',
 password: process.env.DB_PASSWORD || 'nest_password', database: process.env.DB_NAME || 'lab8_store',
 entities: [join(__dirname, '../clothes/entities/*.entity.js')],
 migrations: [join(__dirname, 'migrations/*.js')], synchronize: false,
 logging: process.env.DB_LOGGING === 'true' ? ['query','schema','error'] : ['error'],
};
export default new DataSource(databaseOptions);
