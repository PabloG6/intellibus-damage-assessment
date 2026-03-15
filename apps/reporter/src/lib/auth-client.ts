"use client";

import { createWorkspaceAuthClient } from "@workspace/auth/client";
import { env } from "@/lib/env";

export const authClient = createWorkspaceAuthClient(env.VITE_AUTH_URL);
