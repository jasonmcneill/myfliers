import { SiteRepository } from "../domain/site.repository.ts";
import { RepoCreateSiteInput, Site } from "../domain/site.types.ts";

export class InMemorySiteRepository implements SiteRepository {
  private sites: Site[] = [];

  async create(input: RepoCreateSiteInput): Promise<Site> {
    const siteAlreadyExists = this.sites.find((site) =>
      site.siteUrl === input.siteUrl
    );
    if (siteAlreadyExists) {
      throw new Error("Site with this URL already exists");
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
