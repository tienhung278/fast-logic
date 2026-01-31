import type { EntityManager } from 'typeorm';
import { Card } from '../models/card.model';

export interface CardRepository {
  findById(id: string, manager?: EntityManager): Promise<Card | null>;
  findByCardNumber(
    cardNumber: string,
    manager?: EntityManager,
  ): Promise<Card | null>;
  save(card: Card, manager?: EntityManager): Promise<Card>;
}
