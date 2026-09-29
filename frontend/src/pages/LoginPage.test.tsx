import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { describe, expect, it } from 'vitest';

import { createMockAdapter } from '../api/mockAdapter';
import { AuthProvider } from '../auth/AuthContext';
import { LoginPage } from './LoginPage';

const DEMO_PASSWORD = 'demo-pass-1';

function renderLogin() {
  return render(
    <MemoryRouter initialEntries={['/login']}>
      <AuthProvider client={createMockAdapter()}>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/dashboard" element={<p>employee dashboard</p>} />
          <Route path="/hr" element={<p>hr dashboard</p>} />
          <Route path="/admin" element={<p>admin dashboard</p>} />
        </Routes>
      </AuthProvider>
    </MemoryRouter>,
  );
}

async function submitCredentials(
  user: ReturnType<typeof userEvent.setup>,
  email: string,
  password: string,
) {
  await user.clear(screen.getByLabelText(/email/i));
  await user.type(screen.getByLabelText(/email/i), email);
  await user.clear(screen.getByLabelText(/password/i));
  await user.type(screen.getByLabelText(/password/i), password);
  await user.click(screen.getByRole('button', { name: /sign in/i }));
}

describe('LoginPage', () => {
  it('renders a labelled email and password field', async () => {
    renderLogin();

    expect(await screen.findByLabelText(/email/i)).toHaveAttribute('type', 'email');
    expect(screen.getByLabelText(/password/i)).toHaveAttribute('type', 'password');
    expect(screen.getByLabelText(/password/i)).toHaveAttribute('autocomplete', 'current-password');
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(/agentic hrms/i);
  });

  it('flags an empty email as invalid and links the message to the field', async () => {
    const user = userEvent.setup();
    renderLogin();

    await user.click(screen.getByRole('button', { name: /sign in/i }));

    const email = await screen.findByLabelText(/email/i);
    const error = await screen.findByText(/email is required/i);
    expect(email).toHaveAttribute('aria-invalid', 'true');
    expect(email).toHaveAttribute('aria-describedby', error.id);
  });

  it('rejects a malformed email before calling the api', async () => {
    const user = userEvent.setup();
    renderLogin();

    await submitCredentials(user, 'not-an-email', DEMO_PASSWORD);

    expect(await screen.findByText(/valid email/i)).toBeInTheDocument();
    expect(screen.queryByRole('alert')).toBeNull();
  });

  it('toggles password visibility with an accessible button', async () => {
    const user = userEvent.setup();
    renderLogin();
    const password = await screen.findByLabelText(/^password/i);

    await user.click(screen.getByRole('button', { name: /show password/i }));

    expect(password).toHaveAttribute('type', 'text');
    expect(screen.getByRole('button', { name: /hide password/i })).toBeInTheDocument();
  });

  it('routes an employee to the employee dashboard after login', async () => {
    const user = userEvent.setup();
    renderLogin();

    await submitCredentials(user, 'employee@agentichrms.test', DEMO_PASSWORD);

    expect(await screen.findByText('employee dashboard')).toBeInTheDocument();
  });

  it('routes an admin to the admin dashboard after login', async () => {
    const user = userEvent.setup();
    renderLogin();

    await submitCredentials(user, 'admin@agentichrms.test', DEMO_PASSWORD);

    expect(await screen.findByText('admin dashboard')).toBeInTheDocument();
  });

  it('routes hr to the hr dashboard after login', async () => {
    const user = userEvent.setup();
    renderLogin();

    await submitCredentials(user, 'hr@agentichrms.test', DEMO_PASSWORD);

    expect(await screen.findByText('hr dashboard')).toBeInTheDocument();
  });

  it('shows an alert and keeps the user on the form when credentials are rejected', async () => {
    const user = userEvent.setup();
    renderLogin();

    await submitCredentials(user, 'employee@agentichrms.test', 'wrong-pass');

    expect(await screen.findByRole('alert')).toHaveTextContent(/invalid email or password/i);
    expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument();
  });

  it('prefills the form from the demo account shortcuts', async () => {
    const user = userEvent.setup();
    renderLogin();

    await user.click(await screen.findByRole('button', { name: /use admin demo account/i }));
    await user.click(screen.getByRole('button', { name: /sign in/i }));

    expect(await screen.findByText('admin dashboard')).toBeInTheDocument();
  });

  it('disables the submit button while the login request is in flight', async () => {
    const user = userEvent.setup();
    const client = createMockAdapter(50);
    render(
      <MemoryRouter initialEntries={['/login']}>
        <AuthProvider client={client}>
          <LoginPage />
        </AuthProvider>
      </MemoryRouter>,
    );

    await user.type(await screen.findByLabelText(/email/i), 'admin@agentichrms.test');
    await user.type(screen.getByLabelText(/password/i), DEMO_PASSWORD);
    await user.click(screen.getByRole('button', { name: /sign in/i }));

    await waitFor(() => expect(screen.getByRole('button', { name: /signing in/i })).toBeDisabled());
  });
});
