export class SiteError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "SiteError";
  }
}

export class SiteAlreadyExistsError extends SiteError {
  constructor(siteUrl: string) {
    super(`Site with URL "${siteUrl}" already exists`);
    this.name = "SiteAlreadyExistsError";
  }
}

export enum SiteInputError {
  MissingPemHeader = "Key must start with standard PEM header",
  InvalidPublicKeyFormat = "Not a valid PEM-encoded public key",
  InvalidPublicKeyType = "Not an ED25519 public key",
}
