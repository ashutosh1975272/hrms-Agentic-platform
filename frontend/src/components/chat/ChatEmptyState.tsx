import type { Role } from '../../api/types';
import { Icon } from '../ui/Icon';

export interface ChatEmptyStateProps {
  role: Role;
  onUsePrompt: (text: string) => void;
}

const SHARED_PROMPTS = ['What is the work-from-home policy?', 'How many leaves do I have left?'];

const ROLE_PROMPTS: Record<Role, string[]> = {
  employee: ['Show my pending leave requests', 'Delete employee Rahul'],
  hr: [
    'Add a new employee named Rahul Kumar to the Engineering department',
    'Show all employees in the Engineering department',
  ],
  admin: [
    'Show all employees in the Engineering department',
    'Delete employee Rahul',
  ],
};

function HeadingArt() {
  return (
    <svg
      aria-hidden="true"
      className="h-16 w-16 text-primary"
      fill="none"
      focusable="false"
      height={64}
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={1.25}
      viewBox="0 0 24 24"
      width={64}
    >
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
      <path d="M12 7.5 13.1 10l2.6.4-1.9 1.9.5 2.6-2.3-1.3-2.3 1.3.5-2.6-1.9-1.9 2.6-.4z" />
    </svg>
  );
}

export function ChatEmptyState({ role, onUsePrompt }: ChatEmptyStateProps) {
  const prompts = [...ROLE_PROMPTS[role], ...SHARED_PROMPTS];

  return (
    <div className="flex h-full flex-col items-center justify-center gap-4 px-4 py-8 text-center">
      <span className="rounded-2xl bg-primary/10 p-3">
        <HeadingArt />
      </span>
      <div className="max-w-md space-y-1">
        <h3 className="font-heading text-lg font-semibold text-foreground">Ask the HR assistant</h3>
        <p className="text-sm text-muted-foreground">
          It answers policy questions from the knowledge base, reads live HRMS data, and asks for
          confirmation before any change is saved.
        </p>
      </div>
      <ul className="flex max-w-lg flex-wrap justify-center gap-2">
        {prompts.map((prompt) => (
          <li key={prompt}>
            <button
              className="inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-full border border-border bg-card px-3 py-2 text-left text-xs font-medium text-foreground transition-colors duration-200 hover:border-primary hover:bg-primary/10"
              onClick={() => onUsePrompt(prompt)}
              type="button"
            >
              <Icon className="h-3.5 w-3.5 text-primary" name="sparkles" />
              {prompt}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
