import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import type { EntityManager } from 'typeorm';
import { Repository } from 'typeorm';
import { Card } from '../models/card.model';
import { CardRepository } from './card-repository.interface';
import { RedisCacheService } from '../../redis/redis-cache.service';

type CardCache = Omit<Card, 'createdAt' | 'updatedAt'> & {
  createdAt?: string;
  updatedAt?: string;
};

const cardNumberCacheKey = (cardNumber: string) => `card:number:${cardNumber}`;
const cardIdCacheKey = (id: string) => `card:id:${id}`;

@Injectable()
export class TypeOrmCardRepository implements CardRepository {
  constructor(
    @InjectRepository(Card)
    private readonly repository: Repository<Card>,
    private readonly cache: RedisCacheService,
  ) {}

  findById(id: string, manager?: EntityManager): Promise<Card | null> {
    const repo = manager ? manager.getRepository(Card) : this.repository;

    return this.findWithCache(repo, id);
  }

  findByCardNumber(
    cardNumber: string,
    manager?: EntityManager,
  ): Promise<Card | null> {
    const repo = manager ? manager.getRepository(Card) : this.repository;

    return this.findByNumberWithCache(repo, cardNumber);
  }

  save(card: Card, manager?: EntityManager): Promise<Card> {
    const repo = manager ? manager.getRepository(Card) : this.repository;
    return repo.save(card).then(async (saved) => {
      await this.cache.setJson(cardIdCacheKey(saved.id), this.toCache(saved));
      await this.cache.setJson(
        cardNumberCacheKey(saved.cardNumber),
        this.toCache(saved),
      );
      return saved;
    });
  }

  private async findWithCache(
    repo: Repository<Card>,
    id: string,
  ): Promise<Card | null> {
    const cached = await this.cache.getJson<CardCache>(cardIdCacheKey(id));
    if (cached) {
      return repo.create(this.fromCache(cached));
    }

    const card = await repo.findOne({ where: { id } });
    if (card) {
      await this.cache.setJson(cardIdCacheKey(id), this.toCache(card));
      await this.cache.setJson(
        cardNumberCacheKey(card.cardNumber),
        this.toCache(card),
      );
    }

    return card;
  }

  private async findByNumberWithCache(
    repo: Repository<Card>,
    cardNumber: string,
  ): Promise<Card | null> {
    const cached = await this.cache.getJson<CardCache>(
      cardNumberCacheKey(cardNumber),
    );
    if (cached) {
      return repo.create(this.fromCache(cached));
    }

    const card = await repo.findOne({ where: { cardNumber } });
    if (card) {
      await this.cache.setJson(cardIdCacheKey(card.id), this.toCache(card));
      await this.cache.setJson(
        cardNumberCacheKey(card.cardNumber),
        this.toCache(card),
      );
    }

    return card;
  }

  private toCache(card: Card): CardCache {
    return {
      ...card,
      createdAt: card.createdAt?.toISOString(),
      updatedAt: card.updatedAt?.toISOString(),
    };
  }

  private fromCache(cache: CardCache): Card {
    return {
      ...cache,
      createdAt: new Date(cache.createdAt ?? 0),
      updatedAt: new Date(cache.updatedAt ?? 0),
    };
  }
}
