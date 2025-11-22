import { SiteRepository } from "./repositories/site.repository";
import {
  CreateSiteInput,
  RepoCreateSiteInput,
  Site,
  SiteStatus,
} from "./site.types";
import { makeSafe } from "../common/make-safe";
import { CreateSiteInputSchema } from "./site.validation";

export class SiteService {
  constructor(private readonly repo: SiteRepository) {}

  private _registerSiteLogic = async (
    input: CreateSiteInput,
  ): Promise<Site> => {
    const status = this.validateUsdDomain(input.adminEmail);

    const repoInput: RepoCreateSiteInput = {
      ...input,
      status,
    };

    return await this.repo.create(repoInput);
  };

  private validateUsdDomain(adminEmail: string): SiteStatus {
    if (adminEmail.endsWith("@usd21.org")) {
      return SiteStatus.Active;
    }
    return SiteStatus.Pending;
  }

  public registerSite = makeSafe(
    CreateSiteInputSchema,
    this._registerSiteLogic,
  );
}
