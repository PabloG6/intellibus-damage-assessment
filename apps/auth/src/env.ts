export interface HyperdriveBinding {
  connectionString: string;
}

export interface AuthWorkerEnv {
  ALLOWED_ORIGINS?: string;
  BETTER_AUTH_SECRET?: string;
  BETTER_AUTH_URL?: string;
  CONTROL_PLANE_DATABASE_URL?: string;
  DATABASE_URL?: string;
  HYPERDRIVE?: HyperdriveBinding;
}

export function parseAllowedOrigins(origins: string | undefined) {
  return (
    origins
      ?.split(",")
      .map((origin) => origin.trim())
      .filter(Boolean) ?? []
  );
}
