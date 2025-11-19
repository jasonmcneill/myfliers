import { SiteRepository } from "./site.repository";
import { CreateSiteInput, RepoCreateSiteInput, Site, SiteStatus } from "./site.types";

export class SiteService {
  constructor(private readonly repo: SiteRepository) { }

  async registerSite(input: CreateSiteInput): Promise<Site> {
    const repoInput: RepoCreateSiteInput = {
      ...input,
      status: SiteStatus.Pending,
    };

    return await this.repo.create(repoInput);
  }
}
