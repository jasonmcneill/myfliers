import { beforeEach, describe, expect, it } from 'vitest';
import { SiteService } from './site.service.ts';
import { InMemorySiteRepository } from '../adapters/in-memory.repository.ts'
import { CreateSiteInput } from './site.types.ts';

describe('SiteService (Domain Logic)', () => {
  let repo: InMemorySiteRepository;
  let service: SiteService;

  beforeEach(() => {
    repo = new InMemorySiteRepository();
    service = new SiteService(repo);
  });

  it('should create a new site', async () => {
    const input: CreateSiteInput = {
      siteName: 'test site',
      siteUrl: 'https://test-site.com',
      adminEmail: 'test-admin@usd21.org',
      publicKey: 'random publicKey',
    }

    const result = await service.registerSite(input);

    expect(result.siteName).toBe('test site');
  })

});
