import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import type { EntityManager } from 'typeorm';
import { Repository } from 'typeorm';
import { Organization } from '../models/organization.model';
import { OrganizationRepository } from './organization-repository.interface';
import { RedisCacheService } from '../../redis/redis-cache.service';

type OrganizationCache = Omit<Organization, 'createdAt' | 'updatedAt'> & {
  createdAt?: string;
  updatedAt?: string;
};

const organizationCacheKey = (id: string) => `org:${id}`;

@Injectable()
export class TypeOrmOrganizationRepository implements OrganizationRepository {
  constructor(
    @InjectRepository(Organization)
    private readonly repository: Repository<Organization>,
    private readonly cache: RedisCacheService,
  ) {}

  findById(id: string, manager?: EntityManager): Promise<Organization | null> {
    const repo = manager ? manager.getRepository(Organization) : this.repository;

    return this.findWithCache(repo, id);
  }

  save(
    organization: Organization,
    manager?: EntityManager,
  ): Promise<Organization> {
    const repo = manager ? manager.getRepository(Organization) : this.repository;

    return repo.save(organization).then(async (saved) => {
      await this.cache.setJson(
        organizationCacheKey(saved.id),
        this.toCache(saved),
      );
      return saved;
    });
  }

  private async findWithCache(
    repo: Repository<Organization>,
    id: string,
  ): Promise<Organization | null> {
    const cached = await this.cache.getJson<OrganizationCache>(
      organizationCacheKey(id),
    );
    if (cached) {
      return repo.create(this.fromCache(cached));
    }

    const organization = await repo.findOne({ where: { id } });
    if (organization) {
      await this.cache.setJson(
        organizationCacheKey(id),
        this.toCache(organization),
      );
    }

    return organization;
  }

  private toCache(organization: Organization): OrganizationCache {
    return {
      ...organization,
      createdAt: organization.createdAt?.toISOString(),
      updatedAt: organization.updatedAt?.toISOString(),
    };
  }

  private fromCache(cache: OrganizationCache): Organization {
    return {
      ...cache,
      createdAt: new Date(cache.createdAt ?? 0),
      updatedAt: new Date(cache.updatedAt ?? 0),
    };
  }
}
