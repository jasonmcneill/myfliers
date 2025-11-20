export class SiteError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'SiteError';
  }
}

export class SiteAlreadyExistsError extends SiteError {
  constructor(siteUrl: string) {
    super(`Site with URL "${siteUrl}" already exists`);
    this.name = 'SiteAlreadyExistsError';
  }
}
