import { describe, expect, it } from "vitest";
import { ZodError } from "zod";
import { CreateSiteInput } from "./site.types.ts";
import { CreateSiteInputSchema } from "./site.validation.ts";
import { SiteInputError } from "./site.error.ts";

describe("Site Validation Testing", () => {
  const defaultInput: CreateSiteInput = {
    siteName: "evil site",
    siteUrl: "https://evil.com",
    adminEmail: "evil@evil.com",
    publicKey: "-----BEGIN PUBLIC KEY-----\n" +
      "MCowBQYDK2VwAyEAB3R5kkC5Xq0AHmkEA8wpfJ0YG56Psf/jPB1I0ioq/5I=\n" +
      "-----END PUBLIC KEY-----",
  };

  it("should reject an invalid public key string", async () => {
    const invalidPublicKeyInput = {
      ...defaultInput,
      publicKey: "invalid public key",
    };

    try {
      await CreateSiteInputSchema.parseAsync(invalidPublicKeyInput);
    } catch (err) {
      const zErr = err as ZodError;
      const hasCorrectError = zErr.issues.some(
        (issue) => issue.message === SiteInputError.MissingPem,
      );
      expect(hasCorrectError).toBe(true);
    }
  });

  it("should accept a valid public key string", async () => {
    await expect(CreateSiteInputSchema.parseAsync(defaultInput))
      .resolves
      .toBeDefined();
  });

  it("should reject an invalid public key string", async () => {
    const invalidPublicKeyWithPemHeader = {
      ...defaultInput,
      publicKey: "-----BEGIN PUBLIC KEY-----\ninvalid public key",
    };

    try {
      await CreateSiteInputSchema.parseAsync(invalidPublicKeyWithPemHeader);
    } catch (err) {
      const zErr = err as ZodError;
      const isCorrectError = zErr.issues.some(
        (issue) => issue.message === SiteInputError.InvalidPublicKeyFormat,
      );

      expect(isCorrectError).toBe(true);
    }
  });

  it("should reject a public key type that is not Ed25519", async () => {
    const notEd25519PublicKeyInput = {
      ...defaultInput,
      publicKey: "-----BEGIN PUBLIC KEY-----\n" +
        "MFkwEwYHKoZIzj0CAQYIKoZIzj0DAQcDQgAETzny6E1j0fbUrqa2aY4WopXx1SQLItMNeuLMbi3xJjOGTNZQMCUhAU8/wZggKYkbJUM6wW6v2/ox4lr6RjeukA==" +
        "\n-----END PUBLIC KEY-----",
    };

    try {
      await CreateSiteInputSchema.parseAsync(notEd25519PublicKeyInput);
    } catch (err) {
      const zErr = err as ZodError;
      const isCorrectError = zErr.issues.some(
        (issue) => issue.message === SiteInputError.InvalidPublicKeyType,
      );

      expect(isCorrectError).toBe(true);
    }
  });
});
