import { z } from "zod";
import { CreateSiteInput } from "./site.types.ts";

export const CreateSiteInputSchema = z.object({
  siteName: z.string(),
  siteUrl: z.url(),
  adminEmail: z.email(),
  publicKey: z.string(), // TODO: Figure out how to validate publicKey
  adapterMetadata: z.record(z.string(), z.unknown()).optional(),
}) satisfies z.Schema<CreateSiteInput>;
