import { createFileRoute } from "@tanstack/react-router";
import { EmailPasswordAuthScreen } from "@/components/auth/email-password-auth-screen";

export const Route = createFileRoute("/signup")({
  component: SignUpPage,
});

function SignUpPage() {
  return <EmailPasswordAuthScreen mode="signup" />;
}
