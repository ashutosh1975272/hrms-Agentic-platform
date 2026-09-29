import type { Role } from '../api/types';

/**
 * Contract for the Agentic AI assistant (TASK-07 backend agent API).
 *
 * The UI never calls a tool directly: it sends a turn and renders the
 * events streamed back by the agent (PROJECT.md §12 workflow,
 * §13 permission layer, §14 confirmation, §15 conversation context).
 */

export type ToolCallStatus = 'running' | 'succeeded' | 'denied' | 'failed';

export interface AgentToolCall {
  id: string;
  /** Stable tool name, e.g. `POLICY_SEARCH` or `LEAVE_BALANCE_READ`. */
  name: string;
  /** Human readable progress label, e.g. "Searching policies…". */
  label: string;
  status: ToolCallStatus;
  detail?: string;
}

export interface AgentCitation {
  id: string;
  title: string;
  source: string;
  excerpt?: string;
}

export type ConfirmationRisk = 'low' | 'medium' | 'high';

export interface AgentConfirmation {
  id: string;
  /** Tool that will run once the user approves, e.g. `EMPLOYEE_CREATE`. */
  action: string;
  title: string;
  summary: string;
  /** Records or fields the action will touch (PROJECT.md §14). */
  impact: string[];
  risk: ConfirmationRisk;
}

export type AgentMessageStatus = 'streaming' | 'complete' | 'failed';

export interface AgentMessageError {
  message: string;
  retryable: boolean;
}

export interface AgentMessage {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  createdAt: string;
  status: AgentMessageStatus;
  toolCalls: AgentToolCall[];
  citations: AgentCitation[];
  confirmation: AgentConfirmation | null;
  confirmationState: 'none' | 'awaiting' | 'approved' | 'denied';
  /** Follow-up prompts the user can pick instead of typing. */
  suggestions: string[];
  error: AgentMessageError | null;
}

/** Multi-step state carried between turns of one conversation (PROJECT.md §15). */
export interface CreateEmployeePending {
  kind: 'create_employee';
  name: string;
  department: string;
  email: string | null;
  designation: string | null;
}

export interface LeaveApprovalPending {
  kind: 'leave_approval';
  employeeName: string;
  leaveType: string;
  from: string;
  to: string;
}

export type AgentPending = CreateEmployeePending | LeaveApprovalPending | null;

export interface AgentConversation {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  messages: AgentMessage[];
  pending: AgentPending;
}

export type AgentTurnStatus = 'pending' | 'streaming' | 'awaiting_confirmation' | 'failed';

export type AgentEvent =
  | { type: 'turn_started' }
  | { type: 'tool'; call: AgentToolCall }
  | { type: 'tool_settled'; id: string; status: ToolCallStatus; detail?: string }
  | { type: 'delta'; text: string }
  | { type: 'citations'; citations: AgentCitation[] }
  | { type: 'confirmation'; confirmation: AgentConfirmation }
  | { type: 'confirmation_settled'; id: string; decision: 'approved' | 'denied' }
  | { type: 'suggestions'; suggestions: string[] }
  | { type: 'error'; message: string; retryable: boolean }
  | { type: 'done'; pending: AgentPending };

export type AgentEmit = (event: AgentEvent) => void;

export interface AgentIdentity {
  userId: string;
  fullName: string;
  role: Role;
}

/** Everything the agent needs to answer one turn. */
export interface AgentTurnInput {
  accessToken: string;
  conversationId: string;
  messageId: string;
  identity: AgentIdentity;
  text: string;
  pending: AgentPending;
  /** Prior turns, oldest first, capped by the client. */
  history: Array<{ role: 'user' | 'assistant'; text: string }>;
}

export interface AgentConfirmationInput {
  accessToken: string;
  conversationId: string;
  identity: AgentIdentity;
  confirmation: AgentConfirmation;
  decision: 'approved' | 'denied';
}

export interface AgentClient {
  /** `mock` replays the PROJECT.md §17 scenarios locally, `http` calls the backend. */
  readonly kind: 'mock' | 'http';
  sendTurn(input: AgentTurnInput, emit: AgentEmit, signal?: AbortSignal): Promise<void>;
  resolveConfirmation(
    input: AgentConfirmationInput,
    emit: AgentEmit,
    signal?: AbortSignal,
  ): Promise<void>;
  /** Conversation title shown in the history list. */
  suggestTitle(text: string): string;
}
