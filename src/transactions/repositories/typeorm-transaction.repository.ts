import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import type { EntityManager } from 'typeorm';
import { Repository } from 'typeorm';
import { Transaction } from '../models/transaction.model';
import { TransactionRepository } from './transaction-repository.interface';

@Injectable()
export class TypeOrmTransactionRepository implements TransactionRepository {
  constructor(
    @InjectRepository(Transaction)
    private readonly repository: Repository<Transaction>,
  ) {}

  create(
    transaction: Transaction,
    manager?: EntityManager,
  ): Promise<Transaction> {
    const repo = manager ? manager.getRepository(Transaction) : this.repository;
    const entity = repo.create(transaction);
    return repo.save(entity);
  }

  findAll(): Promise<Transaction[]> {
    return this.repository.find();
  }
}
