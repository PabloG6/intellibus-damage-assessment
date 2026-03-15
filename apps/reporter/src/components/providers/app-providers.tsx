import type { ReactNode } from "react";
import { useMemo, useState } from "react";
import { HydrationBoundary, QueryClientProvider } from "@tanstack/react-query";
import { createTRPCClient, httpBatchLink } from "@trpc/client";
import type { AppRouter } from "@workspace/api/router";
import superjson from "superjson";
import { env } from "@/lib/env";
import {
  deserializeQueryClientState,
  getQueryClient,
} from "@/lib/query-client";
import { TRPCProvider } from "@/lib/trpc";

function makeTrpcClient() {
  return createTRPCClient<AppRouter>({
    links: [
      httpBatchLink({
        url: `${env.VITE_API_URL}/api/trpc`,
        transformer: superjson,
        fetch(url, options) {
          return fetch(url, {
            ...(options ?? {}),
            credentials: "include",
          });
        },
      }),
    ],
  });
}

interface AppProvidersProps {
  children: ReactNode;
  dehydratedState?: string | null;
}

export function AppProviders({ children, dehydratedState }: AppProvidersProps) {
  const queryClient = getQueryClient();
  const [trpcClient] = useState(() => makeTrpcClient());
  const hydrationState = useMemo(
    () => deserializeQueryClientState(dehydratedState),
    [dehydratedState],
  );

  return (
    <QueryClientProvider client={queryClient}>
      <TRPCProvider queryClient={queryClient} trpcClient={trpcClient}>
        <HydrationBoundary state={hydrationState}>{children}</HydrationBoundary>
      </TRPCProvider>
    </QueryClientProvider>
  );
}
