import { SiteAlreadyExistsError } from "../site.error.ts";
import { SiteRepository } from "./site.repository.ts";
import { RepoCreateSiteInput, Site } from "../site.types.ts";

export class InMemorySiteRepository implements SiteRepository {
  private sites: Site[] = [];

  async create(input: RepoCreateSiteInput): Promise<Site> {
    const siteAlreadyExists = this.sites.find((site) =>
      site.siteUrl === input.siteUrl
    );
    if (siteAlreadyExists) {
      throw new SiteAlreadyExistsError(input.siteUrl);
    }

    const newSite = {
      ...input,
      id: crypto.randomUUID(),
      createdAt: new Date(),
      status: input.status,
    };

    // Simulate DB cloning data
    const dbRecord = structuredClone(newSite);
    this.sites.push(dbRecord);

    // Simulate DB returning copy of data
    return structuredClone(dbRecord);
  }
}
