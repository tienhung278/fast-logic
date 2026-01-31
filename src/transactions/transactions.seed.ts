import { Inject, Injectable, OnModuleInit } from '@nestjs/common';
import { Card } from './models/card.model';
import { Organization } from './models/organization.model';
import type { CardRepository } from './repositories/card-repository.interface';
import type { OrganizationRepository } from './repositories/organization-repository.interface';
import {
  CARD_REPOSITORY,
  ORGANIZATION_REPOSITORY,
} from './repositories/repository.tokens';

@Injectable()
export class TransactionsSeedService implements OnModuleInit {
  constructor(
    @Inject(ORGANIZATION_REPOSITORY)
    private readonly organizationRepository: OrganizationRepository,
    @Inject(CARD_REPOSITORY)
    private readonly cardRepository: CardRepository,
  ) {}

  async onModuleInit(): Promise<void> {
    const baseDate = new Date('2026-01-01T00:00:00Z');

    const organizationId = 'org_acme';
    const existingOrg =
      await this.organizationRepository.findById(organizationId);

    if (!existingOrg) {
      const organization = new Organization();
      organization.id = organizationId;
      organization.name = 'Acme Logistics';
      organization.balanceCents = 500_000;
      organization.currency = 'USD';
      organization.createdAt = baseDate;
      organization.updatedAt = baseDate;
      await this.organizationRepository.save(organization);
    }

    await this.ensureCard({
      id: 'card_1001',
      cardNumber: '4111111111111111',
      organizationId,
      dailyLimitCents: 20_000,
      monthlyLimitCents: 300_000,
      baseDate,
    });

    await this.ensureCard({
      id: 'card_1002',
      cardNumber: '5555555555554444',
      organizationId,
      dailyLimitCents: 50_000,
      monthlyLimitCents: 500_000,
      baseDate,
    });
  }

  private async ensureCard(params: {
    id: string;
    cardNumber: string;
    organizationId: string;
    dailyLimitCents: number;
    monthlyLimitCents: number;
    baseDate: Date;
  }): Promise<void> {
    const existingCard = await this.cardRepository.findByCardNumber(
      params.cardNumber,
    );
    if (existingCard) {
      return;
    }

    const card = new Card();
    card.id = params.id;
    card.cardNumber = params.cardNumber;
    card.organizationId = params.organizationId;
    card.dailyLimitCents = params.dailyLimitCents;
    card.monthlyLimitCents = params.monthlyLimitCents;
    card.dailyUsedCents = 0;
    card.monthlyUsedCents = 0;
    card.dailyUsageDate = null;
    card.monthlyUsageDate = null;
    card.createdAt = params.baseDate;
    card.updatedAt = params.baseDate;

    await this.cardRepository.save(card);
  }
}
