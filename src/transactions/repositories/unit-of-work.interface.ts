import type { EntityManager } from 'typeorm';

export interface UnitOfWork {
  runInTransaction<T>(
    work: (manager: EntityManager) => Promise<T>,
  ): Promise<T>;
}
