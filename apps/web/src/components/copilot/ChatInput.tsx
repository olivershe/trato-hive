/**
 * ChatInput Component
 *
 * The main chat input for the Hive Copilot.
 * Supports multi-line input, command hints, and attachment placeholders.
 */
'use client';

import { useState, useRef, useCallback, type KeyboardEvent } from 'react';
import { Send, Copy, Plus, Loader2, ChevronDown } from 'lucide-react';

interface ChatInputProps {
  onSend: (message: string) => void;
  disabled?: boolean;
  isSending?: boolean;
  placeholder?: string;
}

export function ChatInput({
  onSend,
  disabled = false,
  isSending = false,
  placeholder = 'How can I help you today?…',
}: ChatInputProps) {
  const [message, setMessage] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSubmit = useCallback(() => {
    const trimmed = message.trim();
    if (trimmed && !disabled && !isSending) {
      onSend(trimmed);
      setMessage('');
      // Reset textarea height
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }
    }
  }, [message, disabled, isSending, onSend]);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleSubmit();
      }
    },
    [handleSubmit]
  );

  const handleInput = useCallback(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      // Auto-resize textarea
      textarea.style.height = 'auto';
      textarea.style.height = `${Math.min(textarea.scrollHeight, 200)}px`;
    }
  }, []);

  const isDisabled = disabled || isSending;
  const canSend = message.trim().length > 0 && !isDisabled;

  return (
    <div className="bg-alabaster rounded-2xl border border-gold/10 shadow-sm overflow-hidden">
      {/* Input Area */}
      <div className="px-5 pt-5 pb-3">
        <textarea
          ref={textareaRef}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={handleKeyDown}
          onInput={handleInput}
          placeholder={placeholder}
          disabled={isDisabled}
          rows={1}
          className="w-full resize-none bg-transparent text-charcoal text-lg placeholder:text-charcoal/40 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
          aria-label="Chat message"
        />
      </div>

      {/* Toolbar */}
      <div className="flex items-center justify-between px-4 py-3">
        <div className="flex items-center gap-1">
          <button
            type="button"
            disabled={isDisabled}
            className="p-2 rounded-lg text-charcoal/40 hover:text-charcoal hover:bg-charcoal/5 transition-colors disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange focus-visible:ring-offset-2"
            aria-label="Attach file"
            title="Attach file (coming soon)"
          >
            <Copy className="w-5 h-5" aria-hidden="true" />
          </button>
          <button
            type="button"
            disabled={isDisabled}
            className="p-2 rounded-lg text-charcoal/40 hover:text-charcoal hover:bg-charcoal/5 transition-colors disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange focus-visible:ring-offset-2"
            aria-label="Add context"
            title="Add context (coming soon)"
          >
            <Plus className="w-5 h-5" aria-hidden="true" />
          </button>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-charcoal/60 hover:text-charcoal transition-colors rounded-lg hover:bg-charcoal/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange focus-visible:ring-offset-2"
          >
            <span>Claude</span>
            <ChevronDown className="w-4 h-4" aria-hidden="true" />
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={!canSend}
            className="p-2.5 rounded-full bg-orange text-white hover:bg-orange/90 transition-colors disabled:bg-charcoal/20 disabled:text-charcoal/40 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange focus-visible:ring-offset-2"
            aria-label="Send message"
          >
            {isSending ? (
              <Loader2 className="w-5 h-5 animate-spin motion-reduce:animate-none" aria-hidden="true" />
            ) : (
              <Send className="w-5 h-5" aria-hidden="true" />
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
