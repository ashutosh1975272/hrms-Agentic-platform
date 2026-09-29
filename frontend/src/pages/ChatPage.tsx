import { ChatPanel } from '../components/chat/ChatPanel';
import { useAuth } from '../auth/AuthContext';
import { useChat } from '../chat/useChat';
import { Badge } from '../components/ui/Badge';

export function ChatPage() {
  const { user } = useAuth();
  const { clientKind } = useChat();

  return (
    <div className="flex h-[calc(100dvh-18rem)] min-h-[28rem] flex-col gap-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="font-heading text-2xl font-semibold text-foreground">AI assistant</h1>
          <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
            Ask policy questions, read live HRMS data, or run an authorized action. Every tool call is
            checked against your role, and destructive changes need an explicit confirmation.
          </p>
        </div>
        {clientKind === 'mock' ? (
          <Badge tone="info">Demo agent adapter</Badge>
        ) : (
          <Badge tone="neutral">Live agent API</Badge>
        )}
      </div>

      <section
        aria-label="AI chat"
        className="glass-card min-h-0 flex-1 overflow-hidden rounded-xl shadow-md"
      >
        <ChatPanel variant="page" />
      </section>

      <p className="text-xs text-muted-foreground">
        {clientKind === 'mock'
          ? 'Running on the local mock adapter. Set VITE_USE_MOCK=false to call the TASK-07 agent API.'
          : `Signed in as ${user?.fullName ?? 'unknown user'}. Conversation context stays in this browser tab.`}
      </p>
    </div>
  );
}
