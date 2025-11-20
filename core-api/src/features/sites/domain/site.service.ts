import { SiteAlreadyExistsError } from "./site.error";
import { SiteRepository } from "./site.repository";
import { CreateSiteInput, RepoCreateSiteInput, Site, SiteStatus } from "./site.types";

export class SiteService {
  constructor(private readonly repo: SiteRepository) { }

  async registerSite(input: CreateSiteInput): Promise<Site> {
    const status = this.validateUsdDomain(input.adminEmail);

    const repoInput: RepoCreateSiteInput = {
      ...input,
      status,
    };

    return await this.repo.create(repoInput);
  }

  private validateUsdDomain(adminEmail: string): SiteStatus {
    if (adminEmail.endsWith('@usd21.org')) {
      return SiteStatus.Active;
    }
    return SiteStatus.Pending
  }
}
