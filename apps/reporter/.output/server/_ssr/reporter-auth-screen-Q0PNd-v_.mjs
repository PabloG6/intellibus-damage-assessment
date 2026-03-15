import { r as reactExports, j as jsxRuntimeExports } from "../_libs/react.mjs";
import { u as useForm } from "../_libs/tanstack__react-form.mjs";
import { u as useNavigate, L as Link } from "../_libs/tanstack__react-router.mjs";
import { C as Card, a as CardHeader, b as CardTitle, c as CardDescription, d as CardContent, I as Input, B as Button, e as authClient, f as cn } from "./auth-client-aUuAFd71.mjs";
import { c as cva } from "../_libs/class-variance-authority.mjs";
import { s as string, o as object } from "../_libs/zod.mjs";
function Label({ className, ...props }) {
  return /* @__PURE__ */ jsxRuntimeExports.jsx(
    "label",
    {
      "data-slot": "label",
      className: cn(
        "flex items-center gap-2 text-sm leading-none font-medium select-none group-data-[disabled=true]:pointer-events-none group-data-[disabled=true]:opacity-50 peer-disabled:cursor-not-allowed peer-disabled:opacity-50",
        className
      ),
      ...props
    }
  );
}
const fieldVariants = cva(
  "group/field flex w-full gap-3 data-[invalid=true]:text-destructive",
  {
    variants: {
      orientation: {
        vertical: "flex-col *:w-full [&>.sr-only]:w-auto",
        horizontal: "flex-row items-center has-[>[data-slot=field-content]]:items-start *:data-[slot=field-label]:flex-auto has-[>[data-slot=field-content]]:[&>[role=checkbox],[role=radio]]:mt-px",
        responsive: "flex-col *:w-full @md/field-group:flex-row @md/field-group:items-center @md/field-group:*:w-auto @md/field-group:has-[>[data-slot=field-content]]:items-start @md/field-group:*:data-[slot=field-label]:flex-auto [&>.sr-only]:w-auto @md/field-group:has-[>[data-slot=field-content]]:[&>[role=checkbox],[role=radio]]:mt-px"
      }
    },
    defaultVariants: {
      orientation: "vertical"
    }
  }
);
function Field({
  className,
  orientation = "vertical",
  ...props
}) {
  return /* @__PURE__ */ jsxRuntimeExports.jsx(
    "div",
    {
      role: "group",
      "data-slot": "field",
      "data-orientation": orientation,
      className: cn(fieldVariants({ orientation }), className),
      ...props
    }
  );
}
function FieldContent({ className, ...props }) {
  return /* @__PURE__ */ jsxRuntimeExports.jsx(
    "div",
    {
      "data-slot": "field-content",
      className: cn(
        "group/field-content flex flex-1 flex-col gap-1 leading-snug",
        className
      ),
      ...props
    }
  );
}
function FieldLabel({
  className,
  ...props
}) {
  return /* @__PURE__ */ jsxRuntimeExports.jsx(
    Label,
    {
      "data-slot": "field-label",
      className: cn(
        "group/field-label peer/field-label flex w-fit gap-2 leading-snug group-data-[disabled=true]/field:opacity-50 has-data-checked:border-primary/30 has-data-checked:bg-primary/5 has-[>[data-slot=field]]:rounded-xl has-[>[data-slot=field]]:border *:data-[slot=field]:p-4 dark:has-data-checked:border-primary/20 dark:has-data-checked:bg-primary/10",
        "has-[>[data-slot=field]]:w-full has-[>[data-slot=field]]:flex-col",
        className
      ),
      ...props
    }
  );
}
function FieldDescription({ className, ...props }) {
  return /* @__PURE__ */ jsxRuntimeExports.jsx(
    "p",
    {
      "data-slot": "field-description",
      className: cn(
        "text-left text-sm leading-normal font-normal text-muted-foreground group-has-data-horizontal/field:text-balance [[data-variant=legend]+&]:-mt-1.5",
        "last:mt-0 nth-last-2:-mt-1",
        "[&>a]:underline [&>a]:underline-offset-4 [&>a:hover]:text-primary",
        className
      ),
      ...props
    }
  );
}
function FieldError({
  className,
  children,
  errors,
  ...props
}) {
  const content = reactExports.useMemo(() => {
    if (children) {
      return children;
    }
    if (!errors?.length) {
      return null;
    }
    const uniqueErrors = [
      ...new Map(errors.map((error) => [error?.message, error])).values()
    ];
    if (uniqueErrors?.length == 1) {
      return uniqueErrors[0]?.message;
    }
    return /* @__PURE__ */ jsxRuntimeExports.jsx("ul", { className: "ml-4 flex list-disc flex-col gap-1", children: uniqueErrors.map(
      (error, index) => error?.message && /* @__PURE__ */ jsxRuntimeExports.jsx("li", { children: error.message }, index)
    ) });
  }, [children, errors]);
  if (!content) {
    return null;
  }
  return /* @__PURE__ */ jsxRuntimeExports.jsx(
    "div",
    {
      role: "alert",
      "data-slot": "field-error",
      className: cn("text-sm font-normal text-destructive", className),
      ...props,
      children: content
    }
  );
}
const loginSchema = object({
  email: string().email("Enter a valid email address."),
  password: string().min(8, "Password must be at least 8 characters long.")
});
const signUpSchema = loginSchema.extend({
  name: string().min(2, "Tell us what to call you.").max(60, "Keep your display name under 60 characters.")
});
const authCopy = {
  login: {
    badge: "Reporter Sign In",
    title: "Reconnect your reporting node.",
    description: "Use the same YardWatch account system, then resume live heartbeat reporting from this device.",
    submitLabel: "Sign in",
    submitPendingLabel: "Signing in...",
    secondaryPrompt: "Need to register this site first?",
    secondaryHref: "/signup",
    secondaryLabel: "Create account",
    fallbackError: "Sign in failed. Check your credentials and try again."
  },
  signup: {
    badge: "Reporter Sign Up",
    title: "Register a new reporting operator.",
    description: "Create one YardWatch account for this facility, then enroll its liveliness probe on the next screen.",
    submitLabel: "Create account",
    submitPendingLabel: "Creating account...",
    secondaryPrompt: "Already registered this site?",
    secondaryHref: "/login",
    secondaryLabel: "Sign in instead",
    fallbackError: "Account creation failed. Try a different email or stronger password."
  }
};
function normalizeErrors(errors) {
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
    if (typeof error === "object" && "message" in error && typeof error.message === "string") {
      return [{ message: error.message }];
    }
    return [];
  });
}
function getErrorMessage(error, fallback) {
  if (error && typeof error === "object" && "message" in error && typeof error.message === "string") {
    return error.message;
  }
  return fallback;
}
function AuthTextField({
  errors,
  description,
  label,
  children
}) {
  const normalizedErrors = normalizeErrors(errors);
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(Field, { "data-invalid": normalizedErrors.length > 0, children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx(FieldLabel, { children: label }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs(FieldContent, { children: [
      children,
      /* @__PURE__ */ jsxRuntimeExports.jsx(FieldDescription, { children: description }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(FieldError, { errors: normalizedErrors })
    ] })
  ] });
}
function ReporterAuthScreen({ mode }) {
  const navigate = useNavigate();
  const copy = authCopy[mode];
  const [submitError, setSubmitError] = reactExports.useState(null);
  const form = useForm({
    defaultValues: mode === "signup" ? {
      name: "",
      email: "",
      password: ""
    } : {
      email: "",
      password: ""
    },
    validators: {
      onBlur: mode === "signup" ? signUpSchema : loginSchema,
      onSubmit: mode === "signup" ? signUpSchema : loginSchema
    },
    onSubmit: async ({ value }) => {
      setSubmitError(null);
      try {
        if (mode === "signup") {
          const result = await authClient.signUp.email({
            name: "name" in value && typeof value.name === "string" ? value.name : "",
            email: value.email,
            password: value.password
          });
          if (result.error) {
            setSubmitError(getErrorMessage(result.error, copy.fallbackError));
            return;
          }
        } else {
          const result = await authClient.signIn.email({
            email: value.email,
            password: value.password
          });
          if (result.error) {
            setSubmitError(getErrorMessage(result.error, copy.fallbackError));
            return;
          }
        }
        reactExports.startTransition(() => {
          void navigate({ to: "/" });
        });
      } catch (error) {
        setSubmitError(getErrorMessage(error, copy.fallbackError));
      }
    }
  });
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "relative min-h-screen overflow-hidden bg-background text-foreground", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx(
      "div",
      {
        className: "pointer-events-none absolute inset-0",
        style: {
          background: [
            "radial-gradient(ellipse 70% 58% at 20% 12%, oklch(0.20 0.04 220 / 0.42), transparent)",
            "radial-gradient(ellipse 48% 40% at 84% 82%, oklch(0.24 0.06 180 / 0.20), transparent)"
          ].join(", ")
        }
      }
    ),
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "relative mx-auto flex min-h-screen max-w-5xl items-center px-6 py-10", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid w-full gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-center", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("section", { className: "max-w-md", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs(
          Link,
          {
            to: "/",
            className: "inline-flex items-center gap-2 rounded-full border border-border bg-card/70 px-3 py-1 text-[11px] font-medium uppercase tracking-[0.22em] text-muted-foreground backdrop-blur-sm transition-colors hover:text-foreground",
            children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "h-1.5 w-1.5 rounded-full bg-emerald-400" }),
              "YardWatch Reporter"
            ]
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-6 text-[10px] font-semibold uppercase tracking-[0.24em] text-muted-foreground/70", children: copy.badge }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("h1", { className: "mt-3 text-4xl font-semibold tracking-tight", children: copy.title }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-4 text-sm leading-6 text-muted-foreground", children: copy.description }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-6 rounded-2xl border border-border/70 bg-card/70 p-4 text-sm text-muted-foreground", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "font-medium text-foreground", children: "Device-side reporting" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-2 leading-6", children: "This app is the facility-side companion surface. After sign-in, the device is enrolled as a single liveliness probe and begins sending continuous heartbeat updates to YardWatch." })
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { className: "border-white/10 bg-card/90 shadow-[0_20px_70px_-35px_rgba(8,15,32,0.95)]", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs(CardHeader, { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(CardTitle, { children: copy.title }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(CardDescription, { children: copy.description })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(CardContent, { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs(
            "form",
            {
              className: "space-y-4",
              onSubmit: (event) => {
                event.preventDefault();
                event.stopPropagation();
                void form.handleSubmit();
              },
              children: [
                mode === "signup" ? /* @__PURE__ */ jsxRuntimeExports.jsx(form.Field, { name: "name", children: (field) => /* @__PURE__ */ jsxRuntimeExports.jsx(
                  AuthTextField,
                  {
                    errors: field.state.meta.errors,
                    description: "The contact or operator name attached to this site.",
                    label: "Display name",
                    children: /* @__PURE__ */ jsxRuntimeExports.jsx(
                      Input,
                      {
                        autoComplete: "name",
                        name: field.name,
                        value: field.state.value,
                        onBlur: field.handleBlur,
                        onChange: (event) => field.handleChange(event.target.value),
                        placeholder: "Operations desk"
                      }
                    )
                  }
                ) }) : null,
                /* @__PURE__ */ jsxRuntimeExports.jsx(form.Field, { name: "email", children: (field) => /* @__PURE__ */ jsxRuntimeExports.jsx(
                  AuthTextField,
                  {
                    errors: field.state.meta.errors,
                    description: "Used for both account recovery and probe ownership.",
                    label: "Email",
                    children: /* @__PURE__ */ jsxRuntimeExports.jsx(
                      Input,
                      {
                        autoComplete: "email",
                        name: field.name,
                        type: "email",
                        value: field.state.value,
                        onBlur: field.handleBlur,
                        onChange: (event) => field.handleChange(event.target.value),
                        placeholder: "operator@facility.gov.jm"
                      }
                    )
                  }
                ) }),
                /* @__PURE__ */ jsxRuntimeExports.jsx(form.Field, { name: "password", children: (field) => /* @__PURE__ */ jsxRuntimeExports.jsx(
                  AuthTextField,
                  {
                    errors: field.state.meta.errors,
                    description: "Use at least 8 characters. This app stays cookie-based.",
                    label: "Password",
                    children: /* @__PURE__ */ jsxRuntimeExports.jsx(
                      Input,
                      {
                        autoComplete: mode === "signup" ? "new-password" : "current-password",
                        name: field.name,
                        type: "password",
                        value: field.state.value,
                        onBlur: field.handleBlur,
                        onChange: (event) => field.handleChange(event.target.value),
                        placeholder: "Minimum 8 characters"
                      }
                    )
                  }
                ) }),
                submitError ? /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "rounded-xl border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive", children: submitError }) : null,
                /* @__PURE__ */ jsxRuntimeExports.jsx(
                  form.Subscribe,
                  {
                    selector: (state) => ({
                      canSubmit: state.canSubmit,
                      isSubmitting: state.isSubmitting
                    }),
                    children: ({ canSubmit, isSubmitting }) => /* @__PURE__ */ jsxRuntimeExports.jsx(
                      Button,
                      {
                        className: "w-full",
                        type: "submit",
                        disabled: !canSubmit || isSubmitting,
                        children: isSubmitting ? copy.submitPendingLabel : copy.submitLabel
                      }
                    )
                  }
                )
              ]
            }
          ),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-5 text-center text-sm text-muted-foreground", children: [
            copy.secondaryPrompt,
            " ",
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              Link,
              {
                to: copy.secondaryHref,
                className: "font-medium text-foreground transition-colors hover:text-sidebar-primary",
                children: copy.secondaryLabel
              }
            )
          ] })
        ] })
      ] })
    ] }) })
  ] });
}
export {
  ReporterAuthScreen as R
};
