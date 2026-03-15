import { apiKey } from "@better-auth/api-key";
import { betterAuth, type BetterAuthOptions } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { organization } from "better-auth/plugins/organization";

type Plugins = NonNullable<BetterAuthOptions["plugins"]>;
type Plugin = Plugins[number];

export interface CreateAuthOptions {
  baseURL: string;
  secret: string;
  database: Parameters<typeof drizzleAdapter>[0];
  trustedOrigins?: BetterAuthOptions["trustedOrigins"];
  emailAndPassword?: BetterAuthOptions["emailAndPassword"];
  socialProviders?: BetterAuthOptions["socialProviders"];
  apiKey?: Parameters<typeof apiKey>[0];
  organization?: Parameters<typeof organization>[0];
  plugins?: Plugin[];
}

export const createAuth = ({
  baseURL,
  secret,
  database,
  trustedOrigins,
  emailAndPassword,
  socialProviders,
  apiKey: apiKeyOptions,
  organization: organizationOptions,
  plugins,
}: CreateAuthOptions) => {
  return betterAuth({
    baseURL,
    secret,
    trustedOrigins,
    emailAndPassword: emailAndPassword ?? { enabled: true },
    socialProviders,
    database: drizzleAdapter(database, { provider: "pg" }),
    plugins: [
      apiKey({
        enableMetadata: true,
        ...apiKeyOptions,
      }),
      organization(organizationOptions),
      ...(plugins ?? []),
    ],
  });
};
