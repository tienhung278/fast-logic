import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Card } from './models/card.model';
import { Organization } from './models/organization.model';
import { Transaction } from './models/transaction.model';
import {
  CARD_REPOSITORY,
  ORGANIZATION_REPOSITORY,
  TRANSACTION_REPOSITORY,
  UNIT_OF_WORK,
} from './repositories/repository.tokens';
import { TypeOrmCardRepository } from './repositories/typeorm-card.repository';
import { TypeOrmOrganizationRepository } from './repositories/typeorm-organization.repository';
import { TypeOrmTransactionRepository } from './repositories/typeorm-transaction.repository';
import { TypeOrmUnitOfWork } from './repositories/typeorm-unit-of-work';
import { TransactionsController } from './transactions.controller';
import { TransactionsSeedService } from './transactions.seed';
import { TransactionsService } from './transactions.service';

@Module({
  imports: [TypeOrmModule.forFeature([Organization, Card, Transaction])],
  controllers: [TransactionsController],
  providers: [
    TransactionsService,
    {
      provide: ORGANIZATION_REPOSITORY,
      useClass: TypeOrmOrganizationRepository,
    },
    {
      provide: CARD_REPOSITORY,
      useClass: TypeOrmCardRepository,
    },
    {
      provide: TRANSACTION_REPOSITORY,
      useClass: TypeOrmTransactionRepository,
    },
    {
      provide: UNIT_OF_WORK,
      useClass: TypeOrmUnitOfWork,
    },
    TransactionsSeedService,
  ],
  exports: [TransactionsService],
})
export class TransactionsModule {}
