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
  FieldGroup,
  FieldLabel,
  FieldLegend,
  FieldSet,
} from "@workspace/ui/components/field";
import { Input } from "@workspace/ui/components/input";
import { authClient } from "@/lib/auth-client";

type AuthMode = "login" | "signup";

const loginSchema = z.object({
  email: z.string().email("Enter a valid email address."),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters long."),
});

const signUpSchema = loginSchema.extend({
  name: z
    .string()
    .min(2, "Tell us what to call you.")
    .max(60, "Keep your display name under 60 characters."),
});

const authCopy = {
  login: {
    badge: "Email Sign In",
    title: "Pick up the live response queue.",
    description:
      "Sign in with the email and password attached to your YardWatch workspace.",
    submitLabel: "Sign in",
    submitPendingLabel: "Signing in...",
    formHint:
      "We only support email and password here for now. Your session stays cookie-based.",
    asideTitle: "Operational access, not brochure mode.",
    asideBody:
      "Use this flow to move from the marketing site into the actual triage surface without passing bearer tokens around by hand.",
    highlights: [
      "Cookie-backed Better Auth session",
      "Built for the dedicated auth worker at port 8788",
      "Redirects straight into the dashboard after success",
    ],
    secondaryPrompt: "Need a workspace account first?",
    secondaryHref: "/signup" as const,
    secondaryLabel: "Create one",
    fallbackError: "Sign in failed. Check your credentials and try again.",
  },
  signup: {
    badge: "Email Sign Up",
    title: "Create a YardWatch operator account.",
    description:
      "Start with name, email, and password. Social providers and extra auth flows can wait.",
    submitLabel: "Create account",
    submitPendingLabel: "Creating account...",
    formHint:
      "This is the minimal Better Auth path for local testing. Name is required by the auth model.",
    asideTitle: "Smallest useful auth surface.",
    asideBody:
      "This screen only collects the three fields Better Auth needs to create a usable cookie-backed session locally.",
    highlights: [
      "Name, email, and password only",
      "Zod validation through TanStack Form",
      "Same UI primitives as the rest of the workspace",
    ],
    secondaryPrompt: "Already have an account?",
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
    formHint: string;
    asideTitle: string;
    asideBody: string;
    highlights: string[];
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

export function EmailPasswordAuthScreen({ mode }: { mode: AuthMode }) {
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
          void navigate({ to: "/dashboard" });
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
            "radial-gradient(ellipse 65% 55% at 15% 12%, oklch(0.20 0.04 220 / 0.40), transparent)",
            "radial-gradient(ellipse 45% 45% at 85% 82%, oklch(0.26 0.06 180 / 0.18), transparent)",
          ].join(", "),
        }}
      />
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg width='72' height='72' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M0 0h72v72H0z' fill='none'/%3E%3Cpath d='M0 36h72M36 0v72' stroke='white' stroke-width='0.5'/%3E%3C/svg%3E\")",
          backgroundSize: "72px 72px",
        }}
      />

      <div className="relative mx-auto grid min-h-screen max-w-6xl gap-10 px-6 py-10 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
        <section className="max-w-xl">
          <Link
            to="/"
            className="inline-flex items-center gap-2 rounded-full border border-border bg-card/70 px-3 py-1 text-[11px] font-medium uppercase tracking-[0.22em] text-muted-foreground backdrop-blur-sm transition-colors hover:text-foreground"
          >
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
            Back to YardWatch
          </Link>

          <p className="mt-10 text-[10px] font-semibold uppercase tracking-[0.24em] text-sidebar-primary">
            {copy.badge}
          </p>
          <h1 className="mt-4 text-[clamp(2.2rem,5vw,4rem)] font-semibold leading-[1.02] tracking-tight">
            {copy.title}
          </h1>
          <p className="mt-5 max-w-lg text-base leading-7 text-muted-foreground">
            {copy.asideBody}
          </p>

          <div className="mt-10 rounded-[2rem] border border-border/70 bg-card/70 p-6 shadow-[0_20px_70px_-38px_rgba(8,145,178,0.45)] backdrop-blur-xl">
            <p className="text-sm font-semibold tracking-tight">{copy.asideTitle}</p>
            <ul className="mt-5 grid gap-3 text-sm leading-6 text-muted-foreground">
              {copy.highlights.map((item) => (
                <li key={item} className="flex items-start gap-3">
                  <span className="mt-2 h-2 w-2 rounded-full bg-sidebar-primary" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </section>

        <Card className="border-border/70 bg-card/92">
          <CardHeader className="gap-3 p-6 md:p-8">
            <CardTitle className="text-xl">{copy.description}</CardTitle>
            <CardDescription className="text-sm leading-6">
              {copy.formHint}
            </CardDescription>
          </CardHeader>
          <CardContent className="px-6 pb-6 md:px-8 md:pb-8">
            <form
              className="space-y-6"
              onSubmit={(event) => {
                event.preventDefault();
                event.stopPropagation();
                void form.handleSubmit();
              }}
            >
              <FieldSet className="gap-5">
                <FieldLegend>Credentials</FieldLegend>
                <FieldGroup className="gap-4">
                  {mode === "signup" ? (
                    <form.Field name="name">
                      {(field) => (
                        <AuthTextField
                          label="Name"
                          description="This becomes the display name on the Better Auth user record."
                          errors={field.state.meta.errors}
                        >
                          <Input
                            id={field.name}
                            name={field.name}
                            autoComplete="name"
                            placeholder="Alicia Brown"
                            value={field.state.value}
                            onBlur={field.handleBlur}
                            onChange={(event) => {
                              setSubmitError(null);
                              field.handleChange(event.target.value);
                            }}
                            aria-invalid={field.state.meta.errors.length > 0}
                          />
                        </AuthTextField>
                      )}
                    </form.Field>
                  ) : null}

                  <form.Field name="email">
                    {(field) => (
                      <AuthTextField
                        label="Email"
                        description="Use the address tied to the workspace you want to access."
                        errors={field.state.meta.errors}
                      >
                        <Input
                          id={field.name}
                          name={field.name}
                          type="email"
                          autoComplete="email"
                          placeholder="ops@yardwatch.dev"
                          value={field.state.value}
                          onBlur={field.handleBlur}
                          onChange={(event) => {
                            setSubmitError(null);
                            field.handleChange(event.target.value);
                          }}
                          aria-invalid={field.state.meta.errors.length > 0}
                        />
                      </AuthTextField>
                    )}
                  </form.Field>

                  <form.Field name="password">
                    {(field) => (
                      <AuthTextField
                        label="Password"
                        description="Use at least 8 characters. Better Auth will store the hashed credential."
                        errors={field.state.meta.errors}
                      >
                        <Input
                          id={field.name}
                          name={field.name}
                          type="password"
                          autoComplete={
                            mode === "signup" ? "new-password" : "current-password"
                          }
                          placeholder="••••••••"
                          value={field.state.value}
                          onBlur={field.handleBlur}
                          onChange={(event) => {
                            setSubmitError(null);
                            field.handleChange(event.target.value);
                          }}
                          aria-invalid={field.state.meta.errors.length > 0}
                        />
                      </AuthTextField>
                    )}
                  </form.Field>
                </FieldGroup>
              </FieldSet>

              {submitError ? <FieldError>{submitError}</FieldError> : null}

              <form.Subscribe
                selector={(state) => ({
                  isSubmitting: state.isSubmitting,
                })}
              >
                {({ isSubmitting }) => (
                  <Button className="w-full" size="lg" type="submit" disabled={isSubmitting}>
                    {isSubmitting ? copy.submitPendingLabel : copy.submitLabel}
                  </Button>
                )}
              </form.Subscribe>

              <p className="text-sm text-muted-foreground">
                {copy.secondaryPrompt}{" "}
                <Link
                  to={copy.secondaryHref}
                  className="font-semibold text-foreground underline decoration-border underline-offset-4 transition-colors hover:text-sidebar-primary"
                >
                  {copy.secondaryLabel}
                </Link>
              </p>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
