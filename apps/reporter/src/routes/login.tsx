import { createFileRoute } from "@tanstack/react-router";
import { ReporterAuthScreen } from "@/components/auth/reporter-auth-screen";

export const Route = createFileRoute("/login")({
  component: LoginPage,
});

function LoginPage() {
  return <ReporterAuthScreen mode="login" />;
}
