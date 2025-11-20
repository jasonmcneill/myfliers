import { beforeEach, describe, expect, it } from 'vitest';
import { SiteService } from './site.service.ts';
import { InMemorySiteRepository } from '../adapters/in-memory.repository.ts'
import { CreateSiteInput, SiteStatus } from './site.types.ts';
import { SiteAlreadyExistsError } from './site.error.ts';

describe('SiteService (Domain Logic)', () => {
  let repo: InMemorySiteRepository;
  let service: SiteService;

  const defaultInput: CreateSiteInput = {
    siteName: 'test site',
    siteUrl: 'https://test-site.com',
    adminEmail: 'test-admin@usd21.org',
    publicKey: 'random publicKey',
  };

  beforeEach(() => {
    repo = new InMemorySiteRepository();
    service = new SiteService(repo);
  });

  it('should create a new site', async () => {
    const result = await service.registerSite(defaultInput);

    expect(result.siteName).toBe('test site');
  })

  it('should auto-validate "usd21" domains', async () => {
    const result = await service.registerSite(defaultInput);

    expect(result.status).toBe(SiteStatus.Active);
  })

  it('should set non-"usd21" domains to pending', async () => {
    const nonValidEmailInput: CreateSiteInput = {
      ...defaultInput,
      adminEmail: 'test-admin@gmail.org',
    }

    const result = await service.registerSite(nonValidEmailInput);

    expect(result.status).toBe(SiteStatus.Pending);
  })

  it('should throw an error on duplicate sites', async () => {
    await service.registerSite(defaultInput);
    await expect(service.registerSite(defaultInput))
      .rejects
      .toThrow(SiteAlreadyExistsError);
  })

});
