import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryColumn,
} from 'typeorm';
import { TransactionRejectionCode } from './transaction-rejection-code';
import { TransactionStatus } from './transaction-status';

@Entity({ name: 'transactions' })
export class Transaction {
  @PrimaryColumn({ type: 'varchar', length: 64 })
  id: string;

  @Column({ type: 'varchar', length: 64, nullable: true })
  organizationId?: string | null;

  @Column({ type: 'varchar', length: 64, nullable: true })
  cardId?: string | null;

  @Column({ type: 'varchar', length: 19 })
  cardNumber: string;

  @Column({ type: 'integer' })
  amountCents: number;

  @Column({ type: 'varchar', length: 64 })
  stationId: string;

  @Column({ type: 'varchar', length: 128, nullable: true })
  stationName?: string | null;

  @Column({ type: 'timestamptz' })
  occurredAt: Date;

  @Column({ type: 'enum', enum: TransactionStatus })
  status: TransactionStatus;

  @Column({ type: 'enum', enum: TransactionRejectionCode, nullable: true })
  rejectionCode?: TransactionRejectionCode | null;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;
}
