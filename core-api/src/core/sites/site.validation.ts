import { z } from "zod";
import { CreateSiteInput } from "./site.types.ts";
import { isValidPublicKey } from "../common/crypto.ts";

export const CreateSiteInputSchema = z.object({
  siteName: z.string(),
  siteUrl: z.url(),
  adminEmail: z.email(),
  publicKey: z.string().refine(
    (key) => isValidPublicKey(key),
    "The provided string is not a valid public key",
  ),
  adapterMetadata: z.record(z.string(), z.unknown()).optional(),
}) satisfies z.Schema<CreateSiteInput>;
