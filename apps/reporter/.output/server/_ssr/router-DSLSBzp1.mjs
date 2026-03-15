import { c as createRouter, a as createRootRoute, b as createFileRoute, l as lazyRouteComponent, H as HeadContent, S as Scripts } from "../_libs/tanstack__react-router.mjs";
import { j as jsxRuntimeExports, r as reactExports } from "../_libs/react.mjs";
import { c as QueryClient } from "../_libs/tanstack__query-core.mjs";
import { Q as QueryClientProvider, H as HydrationBoundary } from "../_libs/tanstack__react-query.mjs";
import { c as createTRPCClient, h as httpBatchLink } from "../_libs/trpc__client.mjs";
import { S as SuperJSON } from "../_libs/superjson.mjs";
import { c as createTRPCContext } from "../_libs/trpc__tanstack-react-query.mjs";
import { o as object, s as string, u as url } from "../_libs/zod.mjs";
import "../_libs/tanstack__router-core.mjs";
import "../_libs/cookie-es.mjs";
import "../_libs/tanstack__history.mjs";
import "../_libs/tiny-invariant.mjs";
import "../_libs/seroval.mjs";
import "../_libs/seroval-plugins.mjs";
import "node:stream/web";
import "node:stream";
import "../_libs/react-dom.mjs";
import "util";
import "crypto";
import "async_hooks";
import "stream";
import "../_libs/isbot.mjs";
import "../_libs/tiny-warning.mjs";
import "../_libs/trpc__server.mjs";
import "../_libs/copy-anything.mjs";
import "../_libs/is-what.mjs";
const appCss = "/assets/globals-DnHBlJUd.css";
const envSchema = object({
  VITE_API_URL: url(),
  VITE_AUTH_URL: url(),
  VITE_PARTYKIT_HOST: string().min(1)
});
const env = envSchema.parse({
  VITE_API_URL: "http://127.0.0.1:8787",
  VITE_AUTH_URL: "http://127.0.0.1:8788",
  VITE_PARTYKIT_HOST: "127.0.0.1:1999"
});
function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 15e3,
        retry: 1
      },
      mutations: {
        retry: 0
      }
    }
  });
}
let browserQueryClient;
function getQueryClient() {
  if (typeof window === "undefined") {
    return makeQueryClient();
  }
  browserQueryClient ??= makeQueryClient();
  return browserQueryClient;
}
function deserializeQueryClientState(dehydratedState) {
  if (!dehydratedState) {
    return void 0;
  }
  return SuperJSON.parse(dehydratedState);
}
const { TRPCProvider, useTRPC } = createTRPCContext();
function makeTrpcClient() {
  return createTRPCClient({
    links: [
      httpBatchLink({
        url: `${env.VITE_API_URL}/api/trpc`,
        transformer: SuperJSON,
        fetch(url2, options) {
          return fetch(url2, {
            ...options ?? {},
            credentials: "include"
          });
        }
      })
    ]
  });
}
function AppProviders({ children, dehydratedState }) {
  const queryClient = getQueryClient();
  const [trpcClient] = reactExports.useState(() => makeTrpcClient());
  const hydrationState = reactExports.useMemo(
    () => deserializeQueryClientState(dehydratedState),
    [dehydratedState]
  );
  return /* @__PURE__ */ jsxRuntimeExports.jsx(QueryClientProvider, { client: queryClient, children: /* @__PURE__ */ jsxRuntimeExports.jsx(TRPCProvider, { queryClient, trpcClient, children: /* @__PURE__ */ jsxRuntimeExports.jsx(HydrationBoundary, { state: hydrationState, children }) }) });
}
const Route$3 = createRootRoute({
  head: () => ({
    meta: [
      {
        charSet: "utf-8"
      },
      {
        name: "viewport",
        content: "width=device-width, initial-scale=1"
      },
      {
        title: "YardWatch Reporter"
      }
    ],
    links: [
      {
        rel: "stylesheet",
        href: appCss
      }
    ]
  }),
  shellComponent: RootDocument
});
function RootDocument({ children }) {
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("html", { lang: "en", className: "dark", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("head", { children: /* @__PURE__ */ jsxRuntimeExports.jsx(HeadContent, {}) }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("body", { children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(AppProviders, { children }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(Scripts, {})
    ] })
  ] });
}
const $$splitComponentImporter$2 = () => import("./signup-B6758YkT.mjs");
const Route$2 = createFileRoute("/signup")({
  component: lazyRouteComponent($$splitComponentImporter$2, "component")
});
const $$splitComponentImporter$1 = () => import("./login-BXG_SFqn.mjs");
const Route$1 = createFileRoute("/login")({
  component: lazyRouteComponent($$splitComponentImporter$1, "component")
});
const $$splitComponentImporter = () => import("./index-MAnnNxWv.mjs");
const Route = createFileRoute("/")({
  component: lazyRouteComponent($$splitComponentImporter, "component")
});
const SignupRoute = Route$2.update({
  id: "/signup",
  path: "/signup",
  getParentRoute: () => Route$3
});
const LoginRoute = Route$1.update({
  id: "/login",
  path: "/login",
  getParentRoute: () => Route$3
});
const IndexRoute = Route.update({
  id: "/",
  path: "/",
  getParentRoute: () => Route$3
});
const rootRouteChildren = {
  IndexRoute,
  LoginRoute,
  SignupRoute
};
const routeTree = Route$3._addFileChildren(rootRouteChildren)._addFileTypes();
function getRouter() {
  const router2 = createRouter({
    routeTree,
    scrollRestoration: true,
    defaultPreload: "intent",
    defaultPreloadStaleTime: 0
  });
  return router2;
}
const router = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  getRouter
}, Symbol.toStringTag, { value: "Module" }));
export {
  env as e,
  router as r,
  useTRPC as u
};
