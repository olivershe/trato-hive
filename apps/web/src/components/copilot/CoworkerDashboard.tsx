/**
 * CoworkerDashboard Component
 *
 * Full-screen dashboard for Hive Copilot - the AI co-worker.
 * Features quick action cards, chat interface, and workspace status.
 */
'use client';

import { useCallback } from 'react';
import {
  Table2,
  TrendingUp,
  MousePointer2,
  FolderOpen,
  Sun,
  MessageSquare,
} from 'lucide-react';
import { QuickActionCard, type QuickAction } from './QuickActionCard';
import { ChatInput } from './ChatInput';
import { MessageList } from './MessageList';
import { useCoworker } from '@/hooks/useCoworker';

// Quick actions for M&A context (matching reference design)
const QUICK_ACTIONS: QuickAction[] = [
  {
    id: 'create-deal',
    label: 'Create a deal',
    description: 'Start a new deal in your pipeline',
    icon: Table2,
    prompt:
      'Help me create a new deal. I want to add a company to my pipeline and set up the initial deal information.',
  },
  {
    id: 'analyze-deal',
    label: 'Crunch data',
    description: 'Get insights on a specific deal',
    icon: TrendingUp,
    prompt:
      'Analyze my current deals and provide insights. What are the key metrics and any deals that need attention?',
  },
  {
    id: 'make-prototype',
    label: 'Make a prototype',
    description: 'Generate an investment committee memo',
    icon: MousePointer2,
    prompt:
      'Help me draft an investment committee memo. What information do you need to get started?',
  },
  {
    id: 'organize-vdr',
    label: 'Organize files',
    description: 'Structure your data room',
    icon: FolderOpen,
    prompt:
      'Help me organize my virtual data room. What documents do I have and how should they be categorized?',
  },
  {
    id: 'prep-meeting',
    label: 'Prep for a meeting',
    description: 'Get a briefing before your next call',
    icon: Sun,
    prompt:
      'I have an upcoming meeting. Help me prepare a briefing with the key points I should know and questions to ask.',
  },
  {
    id: 'draft-message',
    label: 'Draft a message',
    description: 'Compose a professional message',
    icon: MessageSquare,
    prompt:
      'Help me draft a professional message. Who should I send it to and what should it be about?',
  },
];

export function CoworkerDashboard() {
  const {
    messages,
    isSending,
    isLoading,
    error,
    sendMessage,
    startNewConversation,
  } = useCoworker();

  const handleQuickAction = useCallback(
    (prompt: string) => {
      sendMessage(prompt);
    },
    [sendMessage]
  );

  const handleSend = useCallback(
    (message: string) => {
      sendMessage(message);
    },
    [sendMessage]
  );

  const hasMessages = messages.length > 0;

  return (
    <div className="min-h-[calc(100vh-4rem)] flex flex-col justify-center bg-white">
      {/* Logo */}
      <div className="flex-shrink-0 pb-6">
        <div className="flex justify-center">
          <div className="w-10 h-10 bg-orange rounded-lg flex items-center justify-center" role="img" aria-label="Trato Hive logo">
            <span className="text-white font-bold text-sm" aria-hidden="true">TH</span>
          </div>
        </div>
      </div>

      {/* Header */}
      <div className="flex-shrink-0 pb-8 px-8">
        <div className="max-w-4xl mx-auto">
          {/* Title */}
          <h1 className="text-4xl font-serif font-normal text-charcoal">
            Let&apos;s knock something off your list
          </h1>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-shrink-0 flex flex-col px-8 pb-8">
        <div className="max-w-4xl mx-auto w-full flex-1 flex flex-col">
          {/* Quick Actions Grid */}
          {!hasMessages && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-8">
              {QUICK_ACTIONS.map((action) => (
                <QuickActionCard
                  key={action.id}
                  action={action}
                  onClick={handleQuickAction}
                  disabled={isSending}
                />
              ))}
            </div>
          )}

          {/* Message List */}
          {hasMessages && (
            <div className="flex-1 bg-alabaster rounded-2xl border border-gold/10 mb-6 overflow-hidden">
              <MessageList messages={messages} isLoading={isSending} />
            </div>
          )}

          {/* Error Display */}
          {error && (
            <div className="mb-4 px-4 py-3 bg-red-50 border border-red-200 rounded-xl" role="alert" aria-live="polite">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

          {/* Chat Input */}
          <div className="flex-shrink-0">
            <ChatInput
              onSend={handleSend}
              isSending={isSending}
              disabled={isLoading}
              placeholder={
                hasMessages
                  ? 'Continue the conversation…'
                  : 'How can I help you today?…'
              }
            />

            {/* New Conversation Link */}
            {hasMessages && (
              <div className="mt-4 text-center">
                <button
                  onClick={() => startNewConversation()}
                  className="text-sm text-charcoal/40 hover:text-charcoal transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange focus-visible:ring-offset-2 rounded"
                >
                  Start a new conversation
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
