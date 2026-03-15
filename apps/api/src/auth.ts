import { createAuth } from '@workspace/auth';
import type { AppDb } from '@workspace/db';
import type { WorkerEnv } from './env';

export interface AuthIdentity {
	userId: string;
	sessionId: string;
	organizationId: string | null;
}

const AUTH_HEADER_NAMES = ['cookie', 'authorization', 'origin', 'user-agent'] as const;

export function buildAuthHeaders(request: Request): Headers {
	const headers = new Headers();

	for (const headerName of AUTH_HEADER_NAMES) {
		const headerValue = request.headers.get(headerName);

		if (headerValue) {
			headers.set(headerName, headerValue);
		}
	}

	return headers;
}

function parseTrustedOrigins(origins: string | undefined) {
	return (
		origins
			?.split(',')
			.map((origin) => origin.trim())
			.filter(Boolean) ?? []
	);
}

async function resolveSessionFromAuthSystem(request: Request, env: WorkerEnv, database: AppDb): Promise<AuthIdentity | null> {
	if (!env.BETTER_AUTH_URL || !env.BETTER_AUTH_SECRET) {
		return null;
	}

	const auth = createAuth({
		baseURL: env.BETTER_AUTH_URL,
		secret: env.BETTER_AUTH_SECRET,
		database,
		trustedOrigins: parseTrustedOrigins(env.CORS_ALLOWED_ORIGINS),
	});
	const session = await auth.api.getSession({
		headers: buildAuthHeaders(request),
	});

	if (!session?.session || !session.user) {
		return null;
	}

	return {
		userId: session.user.id,
		sessionId: session.session.id,
		organizationId: session.session.activeOrganizationId ?? null,
	};
}

export async function resolveAuth(request: Request, env: WorkerEnv, database: AppDb): Promise<AuthIdentity | null> {
	try {
		return await resolveSessionFromAuthSystem(request, env, database);
	} catch (error) {
		console.warn('Failed to resolve auth session', error);
		return null;
	}
}
