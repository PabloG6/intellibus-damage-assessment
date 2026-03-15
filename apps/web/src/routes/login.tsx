import { createFileRoute } from "@tanstack/react-router";
import { EmailPasswordAuthScreen } from "@/components/auth/email-password-auth-screen";

export const Route = createFileRoute("/login")({
  component: LoginPage,
});

function LoginPage() {
  return <EmailPasswordAuthScreen mode="login" />;
}
