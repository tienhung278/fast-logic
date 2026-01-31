import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { TransactionsModule } from './transactions/transactions.module';

const dbPortValue = Number.parseInt(process.env.DB_PORT ?? '5432', 10);
const dbPort = Number.isNaN(dbPortValue) ? 5432 : dbPortValue;

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.DB_HOST ?? 'localhost',
      port: dbPort,
      username: process.env.DB_USER ?? 'postgres',
      password: process.env.DB_PASSWORD ?? 'admin',
      database: process.env.DB_NAME ?? 'fast_logic',
      autoLoadEntities: true,
      synchronize: process.env.DB_SYNC !== 'false',
    }),
    TransactionsModule,
  ],
  controllers: [AppController],
  providers: [],
})
export class AppModule {}
