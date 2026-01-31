import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import type { EntityManager } from 'typeorm';
import { Repository } from 'typeorm';
import { Card } from '../models/card.model';
import { CardRepository } from './card-repository.interface';

@Injectable()
export class TypeOrmCardRepository implements CardRepository {
  constructor(
    @InjectRepository(Card)
    private readonly repository: Repository<Card>,
  ) {}

  findById(id: string, manager?: EntityManager): Promise<Card | null> {
    const repo = manager ? manager.getRepository(Card) : this.repository;
    return repo.findOne({ where: { id } });
  }

  findByCardNumber(
    cardNumber: string,
    manager?: EntityManager,
  ): Promise<Card | null> {
    const repo = manager ? manager.getRepository(Card) : this.repository;
    return repo.findOne({ where: { cardNumber } });
  }

  save(card: Card, manager?: EntityManager): Promise<Card> {
    const repo = manager ? manager.getRepository(Card) : this.repository;
    return repo.save(card);
  }
}
