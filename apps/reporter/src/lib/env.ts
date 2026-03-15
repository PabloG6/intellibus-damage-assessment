import { z } from "zod";

const envSchema = z.object({
  VITE_API_URL: z.url(),
  VITE_AUTH_URL: z.url(),
  VITE_PARTYKIT_HOST: z.string().min(1),
});

export const env = envSchema.parse({
  VITE_API_URL: import.meta.env.VITE_API_URL,
  VITE_AUTH_URL: import.meta.env.VITE_AUTH_URL,
  VITE_PARTYKIT_HOST: import.meta.env.VITE_PARTYKIT_HOST,
});
