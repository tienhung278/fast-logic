import type { EntityManager } from 'typeorm';
import { Organization } from '../models/organization.model';

export interface OrganizationRepository {
  findById(id: string, manager?: EntityManager): Promise<Organization | null>;
  save(
    organization: Organization,
    manager?: EntityManager,
  ): Promise<Organization>;
}
