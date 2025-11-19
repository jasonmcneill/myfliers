import { Site, RepoCreateSiteInput } from './site.types.ts'

export interface SiteRepository {
  create(input: RepoCreateSiteInput): Promise<Site>;
}
