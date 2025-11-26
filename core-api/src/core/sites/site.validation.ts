import { z } from "zod";
import { isEd25519Key, isParseablePublicKey } from "../common/crypto.ts";
import { CreateSiteInput } from "./site.types.ts";
import { SiteInputError } from "./site.error.ts";

export const CreateSiteInputSchema: z.ZodType<CreateSiteInput> = z.object({
  siteName: z.string(),
  siteUrl: z.url(),
  adminEmail: z.email(),
  publicKey: z.string()
    .startsWith("-----BEGIN PUBLIC KEY-----", {
      message: SiteInputError.MissingPemHeader,
    })
    .refine(isParseablePublicKey, {
      message: SiteInputError.InvalidPublicKeyFormat,
    })
    .refine(isEd25519Key, { message: SiteInputError.InvalidPublicKeyType }),
  adapterMetadata: z.record(z.string(), z.unknown()).optional(),
});
