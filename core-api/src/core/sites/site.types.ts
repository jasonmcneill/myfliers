// Internal representation of the site data
export type Site = {
  id: string;
  siteName: string;
  siteUrl: string;
  adminEmail: string;
  publicKey: string;
  status: SiteStatus,
  adapterMetadata?: Record<string, unknown>; // Generic json bucket
  createdAt: Date;
};

// Data about the site that came from an adapter
export type CreateSiteInput = {
  siteName: string;
  siteUrl: string;
  adminEmail: string;
  publicKey: string;
  adapterMetadata?: Record<string, unknown>; // Generic json bucket
};

export type CreateSiteOutput = Promise<Site>;

export enum SiteStatus {
  Pending = 'pending',
  Active = 'active',
}

// Appending additional internal data to the adapter data
export type RepoCreateSiteInput = CreateSiteInput & {
  status: SiteStatus;
}
