import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { ChatErrorBoundary } from './ChatErrorBoundary';

function Boom(): never {
  throw new Error('render exploded');
}

function renderBoundary(child: React.ReactNode) {
  return render(<ChatErrorBoundary label="assistant panel">{child}</ChatErrorBoundary>);
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe('ChatErrorBoundary', () => {
  it('renders its children when nothing fails', () => {
    renderBoundary(<p>conversation</p>);

    expect(screen.getByText('conversation')).toBeInTheDocument();
    expect(screen.queryByRole('alert')).toBeNull();
  });

  it('contains a render failure and offers a retry', async () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const user = userEvent.setup();
    renderBoundary(<Boom />);

    const alert = screen.getByRole('alert');
    expect(alert).toHaveTextContent(/the assistant panel could not be displayed/i);

    // The retry re-mounts the subtree, which throws again here — the point is
    // that the fallback is rendered instead of an empty screen.
    await user.click(screen.getByRole('button', { name: /retry/i }));
    expect(screen.getByRole('button', { name: /retry/i })).toBeInTheDocument();
    expect(consoleError).toHaveBeenCalled();
  });
});
