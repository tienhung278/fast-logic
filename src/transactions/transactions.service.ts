import { Inject, Injectable, Logger } from '@nestjs/common';
import { randomUUID } from 'crypto';
import type { EntityManager } from 'typeorm';
import { TransactionWebhookDto } from './dto/transaction-webhook.dto';
import { TransactionResponseDto } from './dto/transaction-response.dto';
import { TransactionRejectionCode } from './models/transaction-rejection-code';
import { TransactionStatus } from './models/transaction-status';
import { Transaction } from './models/transaction.model';
import { parseIsoDate, toDayKey, toMonthKey } from './utils/date-utils';
import { Card } from './models/card.model';
import type { CardRepository } from './repositories/card-repository.interface';
import type { OrganizationRepository } from './repositories/organization-repository.interface';
import type { TransactionRepository } from './repositories/transaction-repository.interface';
import {
  CARD_REPOSITORY,
  ORGANIZATION_REPOSITORY,
  TRANSACTION_REPOSITORY,
  UNIT_OF_WORK,
} from './repositories/repository.tokens';
import type { UnitOfWork } from './repositories/unit-of-work.interface';

const APPROVED_CODE = 'APPROVED' as const;

type RejectionBase = {
  transactionId: string;
  amountCents: number;
  cardNumber: string;
  stationId: string;
  stationName?: string;
  occurredAt: Date;
};

@Injectable()
export class TransactionsService {
  private readonly logger = new Logger(TransactionsService.name);

  constructor(
    @Inject(ORGANIZATION_REPOSITORY)
    private readonly organizationRepository: OrganizationRepository,
    @Inject(CARD_REPOSITORY)
    private readonly cardRepository: CardRepository,
    @Inject(TRANSACTION_REPOSITORY)
    private readonly transactionRepository: TransactionRepository,
    @Inject(UNIT_OF_WORK)
    private readonly unitOfWork: UnitOfWork,
  ) {}

  async processTransaction(
    dto: TransactionWebhookDto,
  ): Promise<TransactionResponseDto> {
    const transactionId = `txn_${randomUUID()}`;
    const occurredAt = parseIsoDate(dto.occurredAt);
    const rawAmountCents = Math.round(dto.amount * 100);
    const safeAmountCents = Number.isFinite(rawAmountCents)
      ? rawAmountCents
      : 0;
    const rejectionBase: RejectionBase = {
      transactionId,
      amountCents: safeAmountCents,
      cardNumber: dto.cardNumber,
      stationId: dto.stationId,
      stationName: dto.stationName,
      occurredAt,
    };

    return this.unitOfWork.runInTransaction(async (manager) => {
      if (!Number.isFinite(rawAmountCents) || rawAmountCents <= 0) {
        return this.rejectWithCode(
          rejectionBase,
          TransactionRejectionCode.InvalidAmount,
          undefined,
          manager,
        );
      }
      const amountCents = rawAmountCents;

      const card = await this.cardRepository.findByCardNumber(
        dto.cardNumber,
        manager,
      );
      if (!card) {
        return this.rejectWithCode(
          rejectionBase,
          TransactionRejectionCode.CardNotFound,
          undefined,
          manager,
        );
      }

      const organization = await this.organizationRepository.findById(
        card.organizationId,
        manager,
      );
      if (!organization) {
        return this.rejectWithCode(
          rejectionBase,
          TransactionRejectionCode.OrganizationNotFound,
          { cardId: card.id },
          manager,
        );
      }

      this.resetUsageIfNeeded(card, occurredAt);

      if (organization.balanceCents < amountCents) {
        return this.rejectWithCode(
          rejectionBase,
          TransactionRejectionCode.InsufficientBalance,
          { cardId: card.id, organizationId: organization.id },
          manager,
        );
      }

      if (card.dailyUsedCents + amountCents > card.dailyLimitCents) {
        return this.rejectWithCode(
          rejectionBase,
          TransactionRejectionCode.DailyLimitExceeded,
          { cardId: card.id, organizationId: organization.id },
          manager,
        );
      }

      if (card.monthlyUsedCents + amountCents > card.monthlyLimitCents) {
        return this.rejectWithCode(
          rejectionBase,
          TransactionRejectionCode.MonthlyLimitExceeded,
          { cardId: card.id, organizationId: organization.id },
          manager,
        );
      }

      organization.balanceCents -= amountCents;
      card.dailyUsedCents += amountCents;
      card.monthlyUsedCents += amountCents;

      await this.organizationRepository.save(organization, manager);
      await this.cardRepository.save(card, manager);

      const transaction: Transaction = {
        id: transactionId,
        organizationId: organization.id,
        cardId: card.id,
        cardNumber: card.cardNumber,
        amountCents,
        stationId: dto.stationId,
        stationName: dto.stationName,
        occurredAt,
        status: TransactionStatus.Approved,
        createdAt: new Date(),
      };

      await this.transactionRepository.create(transaction, manager);

      return {
        status: TransactionStatus.Approved,
        code: APPROVED_CODE,
        message: 'Transaction approved',
        transactionId,
        balanceCents: organization.balanceCents,
        cardUsage: {
          dailyUsedCents: card.dailyUsedCents,
          monthlyUsedCents: card.monthlyUsedCents,
          dailyLimitCents: card.dailyLimitCents,
          monthlyLimitCents: card.monthlyLimitCents,
        },
      };
    });
  }

  private resetUsageIfNeeded(card: Card, occurredAt: Date): void {
    const dayKey = toDayKey(occurredAt);
    const monthKey = toMonthKey(occurredAt);

    if (card.dailyUsageDate !== dayKey) {
      card.dailyUsageDate = dayKey;
      card.dailyUsedCents = 0;
    }

    if (card.monthlyUsageDate !== monthKey) {
      card.monthlyUsageDate = monthKey;
      card.monthlyUsedCents = 0;
    }
  }

  private async rejectTransaction(
    params: {
      transactionId: string;
      amountCents: number;
      cardNumber: string;
      stationId: string;
      stationName?: string;
      occurredAt: Date;
      rejectionCode: TransactionRejectionCode;
      cardId?: string;
      organizationId?: string;
    },
    manager?: EntityManager,
  ): Promise<TransactionResponseDto> {
    const transaction: Transaction = {
      id: params.transactionId,
      organizationId: params.organizationId,
      cardId: params.cardId,
      cardNumber: params.cardNumber,
      amountCents: params.amountCents,
      stationId: params.stationId,
      stationName: params.stationName,
      occurredAt: params.occurredAt,
      status: TransactionStatus.Rejected,
      rejectionCode: params.rejectionCode,
      createdAt: new Date(),
    };

    await this.transactionRepository.create(transaction, manager);

    this.logger.warn(
      `Rejected transaction ${params.transactionId} card=${params.cardNumber} code=${params.rejectionCode}`,
    );

    return {
      status: TransactionStatus.Rejected,
      code: params.rejectionCode,
      message: this.mapRejectionMessage(params.rejectionCode),
      transactionId: params.transactionId,
    };
  }

  private rejectWithCode(
    base: RejectionBase,
    rejectionCode: TransactionRejectionCode,
    extras?: {
      cardId?: string;
      organizationId?: string;
    },
    manager?: EntityManager,
  ): Promise<TransactionResponseDto> {
    return this.rejectTransaction(
      {
        ...base,
        ...extras,
        rejectionCode,
      },
      manager,
    );
  }

  private mapRejectionMessage(code: TransactionRejectionCode): string {
    switch (code) {
      case TransactionRejectionCode.CardNotFound:
        return 'Card not found';
      case TransactionRejectionCode.OrganizationNotFound:
        return 'Organization not found';
      case TransactionRejectionCode.InsufficientBalance:
        return 'Insufficient organization balance';
      case TransactionRejectionCode.DailyLimitExceeded:
        return 'Daily limit exceeded';
      case TransactionRejectionCode.MonthlyLimitExceeded:
        return 'Monthly limit exceeded';
      case TransactionRejectionCode.InvalidAmount:
        return 'Invalid transaction amount';
      default:
        return 'Transaction rejected';
    }
  }
}
