import { useId, type ReactNode, type SelectHTMLAttributes, type TextareaHTMLAttributes } from 'react';

const CONTROL_BASE =
  'w-full rounded-control border bg-card px-3 py-2 text-sm text-foreground transition-[border-color,box-shadow] duration-200 ease-out ' +
  'placeholder:text-muted-foreground/70 disabled:cursor-not-allowed disabled:bg-muted disabled:text-muted-foreground';

const CONTROL_OK = 'border-border hover:border-primary-soft focus:border-primary';
const CONTROL_ERROR = 'border-destructive bg-destructive/5';

function describedBy(hintId: string, errorId: string, hint: string | undefined, error: string | null | undefined): string | undefined {
  const ids = [hint ? hintId : null, error ? errorId : null].filter(Boolean);
  return ids.length > 0 ? ids.join(' ') : undefined;
}

export interface FieldRowProps {
  label: string;
  hint?: string;
  error?: string | null;
  required?: boolean;
  className?: string;
  children: (ids: { fieldId: string; describedBy: string | undefined }) => ReactNode;
}

/**
 * Label + control + inline error. Errors are always rendered next to the field,
 * never only in colour, and are linked with aria-describedby.
 */
export function FieldRow({ label, hint, error, required, className = '', children }: FieldRowProps) {
  const reactId = useId();
  const fieldId = `${reactId}-field`;
  const hintId = `${reactId}-hint`;
  const errorId = `${reactId}-error`;

  return (
    <div className={`min-w-0 ${className}`.trim()}>
      <label className="block text-sm font-medium text-foreground" htmlFor={fieldId}>
        {label}
        {required ? <span className="ml-1 text-destructive">*</span> : null}
        {required ? <span className="sr-only"> (required)</span> : null}
      </label>
      {hint ? (
        <p className="mt-1 text-xs text-muted-foreground" id={hintId}>
          {hint}
        </p>
      ) : null}
      <div className="mt-1.5">
        {children({ fieldId, describedBy: describedBy(hintId, errorId, hint, error) })}
      </div>
      {error ? (
        <p className="mt-1.5 text-sm font-medium text-destructive" id={errorId}>
          {error}
        </p>
      ) : null}
    </div>
  );
}

export interface TextFieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  hint?: string;
  error?: string | null;
  required?: boolean;
  name?: string;
  type?: 'text' | 'email' | 'tel' | 'date' | 'time' | 'search' | 'number' | 'password';
  autoComplete?: string;
  placeholder?: string;
  inputMode?: 'text' | 'email' | 'tel' | 'numeric' | 'search';
  min?: string;
  max?: string;
  className?: string;
  disabled?: boolean;
  autoFocus?: boolean;
}

export function TextField({
  label,
  value,
  onChange,
  hint,
  error,
  required,
  name,
  type = 'text',
  autoComplete,
  placeholder,
  inputMode,
  min,
  max,
  className,
  disabled,
  autoFocus,
}: TextFieldProps) {
  return (
    <FieldRow label={label} hint={hint} error={error} required={required} className={className}>
      {({ fieldId, describedBy: described }) => (
        <input
          id={fieldId}
          name={name}
          type={type}
          value={value}
          autoComplete={autoComplete}
          placeholder={placeholder}
          inputMode={inputMode}
          min={min}
          max={max}
          disabled={disabled}
          autoFocus={autoFocus}
          required={required}
          aria-invalid={error ? 'true' : undefined}
          aria-describedby={described}
          onChange={(event) => onChange(event.target.value)}
          className={`${CONTROL_BASE} ${error ? CONTROL_ERROR : CONTROL_OK} min-h-11`}
        />
      )}
    </FieldRow>
  );
}

export interface SelectOption {
  value: string;
  label: string;
}

export interface SelectFieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: readonly SelectOption[];
  hint?: string;
  error?: string | null;
  required?: boolean;
  name?: string;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}

export function SelectField({
  label,
  value,
  onChange,
  options,
  hint,
  error,
  required,
  name,
  placeholder,
  className,
  disabled,
}: SelectFieldProps) {
  return (
    <FieldRow label={label} hint={hint} error={error} required={required} className={className}>
      {({ fieldId, describedBy: described }) => (
        <select
          id={fieldId}
          name={name}
          value={value}
          disabled={disabled}
          required={required}
          aria-invalid={error ? 'true' : undefined}
          aria-describedby={described}
          onChange={(event) => onChange(event.target.value)}
          className={`${CONTROL_BASE} ${error ? CONTROL_ERROR : CONTROL_OK} min-h-11 cursor-pointer`}
        >
          {placeholder ? (
            <option value="" disabled>
              {placeholder}
            </option>
          ) : null}
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      )}
    </FieldRow>
  );
}

export interface TextareaFieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  hint?: string;
  error?: string | null;
  required?: boolean;
  name?: string;
  rows?: number;
  placeholder?: string;
  className?: string;
  maxLength?: number;
  disabled?: boolean;
}

export function TextareaField({
  label,
  value,
  onChange,
  hint,
  error,
  required,
  name,
  rows = 4,
  placeholder,
  className,
  maxLength,
  disabled,
}: TextareaFieldProps) {
  return (
    <FieldRow label={label} hint={hint} error={error} required={required} className={className}>
      {({ fieldId, describedBy: described }) => (
        <textarea
          id={fieldId}
          name={name}
          rows={rows}
          value={value}
          maxLength={maxLength}
          disabled={disabled}
          required={required}
          placeholder={placeholder}
          aria-invalid={error ? 'true' : undefined}
          aria-describedby={described}
          onChange={(event) => onChange(event.target.value)}
          className={`${CONTROL_BASE} ${error ? CONTROL_ERROR : CONTROL_OK} resize-y`}
        />
      )}
    </FieldRow>
  );
}

export interface CheckboxFieldProps {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  hint?: string;
  name?: string;
  disabled?: boolean;
}

export function CheckboxField({ label, checked, onChange, hint, name, disabled }: CheckboxFieldProps) {
  const reactId = useId();
  const hintId = `${reactId}-hint`;
  return (
    <div className="min-w-0">
      <div className="flex items-start gap-2.5">
        <input
          id={reactId}
          name={name}
          type="checkbox"
          checked={checked}
          disabled={disabled}
          aria-describedby={hint ? hintId : undefined}
          onChange={(event) => onChange(event.target.checked)}
          className="mt-0.5 size-5 shrink-0 cursor-pointer rounded border-border accent-primary"
        />
        <label className="cursor-pointer text-sm font-medium text-foreground" htmlFor={reactId}>
          {label}
        </label>
      </div>
      {hint ? (
        <p className="mt-1 pl-7.5 text-xs text-muted-foreground" id={hintId}>
          {hint}
        </p>
      ) : null}
    </div>
  );
}

export type SelectAttributes = SelectHTMLAttributes<HTMLSelectElement>;
export type TextareaAttributes = TextareaHTMLAttributes<HTMLTextAreaElement>;
