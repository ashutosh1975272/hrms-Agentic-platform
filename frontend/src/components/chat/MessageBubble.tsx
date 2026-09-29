import type { AgentMessage } from '../../agent/types';
import { Markdown } from './Markdown';
import { ToolCallProgress } from './ToolCallProgress';
import { ConfirmationCard } from './ConfirmationCard';
import { Button } from '../ui/Button';
import { Icon } from '../ui/Icon';

function formatTime(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) {
    return '';
  }
  return date.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
}

function hasDeniedStep(message: AgentMessage): boolean {
  return message.toolCalls.some((call) => call.status === 'denied');
}

export interface MessageBubbleProps {
  message: AgentMessage;
  assistantName: string;
  busy: boolean;
  onDecide: (confirmationId: string, decision: 'approved' | 'denied') => void;
  onRetry: () => void;
  onUseSuggestion: (text: string) => void;
}

export function MessageBubble({
  message,
  assistantName,
  busy,
  onDecide,
  onRetry,
  onUseSuggestion,
}: MessageBubbleProps) {
  const isUser = message.role === 'user';
  const text = message.text.trimEnd();
  const denied = hasDeniedStep(message);
  const streaming = message.status === 'streaming';
  const confirmation = message.confirmation;
  const confirmationState =
    message.confirmationState === 'awaiting'
      ? 'awaiting'
      : message.confirmationState === 'approved'
        ? 'approved'
        : 'denied';

  return (
    <li className={`stagger-item flex gap-2 ${isUser ? 'justify-end' : 'justify-start'}`}>
      {isUser ? null : (
        <span
          aria-hidden="true"
          className="mt-1 hidden h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary sm:flex"
        >
          <Icon className="h-4 w-4" name="sparkles" />
        </span>
      )}

      <div className={`min-w-0 max-w-[85%] sm:max-w-[80%] ${isUser ? 'items-end' : 'items-start'}`}>
        <p className={`mb-1 flex items-center gap-2 text-xs text-muted-foreground ${isUser ? 'justify-end' : 'justify-start'}`}>
          <span className="font-semibold text-foreground">{isUser ? 'You' : assistantName}</span>
          <time dateTime={message.createdAt}>{formatTime(message.createdAt)}</time>
        </p>

        <div
          className={`rounded-2xl px-3 py-2 text-sm shadow-sm ${
            isUser
              ? 'rounded-br-sm bg-primary text-on-primary'
              : 'glass-card rounded-bl-sm'
          }`}
        >
          {message.toolCalls.length > 0 ? <ToolCallProgress calls={message.toolCalls} /> : null}

          {denied ? (
            <p className="mb-2 inline-flex items-center gap-2 rounded-lg border border-destructive px-2 py-1 text-xs font-semibold text-destructive">
              <Icon className="h-4 w-4" name="shield-x" />
              Request blocked by the permission layer
            </p>
          ) : null}

          {text.length > 0 ? (
            <div className={message.toolCalls.length > 0 ? 'mt-2' : ''}>
              <Markdown content={text} />
            </div>
          ) : null}

          {streaming ? (
            <p className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
              <Icon className="h-3.5 w-3.5 motion-safe:animate-spin" name="loader" />
              {text.length > 0 ? 'Still writing' : 'Working on it'}
            </p>
          ) : null}

          {message.citations.length > 0 ? (
            <section aria-label="Sources" className="mt-3 border-t border-border pt-2">
              <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                <Icon className="h-3.5 w-3.5" name="book" />
                Sources
              </p>
              <ul className="mt-1 space-y-1.5">
                {message.citations.map((citation) => (
                  <li className="text-xs text-foreground" key={citation.id}>
                    <span className="font-semibold">{citation.title}</span>
                    <span className="block text-muted-foreground">{citation.source}</span>
                    {citation.excerpt ? (
                      <span className="mt-0.5 block text-muted-foreground">“{citation.excerpt}”</span>
                    ) : null}
                  </li>
                ))}
              </ul>
            </section>
          ) : null}

          {confirmation ? (
            <div className="mt-3">
              <ConfirmationCard
                busy={busy}
                confirmation={confirmation}
                onDecide={(decision) => onDecide(confirmation.id, decision)}
                state={confirmationState}
              />
            </div>
          ) : null}

          {message.error ? (
            <div className="mt-2 rounded-lg border border-destructive bg-background p-2" role="alert">
              <p className="flex items-center gap-1.5 text-xs font-semibold text-destructive">
                <Icon className="h-4 w-4" name="alert" />
                Request failed
              </p>
              <p className="mt-1 text-xs text-foreground">{message.error.message}</p>
              {message.error.retryable ? (
                <Button
                  className="mt-2"
                  disabled={busy}
                  icon="rotate"
                  onClick={onRetry}
                  variant="secondary"
                >
                  Retry
                </Button>
              ) : null}
            </div>
          ) : null}
        </div>

        {message.suggestions.length > 0 && !streaming ? (
          <div className="mt-2 flex flex-wrap gap-1.5">
            {message.suggestions.map((suggestion) => (
              <button
                className="min-h-11 cursor-pointer rounded-full border border-border bg-card px-3 py-1.5 text-left text-xs text-foreground transition-colors duration-200 hover:border-primary hover:bg-primary/10"
                disabled={busy}
                key={suggestion}
                onClick={() => onUseSuggestion(suggestion)}
                type="button"
              >
                {suggestion}
              </button>
            ))}
          </div>
        ) : null}
      </div>
    </li>
  );
}
