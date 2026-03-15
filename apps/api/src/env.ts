export interface HyperdriveBinding {
	connectionString: string;
}

export interface WorkerEnv {
	ALLOWED_ORIGINS?: string;
	BETTER_AUTH_SECRET?: string;
	BETTER_AUTH_URL?: string;
	CORS_ALLOWED_ORIGINS?: string;
	CONTROL_PLANE_DATABASE_URL?: string;
	DATABASE_URL?: string;
	GOOGLE_MAPS_API_KEY?: string;
	HYPERDRIVE?: HyperdriveBinding;
	PARTYKIT_SERVICE_SECRET?: string;
	PARTYKIT_URL?: string;
	REALTIME_TOKEN_SECRET?: string;
}

export function resolveGoogleMapsApiKey(env?: WorkerEnv) {
	return env?.GOOGLE_MAPS_API_KEY ?? process.env.GOOGLE_MAPS_API_KEY ?? null;
}
