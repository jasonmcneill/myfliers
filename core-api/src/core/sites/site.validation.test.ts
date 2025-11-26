import { describe, expect, it } from "vitest";
import { ZodError } from "zod";
import { CreateSiteInput } from "./site.types.ts";
import { CreateSiteInputSchema } from "./site.validation.ts";

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

    await expect(CreateSiteInputSchema.parseAsync(invalidPublicKeyInput))
      .rejects
      .toThrow(ZodError);
  });
});
