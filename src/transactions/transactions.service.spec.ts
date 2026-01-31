import { Test, TestingModule } from '@nestjs/testing';
import { TransactionsService } from './transactions.service';
import type { EntityManager } from 'typeorm';
import { TransactionRejectionCode } from './models/transaction-rejection-code';
import { toDayKey, toMonthKey } from './utils/date-utils';
import type { CardRepository } from './repositories/card-repository.interface';
import type { OrganizationRepository } from './repositories/organization-repository.interface';
import type { TransactionRepository } from './repositories/transaction-repository.interface';
import {
  CARD_REPOSITORY,
  ORGANIZATION_REPOSITORY,
  TRANSACTION_REPOSITORY,
  UNIT_OF_WORK,
} from './repositories/repository.tokens';
import { Card } from './models/card.model';
import { Organization } from './models/organization.model';
import { Transaction } from './models/transaction.model';
import type { UnitOfWork } from './repositories/unit-of-work.interface';

const basePayload = {
  cardNumber: '4111111111111111',
  amount: 10,
  occurredAt: '2026-01-15T10:00:00.000Z',
  stationId: 'station_123',
  stationName: 'Shell Downtown',
};

const baseDate = new Date('2026-01-01T00:00:00Z');

const createOrganization = (): Organization => {
  const organization = new Organization();
  organization.id = 'org_acme';
  organization.name = 'Acme Logistics';
  organization.balanceCents = 500_000;
  organization.currency = 'USD';
  organization.createdAt = baseDate;
  organization.updatedAt = baseDate;
  return organization;
};

const createCard = (): Card => {
  const card = new Card();
  card.id = 'card_1001';
  card.cardNumber = basePayload.cardNumber;
  card.organizationId = 'org_acme';
  card.dailyLimitCents = 20_000;
  card.monthlyLimitCents = 300_000;
  card.dailyUsedCents = 0;
  card.monthlyUsedCents = 0;
  card.dailyUsageDate = null;
  card.monthlyUsageDate = null;
  card.createdAt = baseDate;
  card.updatedAt = baseDate;
  return card;
};

class MockOrganizationRepository implements OrganizationRepository {
  private readonly organizations = new Map<string, Organization>();

  constructor(seed: Organization[]) {
    for (const organization of seed) {
      this.organizations.set(organization.id, organization);
    }
  }

  async findById(
    id: string,
    _manager?: EntityManager,
  ): Promise<Organization | null> {
    return this.organizations.get(id) ?? null;
  }

  async save(
    organization: Organization,
    _manager?: EntityManager,
  ): Promise<Organization> {
    this.organizations.set(organization.id, organization);
    return organization;
  }
}

class MockCardRepository implements CardRepository {
  private readonly cards = new Map<string, Card>();

  constructor(seed: Card[]) {
    for (const card of seed) {
      this.cards.set(card.cardNumber, card);
    }
  }

  async findById(id: string, _manager?: EntityManager): Promise<Card | null> {
    for (const card of this.cards.values()) {
      if (card.id === id) {
        return card;
      }
    }
    return null;
  }

  async findByCardNumber(
    cardNumber: string,
    _manager?: EntityManager,
  ): Promise<Card | null> {
    return this.cards.get(cardNumber) ?? null;
  }

  async save(card: Card, _manager?: EntityManager): Promise<Card> {
    this.cards.set(card.cardNumber, card);
    return card;
  }
}

class MockTransactionRepository implements TransactionRepository {
  private readonly transactions: Transaction[] = [];

  async create(
    transaction: Transaction,
    _manager?: EntityManager,
  ): Promise<Transaction> {
    this.transactions.push(transaction);
    return transaction;
  }

  async findAll(): Promise<Transaction[]> {
    return [...this.transactions];
  }
}

describe('TransactionsService', () => {
  let service: TransactionsService;
  let cardRepository: CardRepository;
  let organizationRepository: OrganizationRepository;

  beforeEach(async () => {
    const organizationRepositoryImpl = new MockOrganizationRepository([
      createOrganization(),
    ]);
    const cardRepositoryImpl = new MockCardRepository([createCard()]);
    const transactionRepositoryImpl = new MockTransactionRepository();

    const mockUnitOfWork: UnitOfWork = {
      runInTransaction: async <T>(
        work: (manager: EntityManager) => Promise<T>,
      ): Promise<T> => work({} as EntityManager),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TransactionsService,
        {
          provide: UNIT_OF_WORK,
          useValue: mockUnitOfWork,
        },
        {
          provide: ORGANIZATION_REPOSITORY,
          useValue: organizationRepositoryImpl,
        },
        {
          provide: CARD_REPOSITORY,
          useValue: cardRepositoryImpl,
        },
        {
          provide: TRANSACTION_REPOSITORY,
          useValue: transactionRepositoryImpl,
        },
      ],
    }).compile();

    service = module.get(TransactionsService);
    cardRepository = module.get(CARD_REPOSITORY);
    organizationRepository = module.get(ORGANIZATION_REPOSITORY);
  });

  it('approves a valid transaction and updates balances', async () => {
    const response = await service.processTransaction({ ...basePayload });

    expect(response.status).toBe('approved');
    expect(response.code).toBe('APPROVED');
    expect(response.balanceCents).toBe(499_000);
    expect(response.cardUsage?.dailyUsedCents).toBe(1_000);
    expect(response.cardUsage?.monthlyUsedCents).toBe(1_000);
  });

  it('rejects when organization balance is insufficient', async () => {
    const organization = await organizationRepository.findById('org_acme');
    if (!organization) throw new Error('Seed organization missing');
    organization.balanceCents = 500;
    await organizationRepository.save(organization);

    const response = await service.processTransaction({
      ...basePayload,
      amount: 10,
    });

    expect(response.status).toBe('rejected');
    expect(response.code).toBe(TransactionRejectionCode.InsufficientBalance);
  });

  it('resets daily usage when transaction occurs on a new day', async () => {
    const card = await cardRepository.findByCardNumber(basePayload.cardNumber);
    if (!card) throw new Error('Seed card missing');

    const previousDay = new Date('2026-01-14T10:00:00.000Z');
    card.dailyUsageDate = toDayKey(previousDay);
    card.monthlyUsageDate = toMonthKey(previousDay);
    card.dailyUsedCents = 5_000;
    card.monthlyUsedCents = 5_000;
    await cardRepository.save(card);

    const response = await service.processTransaction({
      ...basePayload,
      amount: 20,
    });

    expect(response.status).toBe('approved');
    expect(response.cardUsage?.dailyUsedCents).toBe(2_000);
    expect(response.cardUsage?.monthlyUsedCents).toBe(7_000);
  });
});
