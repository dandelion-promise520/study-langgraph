import { cn } from "@frontend/vendor/lib/utils";
import { StatefulButton } from "@frontend/vendor/motion/button";
import { Checkbox } from "@frontend/vendor/motion/checkbox";
import { Input } from "@frontend/vendor/motion/input";
import { Eye, EyeOff, Lock, Mail } from "lucide-react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { type ReactNode, type SubmitEvent, useCallback, useId, useMemo, useState } from "react";

export type LoginStatus = "idle" | "loading" | "success" | "error";

export type LoginValues = {
  email: string;
  password: string;
  terms: boolean;
};

export type LoginErrors = Partial<Record<keyof LoginValues, string>>;

export type LoginFormClassNames = {
  root?: string;
  header?: string;
  title?: string;
  description?: string;
  fields?: string;
  strength?: string;
  terms?: string;
  submit?: string;
  footer?: string;
};

export interface LoginFormProps {
  /** Controlled values. Omit for uncontrolled. */
  values?: LoginValues;
  defaultValues?: Partial<LoginValues>;
  onValuesChange?: (values: LoginValues) => void;
  /** Called with valid values only. Return a promise to drive the button state. */
  onSubmit?: (values: LoginValues) => void | Promise<void>;
  /** Replace the built-in rules — return a message per invalid field. */
  validate?: (values: LoginValues) => LoginErrors;
  /** Controlled submit state. Omit to let the form track it. */
  status?: LoginStatus;
  /** Form-level failure message, shown above the submit button. */
  errorMessage?: string;
  title?: ReactNode;
  description?: ReactNode;
  submitLabel?: string;
  footer?: ReactNode;
  /** Show the password strength meter. */
  strengthMeter?: boolean;
  className?: string;
  classNames?: LoginFormClassNames;
}

const EMPTY_VALUES: LoginValues = {
  email: "",
  password: "",
  terms: false,
};

// Deliberately permissive. Full RFC 5322 matching is impractical in a regex and
// rejects addresses that deliver fine; the only real check is sending mail.
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const MIN_PASSWORD_LENGTH = 8;

/**
 * Length-weighted strength score, 0-4. NIST SP 800-63B advises against
 * composition requirements and treats length as the dominant factor, so extra
 * character classes only nudge the score — they can't rescue a short password.
 * This is a heuristic for feedback, not entropy estimation; pair it with a
 * breach-list check server-side for anything real.
 */
export function passwordStrength(password: string): number {
  if (password.length < MIN_PASSWORD_LENGTH) return 0;

  let score = 1;
  if (password.length >= 12) score += 1;
  if (password.length >= 16) score += 1;

  const classes = [/[a-z]/, /[A-Z]/, /\d/, /[^A-Za-z0-9]/].filter((pattern) =>
    pattern.test(password),
  ).length;
  if (classes >= 3) score += 1;

  return Math.min(score, 4);
}

function defaultValidate(values: LoginValues): LoginErrors {
  const errors: LoginErrors = {};

  if (!values.email.trim()) {
    errors.email = "请输入您的邮箱";
  } else if (!EMAIL_PATTERN.test(values.email)) {
    errors.email = "That doesn't look like an email address.";
  }

  if (!values.password) {
    errors.password = "请输入您的密码";
  } else if (values.password.length < MIN_PASSWORD_LENGTH) {
    errors.password = `Use at least ${MIN_PASSWORD_LENGTH} characters.`;
  }

  if (!values.terms) {
    errors.terms = "请同意我们的条款后继续";
  }

  return errors;
}

export function LoginForm({
  values: valuesProp,
  defaultValues,
  onValuesChange,
  onSubmit,
  validate,
  status: statusProp,
  errorMessage,
  title,
  description,
  submitLabel,
  footer,
  className,
  classNames,
}: LoginFormProps) {
  const reduce = useReducedMotion();
  const baseId = useId();

  const controlled = valuesProp !== undefined;
  const [internalValues, setInternalValues] = useState<LoginValues>({
    ...EMPTY_VALUES,
    ...defaultValues,
  });
  const values = controlled ? valuesProp : internalValues;

  const [internalStatus, setInternalStatus] = useState<LoginStatus>("idle");
  const status = statusProp ?? internalStatus;

  const [revealPassword, setRevealPassword] = useState(false);

  // "Reward early, punish late": errors are computed on every change, but a
  // field only *shows* its error once it has been blurred (or submit touched
  // everything). So a first entry is never flagged mid-typing, while a field
  // already in error clears the moment it becomes valid.
  const [touched, setTouched] = useState<Partial<Record<keyof LoginValues, boolean>>>({});

  const errors = useMemo(() => (validate ?? defaultValidate)(values), [values, validate]);

  const setValue = useCallback(
    <K extends keyof LoginValues>(key: K, next: LoginValues[K]) => {
      const nextValues = { ...values, [key]: next };
      if (!controlled) {
        setInternalValues(nextValues);
        if (statusProp === undefined) {
          setInternalStatus((current) =>
            current === "success" || current === "error" ? "idle" : current,
          );
        }
      }
      onValuesChange?.(nextValues);
    },
    [controlled, onValuesChange, statusProp, values],
  );

  const touch = useCallback((key: keyof LoginValues) => {
    setTouched((prev) => (prev[key] ? prev : { ...prev, [key]: true }));
  }, []);

  /** Error to render for a field — hidden until the field has been touched. */
  const shownError = (key: keyof LoginValues) => (touched[key] ? errors[key] : undefined);

  /** Success check draws only once a touched field is non-empty and valid. */
  const isValid = (key: keyof LoginValues) =>
    Boolean(touched[key]) && !errors[key] && Boolean(values[key]);

  const isSubmitting = status === "loading";

  const handleSubmit = async (event: SubmitEvent<HTMLFormElement>) => {
    event.preventDefault();

    setTouched({
      email: true,
      password: true,
      terms: true,
    });

    if (Object.keys(errors).length > 0) return;
    if (!onSubmit) return;

    if (statusProp === undefined) setInternalStatus("loading");
    try {
      await onSubmit(values);
      if (statusProp === undefined) setInternalStatus("success");
    } catch {
      if (statusProp === undefined) setInternalStatus("error");
    }
  };

  const termsErrorId = `${baseId}-terms-error`;
  const formErrorId = `${baseId}-form-error`;

  return (
    <form
      noValidate
      onSubmit={handleSubmit}
      className={cn(
        "flex w-full max-w-sm flex-col gap-5 rounded-3xl border border-border p-6",
        className,
        classNames?.root,
      )}
    >
      {title || description ? (
        <div className={cn("flex flex-col gap-1", classNames?.header)}>
          {title ? (
            <h2
              className={cn(
                "text-xl font-semibold tracking-tight text-foreground",
                classNames?.title,
              )}
            >
              {title}
            </h2>
          ) : null}
          {description ? (
            <p className={cn("text-sm text-muted-foreground", classNames?.description)}>
              {description}
            </p>
          ) : null}
        </div>
      ) : null}

      <div className={cn("flex flex-col gap-1", classNames?.fields)}>
        <Input
          label="Email"
          type="email"
          inputMode="email"
          autoComplete="email"
          placeholder="you@example.com"
          leftIcon={<Mail />}
          disabled={isSubmitting}
          value={values.email}
          onChange={(next) => setValue("email", next)}
          onBlur={() => touch("email")}
          error={shownError("email")}
          reserveErrorLine
          success={isValid("email")}
        />

        <div className="flex flex-col gap-2">
          <Input
            label="密码"
            type={revealPassword ? "text" : "password"}
            autoComplete="new-password"
            leftIcon={<Lock />}
            rightIcon={
              <button
                type="button"
                disabled={isSubmitting}
                onClick={() => setRevealPassword((prev) => !prev)}
                aria-label={revealPassword ? "Hide password" : "Show password"}
                className="text-muted-foreground transition-colors outline-none hover:text-foreground focus-visible:text-foreground"
              >
                {revealPassword ? <EyeOff /> : <Eye />}
              </button>
            }
            disabled={isSubmitting}
            placeholder="password"
            value={values.password}
            onChange={(next) => setValue("password", next)}
            onBlur={() => touch("password")}
            error={shownError("password")}
            reserveErrorLine
          />
        </div>
      </div>

      <div className={cn("flex flex-col gap-1.5", classNames?.terms)}>
        <Checkbox
          checked={values.terms}
          disabled={isSubmitting}
          onCheckedChange={(next) => {
            setValue("terms", next);
            touch("terms");
          }}
          label="我同意条款和隐私政策"
          aria-describedby={shownError("terms") ? termsErrorId : undefined}
        />
        <AnimatePresence initial={false}>
          {shownError("terms") ? (
            <motion.p
              id={termsErrorId}
              role="alert"
              initial={reduce ? { opacity: 0 } : { opacity: 0, y: -4, filter: "blur(4px)" }}
              animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
              exit={reduce ? { opacity: 0 } : { opacity: 0, y: -4, filter: "blur(4px)" }}
              transition={{ duration: 0.2 }}
              className="px-1 text-xs text-destructive"
            >
              {shownError("terms")}
            </motion.p>
          ) : null}
        </AnimatePresence>
      </div>

      <AnimatePresence initial={false}>
        {errorMessage ? (
          <motion.p
            id={formErrorId}
            role="alert"
            initial={reduce ? { opacity: 0 } : { opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={reduce ? { opacity: 0 } : { opacity: 0, y: -4 }}
            transition={{ duration: 0.2 }}
            className="rounded-2xl border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs text-destructive"
          >
            {errorMessage}
          </motion.p>
        ) : null}
      </AnimatePresence>

      <StatefulButton
        type="submit"
        size="lg"
        state={status}
        loadingText="登录"
        successText="登录成功"
        errorText="请重试"
        aria-describedby={errorMessage ? formErrorId : undefined}
        className={cn("w-full", classNames?.submit)}
      >
        {submitLabel}
      </StatefulButton>

      {footer ? (
        <div className={cn("text-center text-sm text-muted-foreground", classNames?.footer)}>
          {footer}
        </div>
      ) : null}
    </form>
  );
}
