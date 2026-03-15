import { apiKey } from "@better-auth/api-key";
import bcrypt from "bcryptjs";
import { betterAuth, type BetterAuthOptions } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { organization } from "better-auth/plugins/organization";

type Plugins = NonNullable<BetterAuthOptions["plugins"]>;
type Plugin = Plugins[number];
const BCRYPT_SALT_ROUNDS = 10;

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
  const resolvedEmailAndPassword = {
    enabled: emailAndPassword?.enabled ?? true,
    ...emailAndPassword,
    password: {
      hash: async (password: string) =>
        bcrypt.hash(password, BCRYPT_SALT_ROUNDS),
      verify: async ({
        hash,
        password,
      }: {
        hash: string;
        password: string;
      }) => bcrypt.compare(password, hash),
      ...emailAndPassword?.password,
    },
  } satisfies NonNullable<BetterAuthOptions["emailAndPassword"]>;

  return betterAuth({
    baseURL,
    secret,
    trustedOrigins,
    emailAndPassword: resolvedEmailAndPassword,
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
