/**
 * Coworker Store
 *
 * Zustand store for managing Hive Copilot state including
 * active conversation, message history, and UI state.
 */
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface ExecutedAction {
  tool: string;
  input: Record<string, unknown>;
  result: {
    success: boolean;
    message: string;
    data?: unknown;
  };
}

export interface CoworkerMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  executedActions?: ExecutedAction[];
}

export interface CoworkerContext {
  dealId?: string;
  companyId?: string;
}

interface CoworkerState {
  // Active conversation
  conversationId: string | null;
  messages: CoworkerMessage[];
  context: CoworkerContext | null;

  // UI state
  isLoading: boolean;
  isSending: boolean;
  error: string | null;

  // Recent conversations for sidebar
  recentConversations: Array<{
    id: string;
    title: string;
    updatedAt: string;
  }>;

  // Actions
  setConversationId: (id: string | null) => void;
  setMessages: (messages: CoworkerMessage[]) => void;
  addMessage: (message: CoworkerMessage) => void;
  setContext: (context: CoworkerContext | null) => void;
  setLoading: (loading: boolean) => void;
  setSending: (sending: boolean) => void;
  setError: (error: string | null) => void;
  setRecentConversations: (conversations: Array<{ id: string; title: string; updatedAt: string }>) => void;
  clearConversation: () => void;
  reset: () => void;
}

const initialState = {
  conversationId: null,
  messages: [],
  context: null,
  isLoading: false,
  isSending: false,
  error: null,
  recentConversations: [],
};

export const useCoworkerStore = create<CoworkerState>()(
  persist(
    (set) => ({
      ...initialState,

      setConversationId: (id) => set({ conversationId: id }),

      setMessages: (messages) => set({ messages }),

      addMessage: (message) =>
        set((state) => ({
          messages: [...state.messages, message],
        })),

      setContext: (context) => set({ context }),

      setLoading: (loading) => set({ isLoading: loading }),

      setSending: (sending) => set({ isSending: sending }),

      setError: (error) => set({ error }),

      setRecentConversations: (conversations) =>
        set({ recentConversations: conversations }),

      clearConversation: () =>
        set({
          conversationId: null,
          messages: [],
          context: null,
          error: null,
        }),

      reset: () => set(initialState),
    }),
    {
      name: 'trato-coworker-storage',
      partialize: (state) => ({
        recentConversations: state.recentConversations,
      }),
    }
  )
);
