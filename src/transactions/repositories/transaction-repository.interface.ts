import type { EntityManager } from 'typeorm';
import { Transaction } from '../models/transaction.model';

export interface TransactionRepository {
  create(
    transaction: Transaction,
    manager?: EntityManager,
  ): Promise<Transaction>;
  findAll(): Promise<Transaction[]>;
}
