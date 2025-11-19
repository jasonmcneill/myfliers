import { SiteRepository } from "./site.repository";
import { CreateSiteInput, Site } from "./site.types";

export class SiteService {
  constructor(private readonly repo: SiteRepository) { }

  async registerSite(input: CreateSiteInput): Promise<Site> {
    throw new Error("Not done");
  }
}
