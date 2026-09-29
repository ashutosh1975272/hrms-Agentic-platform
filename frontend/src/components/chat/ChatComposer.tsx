import { useId, useRef, useState, type ChangeEvent, type FormEvent, type KeyboardEvent } from 'react';

import { Button } from '../ui/Button';

const MAX_LENGTH = 1000;

export interface ChatComposerProps {
  busy: boolean;
  disabled?: boolean;
  onSend: (text: string) => void;
  onStop: () => void;
}

export function ChatComposer({ busy, disabled = false, onSend, onStop }: ChatComposerProps) {
  const [value, setValue] = useState('');
  const [tooLong, setTooLong] = useState(false);
  const fieldId = useId();
  const remaining = MAX_LENGTH - value.trim().length;
  const hintId = `${fieldId}-hint`;
  const errorId = `${fieldId}-error`;
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmed = value.trim();
    if (trimmed.length === 0 || tooLong || busy || disabled) {
      return;
    }
    onSend(trimmed);
    setValue('');
    setTooLong(false);
  };

  const handleChange = (event: ChangeEvent<HTMLTextAreaElement>) => {
    const next = event.target.value;
    setValue(next);
    setTooLong(next.trim().length > MAX_LENGTH);
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      const trimmed = value.trim();
      if (trimmed.length > 0 && !tooLong && !busy && !disabled) {
        onSend(trimmed);
        setValue('');
        setTooLong(false);
      }
    }
  };

  return (
    <form
      className="border-t border-border bg-background/80 p-2.5"
      noValidate
      onSubmit={submit}
    >
      <label className="sr-only" htmlFor={fieldId}>
        Message the HR assistant
      </label>
      <div className="flex items-end gap-2">
        <div className="min-w-0 flex-1">
          <textarea
            aria-describedby={tooLong ? `${hintId} ${errorId}` : hintId}
            aria-invalid={tooLong ? 'true' : undefined}
            className="max-h-32 min-h-11 w-full resize-y rounded-lg border border-border bg-card px-3 py-2.5 text-sm text-foreground transition-colors duration-200 placeholder:text-muted-foreground focus:border-primary focus-visible:outline-2 focus-visible:outline-offset-2"
            id={fieldId}
            name="message"
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            placeholder="Ask about policies, balances, or an action to run…"
            ref={textareaRef}
            rows={2}
            value={value}
          />
          <p className="mt-1 text-xs text-muted-foreground" id={hintId}>
            Enter sends, Shift + Enter adds a line.{' '}
            {tooLong
              ? `${Math.abs(remaining)} characters over the limit.`
              : `${remaining} characters left.`}
          </p>
          {tooLong ? (
            <p className="mt-1 text-xs font-medium text-destructive" id={errorId}>
              Your message is too long. Shorten it to under {MAX_LENGTH} characters before sending.
            </p>
          ) : null}
        </div>

        {busy ? (
          <Button aria-label="Stop generating" icon="minus" onClick={onStop} variant="secondary" />
        ) : (
          <Button
            aria-label="Send message"
            disabled={value.trim().length === 0 || tooLong || disabled}
            icon="arrow-up"
            type="submit"
            variant="primary"
          />
        )}
      </div>
      <p className="sr-only" role="status">
        {busy ? 'The assistant is working. Use stop generating to cancel.' : 'Ready for your message.'}
      </p>
    </form>
  );
}
