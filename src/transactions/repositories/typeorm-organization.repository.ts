import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import type { EntityManager } from 'typeorm';
import { Repository } from 'typeorm';
import { Organization } from '../models/organization.model';
import { OrganizationRepository } from './organization-repository.interface';

@Injectable()
export class TypeOrmOrganizationRepository implements OrganizationRepository {
  constructor(
    @InjectRepository(Organization)
    private readonly repository: Repository<Organization>,
  ) {}

  findById(id: string, manager?: EntityManager): Promise<Organization | null> {
    const repo = manager ? manager.getRepository(Organization) : this.repository;
    return repo.findOne({ where: { id } });
  }

  save(
    organization: Organization,
    manager?: EntityManager,
  ): Promise<Organization> {
    const repo = manager ? manager.getRepository(Organization) : this.repository;
    return repo.save(organization);
  }
}
