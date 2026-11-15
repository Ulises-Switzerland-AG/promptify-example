import { z } from "zod";

export const categoryInputSchema = z.object({
  name: z.string().trim().min(1).max(50),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/),
});

export type CategoryInput = z.infer<typeof categoryInputSchema>;
