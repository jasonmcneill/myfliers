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
        (issue) => issue.message === SiteInputError.MissingPemHeader,
      );
      expect(hasCorrectError).toBe(true);
    }
  });

  it("should accept a valid public key string", async () => {
    await expect(CreateSiteInputSchema.parseAsync(defaultInput))
      .resolves
      .toBeDefined();
  });
});
