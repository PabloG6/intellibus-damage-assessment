import { createAuthClient } from "better-auth/react";

export const createWorkspaceAuthClient = (baseURL: string) =>
  createAuthClient({
    baseURL,
    fetchOptions: {
      credentials: "include",
    },
  });
