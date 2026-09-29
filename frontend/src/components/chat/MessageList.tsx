import { useCallback, useEffect, useRef, useState } from 'react';

import type { AgentMessage } from '../../agent/types';
import { useMediaQuery } from '../../hooks/useMediaQuery';
import { MessageBubble } from './MessageBubble';
import { Icon } from '../ui/Icon';

function scrollToBottom(node: HTMLDivElement, smooth: boolean): void {
  if (typeof node.scrollTo === 'function') {
    node.scrollTo({ top: node.scrollHeight, behavior: smooth ? 'smooth' : 'auto' });
    return;
  }
  node.scrollTop = node.scrollHeight;
}

export interface MessageListProps {
  messages: AgentMessage[];
  assistantName: string;
  busy: boolean;
  onDecide: (confirmationId: string, decision: 'approved' | 'denied') => void;
  onRetry: () => void;
  onUseSuggestion: (text: string) => void;
}

export function MessageList({
  messages,
  assistantName,
  busy,
  onDecide,
  onRetry,
  onUseSuggestion,
}: MessageListProps) {
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const [pinned, setPinned] = useState(true);
  const reducedMotion = useMediaQuery('(prefers-reduced-motion: reduce)');
  const lastLength = useRef(messages.length);
  const lastTextLength = useRef(0);

  const scrollToLatest = useCallback(() => {
    const node = scrollRef.current;
    if (!node) {
      return;
    }
    scrollToBottom(node, !reducedMotion);
    setPinned(true);
  }, [reducedMotion]);

  const handleScroll = useCallback(() => {
    const node = scrollRef.current;
    if (!node) {
      return;
    }
    const distance = node.scrollHeight - node.scrollTop - node.clientHeight;
    setPinned(distance < 48);
  }, []);

  useEffect(() => {
    const grew = messages.length !== lastLength.current;
    const streamed = messages.length > 0 && messages[messages.length - 1].text.length !== lastTextLength.current;
    if (grew) {
      lastLength.current = messages.length;
    }
    if (messages.length > 0) {
      lastTextLength.current = messages[messages.length - 1].text.length;
    }
    if ((grew || streamed) && pinned) {
      const node = scrollRef.current;
      if (node) {
        scrollToBottom(node, !reducedMotion);
      }
    }
  }, [messages, pinned, reducedMotion]);

  return (
    <div className="relative min-h-0 flex-1">
      <div
        aria-label="Conversation"
        aria-live="polite"
        aria-relevant="additions text"
        className="h-full overflow-y-auto overscroll-contain px-3 py-3"
        onScroll={handleScroll}
        ref={scrollRef}
        role="log"
        tabIndex={0}
      >
        <ol className="space-y-4">
          {messages.map((message) => (
            <MessageBubble
              assistantName={assistantName}
              busy={busy}
              key={message.id}
              message={message}
              onDecide={onDecide}
              onRetry={onRetry}
              onUseSuggestion={onUseSuggestion}
            />
          ))}
        </ol>
      </div>

      {pinned ? null : (
        <button
          className="absolute bottom-3 left-1/2 inline-flex min-h-11 -translate-x-1/2 cursor-pointer items-center gap-1.5 rounded-full border border-border bg-card px-3 py-2 text-xs font-semibold text-foreground shadow-md transition-transform duration-200 hover:-translate-y-px"
          onClick={scrollToLatest}
          type="button"
        >
          <Icon className="h-4 w-4" name="chevron-down" />
          Jump to latest
        </button>
      )}
    </div>
  );
}
