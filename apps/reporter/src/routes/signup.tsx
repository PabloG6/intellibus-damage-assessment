import { createFileRoute } from "@tanstack/react-router";
import { ReporterAuthScreen } from "@/components/auth/reporter-auth-screen";

export const Route = createFileRoute("/signup")({
  component: SignUpPage,
});

function SignUpPage() {
  return <ReporterAuthScreen mode="signup" />;
}
