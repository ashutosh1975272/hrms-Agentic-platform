import { Component, type ErrorInfo, type ReactNode } from 'react';

import { Button } from '../ui/Button';
import { Icon } from '../ui/Icon';

interface ChatErrorBoundaryProps {
  children: ReactNode;
  /** Labels the surface in the fallback copy, e.g. "AI assistant". */
  label?: string;
}

interface ChatErrorBoundaryState {
  error: Error | null;
}

/**
 * UI-level safety net for the assistant surfaces: a rendering failure inside the
 * panel is contained here so the dashboard around it stays usable, and the user
 * gets a retry instead of a blank screen.
 */
export class ChatErrorBoundary extends Component<
  ChatErrorBoundaryProps,
  ChatErrorBoundaryState
> {
  override state: ChatErrorBoundaryState = { error: null };

  static getDerivedStateFromError(error: Error): ChatErrorBoundaryState {
    return { error };
  }

  override componentDidCatch(error: Error, info: ErrorInfo): void {
    // Surfaced in the browser console for support; never sent anywhere.
    console.error('The AI assistant panel failed to render.', error, info.componentStack);
  }

  private readonly handleRetry = (): void => {
    this.setState({ error: null });
  };

  override render(): ReactNode {
    const { error } = this.state;
    if (!error) {
      return this.props.children;
    }

    return (
      <div className="flex h-full min-h-0 flex-col bg-background" role="alert">
        <div className="flex flex-1 flex-col items-center justify-center gap-3 px-4 py-8 text-center">
          <span className="rounded-2xl bg-destructive/10 p-3 text-destructive">
            <Icon className="h-8 w-8" name="alert" />
          </span>
          <div className="max-w-sm space-y-1">
            <h2 className="font-heading text-base font-semibold text-foreground">
              The {this.props.label ?? 'AI assistant'} could not be displayed
            </h2>
            <p className="text-sm text-muted-foreground">
              Your conversation is still stored in this browser tab. Retry to reopen the panel.
            </p>
          </div>
          <Button icon="rotate" onClick={this.handleRetry} variant="secondary">
            Retry
          </Button>
        </div>
      </div>
    );
  }
}
