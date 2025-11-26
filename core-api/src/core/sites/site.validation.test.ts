import { describe, expect, it } from "vitest";
import { z, ZodError } from "zod";
import { CreateSiteInput } from "./site.types.ts";
import { CreateSiteInputSchema } from "./site.validation.ts";

describe("Site Validation Testing", () => {
  const defaultInput: CreateSiteInput = {
    siteName: "evil site",
    siteUrl: "https://evil.com",
    adminEmail: "evil@evil.com",
    publicKey: "evil public key",
  };

  it("should reject an invalid public key string", async () => {
    await expect(CreateSiteInputSchema.safeParseAsync(defaultInput)).rejects
      .toThrow(ZodError);
  });
});
