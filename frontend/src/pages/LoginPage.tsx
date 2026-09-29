import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';

import { useAuth } from '../auth/AuthContext';
import { homeRouteForRole } from '../auth/roles';
import { Button } from '../components/ui/Button';
import { TextField } from '../components/ui/Field';
import { Icon } from '../components/ui/Icon';

const DEMO_ACCOUNTS = [
  { role: 'Admin', email: 'admin@agentichrms.test' },
  { role: 'HR', email: 'hr@agentichrms.test' },
  { role: 'Employee', email: 'employee@agentichrms.test' },
] as const;

const DEMO_PASSWORD = 'demo-pass-1';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

interface FieldErrors {
  email?: string;
  password?: string;
}

export function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState('');
  const [pending, setPending] = useState(false);

  const validate = (): FieldErrors => {
    const errors: FieldErrors = {};
    if (email.trim().length === 0) {
      errors.email = 'Email is required.';
    } else if (!EMAIL_PATTERN.test(email.trim())) {
      errors.email = 'Enter a valid email address.';
    }
    if (password.length === 0) {
      errors.password = 'Password is required.';
    }
    return errors;
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFormError('');
    const errors = validate();
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) {
      return;
    }

    setPending(true);
    try {
      const user = await login({ email: email.trim(), password });
      navigate(homeRouteForRole(user.role), { replace: true });
    } catch (cause) {
      setFormError(cause instanceof Error ? cause.message : 'Sign in failed. Please try again.');
    } finally {
      setPending(false);
    }
  };

  const prefill = (demoEmail: string) => {
    setEmail(demoEmail);
    setPassword(DEMO_PASSWORD);
    setFieldErrors({});
    setFormError('');
  };

  return (
    <div className="app-backdrop flex min-h-screen items-center justify-center px-4 py-10">
      <main className="w-full max-w-md">
        <div className="glass-panel rounded-card p-6 sm:p-8">
          <div className="flex items-center gap-3">
            <span className="inline-flex size-11 items-center justify-center rounded-control bg-primary text-on-primary">
              <Icon name="shield" size={22} />
            </span>
            <div>
              <h1 className="font-heading text-2xl font-semibold text-foreground">Agentic HRMS</h1>
              <p className="text-sm text-muted-foreground">Sign in to open your dashboard.</p>
            </div>
          </div>

          {formError ? (
            <p
              role="alert"
              className="mt-4 rounded-control border border-destructive/40 bg-destructive/10 p-3 text-sm font-medium text-destructive-strong"
            >
              {formError}
            </p>
          ) : null}

          <form className="mt-6 space-y-4" onSubmit={handleSubmit} noValidate>
            <TextField
              label="Work email"
              name="email"
              type="email"
              autoComplete="username"
              inputMode="email"
              required
              value={email}
              onChange={setEmail}
              error={fieldErrors.email ?? null}
            />

            <div>
              <TextField
                label="Password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                required
                value={password}
                onChange={setPassword}
                error={fieldErrors.password ?? null}
                className="[&_input]:pr-24"
              />
              <div className="-mt-1 flex justify-end">
                <button
                  type="button"
                  onClick={() => setShowPassword((current) => !current)}
                  aria-pressed={showPassword}
                  className="inline-flex min-h-11 cursor-pointer items-center gap-1.5 rounded-control px-2 text-sm font-medium text-primary transition-colors duration-200 hover:bg-muted"
                >
                  <Icon name="eye" size={16} />
                  {showPassword ? 'Hide password' : 'Show password'}
                </button>
              </div>
            </div>

            <Button type="submit" size="lg" block disabled={pending} icon={pending ? 'refresh' : undefined}>
              {pending ? 'Signing in…' : 'Sign in'}
            </Button>
          </form>

          <section aria-labelledby="demo-accounts" className="mt-8 border-t border-border pt-4">
            <h2 className="text-sm font-semibold text-foreground" id="demo-accounts">
              Demo accounts
            </h2>
            <p className="mt-1 text-xs text-muted-foreground">
              Mock data only. These accounts exist in the local mock adapter.
            </p>
            <ul className="mt-3 space-y-2">
              {DEMO_ACCOUNTS.map((account) => (
                <li key={account.email}>
                  <button
                    type="button"
                    onClick={() => prefill(account.email)}
                    className="flex min-h-11 w-full cursor-pointer items-center gap-2 rounded-control border border-border px-3 text-left text-sm font-medium text-foreground transition-[background-color,border-color] duration-200 hover:border-primary hover:bg-primary-soft"
                  >
                    <Icon name="user" size={16} />
                    Use {account.role} demo account
                  </button>
                </li>
              ))}
            </ul>
          </section>
        </div>
      </main>
    </div>
  );
}
