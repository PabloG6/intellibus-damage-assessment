"use client";

import { useForm } from "@tanstack/react-form";
import { Link, useNavigate } from "@tanstack/react-router";
import { startTransition, useState } from "react";
import { z } from "zod";
import { Button } from "@workspace/ui/components/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card";
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldError,
  FieldLabel,
} from "@workspace/ui/components/field";
import { Input } from "@workspace/ui/components/input";
import { authClient } from "@/lib/auth-client";

type AuthMode = "login" | "signup";

const loginSchema = z.object({
  email: z.string().email("Enter a valid email address."),
  password: z.string().min(8, "Password must be at least 8 characters long."),
});

const signUpSchema = loginSchema.extend({
  name: z
    .string()
    .min(2, "Tell us what to call you.")
    .max(60, "Keep your display name under 60 characters."),
});

const authCopy = {
  login: {
    badge: "Reporter Sign In",
    title: "Reconnect your reporting node.",
    description:
      "Use the same YardWatch account system, then resume live heartbeat reporting from this device.",
    submitLabel: "Sign in",
    submitPendingLabel: "Signing in...",
    secondaryPrompt: "Need to register this site first?",
    secondaryHref: "/signup" as const,
    secondaryLabel: "Create account",
    fallbackError: "Sign in failed. Check your credentials and try again.",
  },
  signup: {
    badge: "Reporter Sign Up",
    title: "Register a new reporting operator.",
    description:
      "Create one YardWatch account for this facility, then enroll its liveliness probe on the next screen.",
    submitLabel: "Create account",
    submitPendingLabel: "Creating account...",
    secondaryPrompt: "Already registered this site?",
    secondaryHref: "/login" as const,
    secondaryLabel: "Sign in instead",
    fallbackError: "Account creation failed. Try a different email or stronger password.",
  },
} satisfies Record<
  AuthMode,
  {
    badge: string;
    title: string;
    description: string;
    submitLabel: string;
    submitPendingLabel: string;
    secondaryPrompt: string;
    secondaryHref: "/login" | "/signup";
    secondaryLabel: string;
    fallbackError: string;
  }
>;

function normalizeErrors(
  errors: unknown[],
): Array<{
  message?: string;
}> {
  return errors.flatMap((error) => {
    if (!error) {
      return [];
    }

    if (typeof error === "string") {
      return [{ message: error }];
    }

    if (Array.isArray(error)) {
      return normalizeErrors(error);
    }

    if (
      typeof error === "object" &&
      "message" in error &&
      typeof error.message === "string"
    ) {
      return [{ message: error.message }];
    }

    return [];
  });
}

function getErrorMessage(error: unknown, fallback: string) {
  if (
    error &&
    typeof error === "object" &&
    "message" in error &&
    typeof error.message === "string"
  ) {
    return error.message;
  }

  return fallback;
}

function AuthTextField({
  errors,
  description,
  label,
  children,
}: {
  errors: unknown[];
  description: string;
  label: string;
  children: React.ReactNode;
}) {
  const normalizedErrors = normalizeErrors(errors);

  return (
    <Field data-invalid={normalizedErrors.length > 0}>
      <FieldLabel>{label}</FieldLabel>
      <FieldContent>
        {children}
        <FieldDescription>{description}</FieldDescription>
        <FieldError errors={normalizedErrors} />
      </FieldContent>
    </Field>
  );
}

export function ReporterAuthScreen({ mode }: { mode: AuthMode }) {
  const navigate = useNavigate();
  const copy = authCopy[mode];
  const [submitError, setSubmitError] = useState<string | null>(null);

  const form = useForm({
    defaultValues:
      mode === "signup"
        ? {
            name: "",
            email: "",
            password: "",
          }
        : {
            email: "",
            password: "",
          },
    validators: {
      onBlur: mode === "signup" ? signUpSchema : loginSchema,
      onSubmit: mode === "signup" ? signUpSchema : loginSchema,
    },
    onSubmit: async ({ value }) => {
      setSubmitError(null);

      try {
        if (mode === "signup") {
          const result = await authClient.signUp.email({
            name:
              "name" in value && typeof value.name === "string"
                ? value.name
                : "",
            email: value.email,
            password: value.password,
          });

          if (result.error) {
            setSubmitError(getErrorMessage(result.error, copy.fallbackError));
            return;
          }
        } else {
          const result = await authClient.signIn.email({
            email: value.email,
            password: value.password,
          });

          if (result.error) {
            setSubmitError(getErrorMessage(result.error, copy.fallbackError));
            return;
          }
        }

        startTransition(() => {
          void navigate({ to: "/" });
        });
      } catch (error) {
        setSubmitError(getErrorMessage(error, copy.fallbackError));
      }
    },
  });

  return (
    <div className="relative min-h-screen overflow-hidden bg-background text-foreground">
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background: [
            "radial-gradient(ellipse 70% 58% at 20% 12%, oklch(0.20 0.04 220 / 0.42), transparent)",
            "radial-gradient(ellipse 48% 40% at 84% 82%, oklch(0.24 0.06 180 / 0.20), transparent)",
          ].join(", "),
        }}
      />

      <div className="relative mx-auto flex min-h-screen max-w-5xl items-center px-6 py-10">
        <div className="grid w-full gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
          <section className="max-w-md">
            <Link
              to="/"
              className="inline-flex items-center gap-2 rounded-full border border-border bg-card/70 px-3 py-1 text-[11px] font-medium uppercase tracking-[0.22em] text-muted-foreground backdrop-blur-sm transition-colors hover:text-foreground"
            >
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
              YardWatch Reporter
            </Link>

            <p className="mt-6 text-[10px] font-semibold uppercase tracking-[0.24em] text-muted-foreground/70">
              {copy.badge}
            </p>
            <h1 className="mt-3 text-4xl font-semibold tracking-tight">
              {copy.title}
            </h1>
            <p className="mt-4 text-sm leading-6 text-muted-foreground">
              {copy.description}
            </p>

            <div className="mt-6 rounded-2xl border border-border/70 bg-card/70 p-4 text-sm text-muted-foreground">
              <p className="font-medium text-foreground">Device-side reporting</p>
              <p className="mt-2 leading-6">
                This app is the facility-side companion surface. After sign-in, the
                device is enrolled as a single liveliness probe and begins sending
                continuous heartbeat updates to YardWatch.
              </p>
            </div>
          </section>

          <Card className="border-white/10 bg-card/90 shadow-[0_20px_70px_-35px_rgba(8,15,32,0.95)]">
            <CardHeader>
              <CardTitle>{copy.title}</CardTitle>
              <CardDescription>{copy.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <form
                className="space-y-4"
                onSubmit={(event) => {
                  event.preventDefault();
                  event.stopPropagation();
                  void form.handleSubmit();
                }}
              >
                {mode === "signup" ? (
                  <form.Field name="name">
                    {(field) => (
                      <AuthTextField
                        errors={field.state.meta.errors}
                        description="The contact or operator name attached to this site."
                        label="Display name"
                      >
                        <Input
                          autoComplete="name"
                          name={field.name}
                          value={field.state.value}
                          onBlur={field.handleBlur}
                          onChange={(event) => field.handleChange(event.target.value)}
                          placeholder="Operations desk"
                        />
                      </AuthTextField>
                    )}
                  </form.Field>
                ) : null}

                <form.Field name="email">
                  {(field) => (
                    <AuthTextField
                      errors={field.state.meta.errors}
                      description="Used for both account recovery and probe ownership."
                      label="Email"
                    >
                      <Input
                        autoComplete="email"
                        name={field.name}
                        type="email"
                        value={field.state.value}
                        onBlur={field.handleBlur}
                        onChange={(event) => field.handleChange(event.target.value)}
                        placeholder="operator@facility.gov.jm"
                      />
                    </AuthTextField>
                  )}
                </form.Field>

                <form.Field name="password">
                  {(field) => (
                    <AuthTextField
                      errors={field.state.meta.errors}
                      description="Use at least 8 characters. This app stays cookie-based."
                      label="Password"
                    >
                      <Input
                        autoComplete={
                          mode === "signup" ? "new-password" : "current-password"
                        }
                        name={field.name}
                        type="password"
                        value={field.state.value}
                        onBlur={field.handleBlur}
                        onChange={(event) => field.handleChange(event.target.value)}
                        placeholder="Minimum 8 characters"
                      />
                    </AuthTextField>
                  )}
                </form.Field>

                {submitError ? (
                  <div className="rounded-xl border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                    {submitError}
                  </div>
                ) : null}

                <form.Subscribe
                  selector={(state) => ({
                    canSubmit: state.canSubmit,
                    isSubmitting: state.isSubmitting,
                  })}
                >
                  {({ canSubmit, isSubmitting }) => (
                    <Button
                      className="w-full"
                      type="submit"
                      disabled={!canSubmit || isSubmitting}
                    >
                      {isSubmitting ? copy.submitPendingLabel : copy.submitLabel}
                    </Button>
                  )}
                </form.Subscribe>
              </form>

              <div className="mt-5 text-center text-sm text-muted-foreground">
                {copy.secondaryPrompt}{" "}
                <Link
                  to={copy.secondaryHref}
                  className="font-medium text-foreground transition-colors hover:text-sidebar-primary"
                >
                  {copy.secondaryLabel}
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
