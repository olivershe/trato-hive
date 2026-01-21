/**
 * MessageList Component
 *
 * Displays the conversation history between user and Hive Copilot.
 * Shows executed actions with their results.
 */
'use client';

import { useEffect, useRef } from 'react';
import { User, Bot, CheckCircle2, XCircle, Loader2 } from 'lucide-react';
import type { CoworkerMessage, ExecutedAction } from '@/stores/coworker';

interface MessageListProps {
  messages: CoworkerMessage[];
  isLoading?: boolean;
}

function ActionBadge({ action }: { action: ExecutedAction }) {
  const isSuccess = action.result.success;

  return (
    <div
      className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-medium ${
        isSuccess
          ? 'bg-emerald-100 text-emerald-800'
          : 'bg-red-100 text-red-800'
      }`}
    >
      {isSuccess ? (
        <CheckCircle2 className="w-3 h-3" aria-hidden="true" />
      ) : (
        <XCircle className="w-3 h-3" aria-hidden="true" />
      )}
      <span>{action.tool.replace(/_/g, ' ')}</span>
    </div>
  );
}

function Message({ message }: { message: CoworkerMessage }) {
  const isUser = message.role === 'user';

  return (
    <div className={`flex gap-3 ${isUser ? 'flex-row-reverse' : ''}`}>
      {/* Avatar */}
      <div
        className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
          isUser ? 'bg-charcoal' : 'bg-orange'
        }`}
      >
        {isUser ? (
          <User className="w-4 h-4 text-white" aria-hidden="true" />
        ) : (
          <Bot className="w-4 h-4 text-white" aria-hidden="true" />
        )}
      </div>

      {/* Content */}
      <div
        className={`flex-1 max-w-[80%] ${isUser ? 'text-right' : 'text-left'}`}
      >
        <div
          className={`inline-block px-4 py-3 rounded-2xl ${
            isUser
              ? 'bg-charcoal text-white rounded-br-md'
              : 'bg-white border border-gold/10 text-charcoal rounded-bl-md'
          }`}
        >
          <p className="text-sm whitespace-pre-wrap">{message.content}</p>
        </div>

        {/* Executed Actions */}
        {message.executedActions && message.executedActions.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-2">
            {message.executedActions.map((action, i) => (
              <ActionBadge key={i} action={action} />
            ))}
          </div>
        )}

        {/* Timestamp */}
        <p className="text-xs text-charcoal/40 mt-1">
          {new Date(message.timestamp).toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
          })}
        </p>
      </div>
    </div>
  );
}

export function MessageList({ messages, isLoading }: MessageListProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  if (messages.length === 0 && !isLoading) {
    return null;
  }

  return (
    <div className="flex-1 overflow-y-auto px-4 py-6 space-y-6" role="log" aria-label="Conversation messages" aria-live="polite">
      {messages.map((message) => (
        <Message key={message.id} message={message} />
      ))}

      {isLoading && (
        <div className="flex gap-3">
          <div className="w-8 h-8 rounded-full bg-orange flex items-center justify-center flex-shrink-0">
            <Bot className="w-4 h-4 text-white" aria-hidden="true" />
          </div>
          <div className="flex items-center gap-2 px-4 py-3 bg-white border border-gold/10 rounded-2xl rounded-bl-md">
            <Loader2 className="w-4 h-4 animate-spin motion-reduce:animate-none text-orange" aria-hidden="true" />
            <span className="text-sm text-charcoal/60">Thinking…</span>
          </div>
        </div>
      )}

      <div ref={bottomRef} />
    </div>
  );
}
