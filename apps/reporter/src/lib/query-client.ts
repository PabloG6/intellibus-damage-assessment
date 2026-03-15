import {
  QueryClient,
  dehydrate,
  type DehydratedState,
} from "@tanstack/react-query";
import superjson from "superjson";

export function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 15_000,
        retry: 1,
      },
      mutations: {
        retry: 0,
      },
    },
  });
}

let browserQueryClient: QueryClient | undefined;

export function getQueryClient() {
  if (typeof window === "undefined") {
    return makeQueryClient();
  }

  browserQueryClient ??= makeQueryClient();
  return browserQueryClient;
}

export function serializeQueryClientState(queryClient: QueryClient) {
  return superjson.stringify(dehydrate(queryClient));
}

export function deserializeQueryClientState(
  dehydratedState?: string | null,
): DehydratedState | undefined {
  if (!dehydratedState) {
    return undefined;
  }

  return superjson.parse<DehydratedState>(dehydratedState);
}
