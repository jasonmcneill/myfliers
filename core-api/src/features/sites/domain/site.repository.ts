import { Site, RepoCreateSiteInput } from './site.types.ts'

export interface SiteRepository {
  create(repoCreateSiteInput: RepoCreateSiteInput): Promise<Site>;
}
