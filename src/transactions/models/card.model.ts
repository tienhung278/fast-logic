import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity({ name: 'cards' })
export class Card {
  @PrimaryColumn({ type: 'varchar', length: 64 })
  id: string;

  @Index({ unique: true })
  @Column({ type: 'varchar', length: 19 })
  cardNumber: string;

  @Column({ type: 'varchar', length: 64 })
  organizationId: string;

  @Column({ type: 'integer' })
  dailyLimitCents: number;

  @Column({ type: 'integer' })
  monthlyLimitCents: number;

  @Column({ type: 'integer', default: 0 })
  dailyUsedCents: number;

  @Column({ type: 'integer', default: 0 })
  monthlyUsedCents: number;

  @Column({ type: 'varchar', length: 10, nullable: true })
  dailyUsageDate: string | null;

  @Column({ type: 'varchar', length: 7, nullable: true })
  monthlyUsageDate: string | null;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;
}
