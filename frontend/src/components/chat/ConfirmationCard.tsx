import type { AgentConfirmation, ConfirmationRisk } from '../../agent/types';
import { Badge, type BadgeTone } from '../ui/Badge';
import { Button } from '../ui/Button';
import { Icon } from '../ui/Icon';

const RISK_TONE: Record<ConfirmationRisk, BadgeTone> = {
  low: 'neutral',
  medium: 'medium',
  high: 'high',
};

const RISK_LABEL: Record<ConfirmationRisk, string> = {
  low: 'Low risk',
  medium: 'Medium risk',
  high: 'High risk',
};
export interface ConfirmationCardProps {
  confirmation: AgentConfirmation;
  state: 'awaiting' | 'approved' | 'denied';
  busy: boolean;
  onDecide: (decision: 'approved' | 'denied') => void;
}

/**
 * Sensitive action confirmation (PROJECT.md §14): the agent summarises the
 * affected records and waits for an explicit Approve / Deny decision.
 */
export function ConfirmationCard({ confirmation, state, busy, onDecide }: ConfirmationCardProps) {
  const awaiting = state === 'awaiting';

  return (
    <section
      aria-label={`Confirmation required: ${confirmation.title}`}
      className="glass-card rounded-xl border-l-4 border-l-accent p-3"
    >
      <div className="flex flex-wrap items-center gap-2">
        <Icon className="h-4 w-4 text-accent" name="alert" />
        <p className="font-heading text-sm font-semibold text-foreground">{confirmation.title}</p>
        <Badge tone={RISK_TONE[confirmation.risk]}>{RISK_LABEL[confirmation.risk]}</Badge>
      </div>

      <p className="mt-2 text-sm text-foreground">{confirmation.summary}</p>

      <div className="mt-2 rounded-lg bg-muted/70 p-2">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          What will change
        </p>
        <ul className="mt-1 space-y-1 text-xs text-foreground">
          {confirmation.impact.map((entry) => (
            <li className="flex gap-2" key={entry}>
              <span aria-hidden="true" className="leading-4 text-muted-foreground">
                &bull;
              </span>
              <span>{entry}</span>
            </li>
          ))}
        </ul>
      </div>

      {awaiting ? (
        <>
          <p className="mt-2 text-xs text-muted-foreground">
            Nothing runs until you choose. Denying cancels the action and keeps the record unchanged.
          </p>
          <div className="mt-2 flex flex-wrap gap-2">
            <Button
              disabled={busy}
              onClick={() => onDecide('approved')}
              variant="primary"
            >
              Approve
            </Button>
            <Button disabled={busy} onClick={() => onDecide('denied')} variant="secondary">
              Deny
            </Button>
          </div>
        </>
      ) : (
        <p
          className={`mt-3 inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${
            state === 'approved'
              ? 'bg-primary/10 text-primary'
              : 'bg-muted text-muted-foreground'
          }`}
          role="status"
        >
          <Icon className="h-3.5 w-3.5" name={state === 'approved' ? 'check' : 'circle-x'} />
          {state === 'approved' ? 'Approved and executed' : 'Denied — no changes were made'}
        </p>
      )}
    </section>
  );
}
