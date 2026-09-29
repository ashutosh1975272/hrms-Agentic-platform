import type { AgentToolCall } from '../../agent/types';
import { Icon, type IconName } from '../ui/Icon';
import type { ToolCallStatus } from '../../agent/types';

const STATUS_ICON: Record<ToolCallStatus, IconName> = {
  running: 'loader',
  succeeded: 'check-circle',
  denied: 'circle-x',
  failed: 'alert',
};

const STATUS_TEXT: Record<ToolCallStatus, string> = {
  running: 'in progress',
  succeeded: 'done',
  denied: 'denied',
  failed: 'failed',
};

const STATUS_CLASS: Record<ToolCallStatus, string> = {
  running: 'text-primary',
  succeeded: 'text-muted-foreground',
  denied: 'text-destructive',
  failed: 'text-destructive',
};

export interface ToolCallProgressProps {
  calls: AgentToolCall[];
}

/** Agentic workflow steps (PROJECT.md §12) shown while the turn runs. */
export function ToolCallProgress({ calls }: ToolCallProgressProps) {
  if (calls.length === 0) {
    return null;
  }

  return (
    <div aria-label="Agent tool activity" className="rounded-lg border border-border bg-card/70 p-2.5">
      <ol className="space-y-1.5">
        {calls.map((call) => (
          <li className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs" key={call.id}>
            <Icon
              className={`h-4 w-4 shrink-0 ${STATUS_CLASS[call.status]} ${
                call.status === 'running' ? 'motion-safe:animate-spin' : ''
              }`}
              name={STATUS_ICON[call.status]}
            />
            <span className="font-medium text-foreground">{call.label}</span>
            <span className={STATUS_CLASS[call.status]}>
              <span className="sr-only">Status: </span>
              {STATUS_TEXT[call.status]}
            </span>
            {call.detail ? <span className="text-muted-foreground">{call.detail}</span> : null}
          </li>
        ))}
      </ol>
    </div>
  );
}
