import { z } from "zod";

const envSchema = z.object({
  VITE_BASE_URL: z.url(),
  VITE_API_URL: z.url(),
  VITE_AUTH_URL: z.url(),
  VITE_MAP_BOX_API_KEY: z.string().min(1),
});

export const env = envSchema.parse({
  VITE_BASE_URL: import.meta.env.VITE_BASE_URL,
  VITE_API_URL: import.meta.env.VITE_API_URL,
  VITE_AUTH_URL: import.meta.env.VITE_AUTH_URL,
  VITE_MAP_BOX_API_KEY: import.meta.env.VITE_MAP_BOX_API_KEY,
});
