import { useId, useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';

import { useAuth } from '../auth/AuthContext';
import { homeRouteForRole } from '../auth/roles';

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
  const emailId = useId();
  const passwordId = useId();
  const emailErrorId = `${emailId}-error`;
  const passwordErrorId = `${passwordId}-error`;

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
    <main className="flex min-h-screen items-center justify-center bg-slate-100 px-4 py-10">
      <div className="w-full max-w-md rounded-xl border border-slate-200 bg-white p-8 shadow-sm">
        <h1 className="text-2xl font-semibold text-slate-900">Agentic HRMS</h1>
        <p className="mt-1 text-sm text-slate-600">Sign in to open your dashboard.</p>

        {formError ? (
          <p role="alert" className="mt-4 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-800">
            {formError}
          </p>
        ) : null}

        <form className="mt-6 space-y-4" onSubmit={handleSubmit} noValidate>
          <div>
            <label className="block text-sm font-medium text-slate-800" htmlFor={emailId}>
              Work email
            </label>
            <input
              className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-slate-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-900"
              id={emailId}
              name="email"
              type="email"
              autoComplete="username"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              aria-invalid={fieldErrors.email ? 'true' : undefined}
              aria-describedby={fieldErrors.email ? emailErrorId : undefined}
            />
            {fieldErrors.email ? (
              <p className="mt-1 text-sm text-red-700" id={emailErrorId}>
                {fieldErrors.email}
              </p>
            ) : null}
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-800" htmlFor={passwordId}>
              Password
            </label>
            <div className="mt-1 flex items-center gap-2">
              <input
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-slate-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-900"
                id={passwordId}
                name="password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                required
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                aria-invalid={fieldErrors.password ? 'true' : undefined}
                aria-describedby={fieldErrors.password ? passwordErrorId : undefined}
              />
              <button
                type="button"
                className="rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-900"
                onClick={() => setShowPassword((current) => !current)}
              >
                {showPassword ? 'Hide password' : 'Show password'}
              </button>
            </div>
            {fieldErrors.password ? (
              <p className="mt-1 text-sm text-red-700" id={passwordErrorId}>
                {fieldErrors.password}
              </p>
            ) : null}
          </div>

          <button
            type="submit"
            className="w-full rounded-md bg-slate-900 px-4 py-2 font-medium text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-900 disabled:cursor-not-allowed disabled:opacity-60"
            disabled={pending}
          >
            {pending ? 'Signing in…' : 'Sign in'}
          </button>
        </form>

        <section aria-labelledby="demo-accounts" className="mt-8 border-t border-slate-200 pt-4">
          <h2 className="text-sm font-medium text-slate-800" id="demo-accounts">
            Demo accounts
          </h2>
          <p className="mt-1 text-xs text-slate-600">
            Mock data only. These accounts exist in the local mock adapter.
          </p>
          <ul className="mt-3 space-y-2">
            {DEMO_ACCOUNTS.map((account) => (
              <li key={account.email}>
                <button
                  type="button"
                  className="w-full rounded-md border border-slate-300 px-3 py-2 text-left text-sm text-slate-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-900"
                  onClick={() => prefill(account.email)}
                >
                  Use {account.role} demo account
                </button>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </main>
  );
}
