import { z } from "zod";
import { isEd25519Key, isParseablePublicKey } from "../common/crypto.ts";
import { CreateSiteInput } from "./site.types.ts";
import { SiteInputError } from "./site.error.ts";

const publicKeyValidation = z.string()
  .superRefine((val, ctx) => {
    if (
      !val.startsWith("-----BEGIN PUBLIC KEY-----") ||
      !val.endsWith("-----END PUBLIC KEY-----")
    ) {
      ctx.addIssue({
        code: "custom",
        message: SiteInputError.MissingPem,
        fatal: true,
      });
      return z.NEVER;
    }
    if (!isParseablePublicKey(val)) {
      ctx.addIssue({
        code: "custom",
        message: SiteInputError.InvalidPublicKeyFormat,
        fatal: true,
      });
      return z.NEVER;
    }
    if (!isEd25519Key(val)) {
      ctx.addIssue({
        code: "custom",
        message: SiteInputError.InvalidPublicKeyType,
        fatal: true,
      });
      return z.NEVER;
    }
  });

export const CreateSiteInputSchema: z.ZodType<CreateSiteInput> = z.object({
  siteName: z.string(),
  siteUrl: z.url(),
  adminEmail: z.email(),
  publicKey: publicKeyValidation,
  adapterMetadata: z.record(z.string(), z.unknown()).optional(),
});
