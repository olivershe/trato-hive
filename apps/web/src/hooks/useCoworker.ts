/**
 * useCoworker Hook
 *
 * Custom hook for interacting with the Hive Copilot via tRPC.
 * Handles sending messages, loading conversations, and managing state.
 */
import { useCallback, useEffect } from 'react';
import { api } from '@/trpc/react';
import { useCoworkerStore, type CoworkerMessage, type CoworkerContext } from '@/stores/coworker';

export function useCoworker() {
  const {
    conversationId,
    messages,
    context,
    isLoading,
    isSending,
    error,
    recentConversations,
    setConversationId,
    setMessages,
    addMessage,
    setContext,
    setLoading,
    setSending,
    setError,
    setRecentConversations,
    clearConversation,
  } = useCoworkerStore();

  const utils = api.useUtils();

  // Chat mutation
  const chatMutation = api.coworker.chat.useMutation({
    onMutate: () => {
      setSending(true);
      setError(null);
    },
    onSuccess: (data) => {
      // Update conversation ID if new
      if (data.conversationId && data.conversationId !== conversationId) {
        setConversationId(data.conversationId);
      }

      // Add assistant message
      const assistantMessage: CoworkerMessage = {
        id: `msg-${Date.now()}-assistant`,
        role: 'assistant',
        content: data.message,
        timestamp: new Date().toISOString(),
        executedActions: data.executedActions,
      };
      addMessage(assistantMessage);

      // Invalidate conversation list
      void utils.coworker.listConversations.invalidate();
    },
    onError: (err) => {
      setError(err.message);
    },
    onSettled: () => {
      setSending(false);
    },
  });

  // List conversations query
  const conversationsQuery = api.coworker.listConversations.useQuery(
    { limit: 10 }
  );

  // Update recent conversations when query data changes
  useEffect(() => {
    if (conversationsQuery.data) {
      setRecentConversations(
        conversationsQuery.data.conversations.map((c) => ({
          id: c.id,
          title: c.title ?? 'Untitled',
          updatedAt: c.updatedAt.toISOString(),
        }))
      );
    }
  }, [conversationsQuery.data, setRecentConversations]);

  // Get conversation query (only when conversationId is set)
  const conversationQuery = api.coworker.getConversation.useQuery(
    { conversationId: conversationId! },
    {
      enabled: !!conversationId,
    }
  );

  // Update messages when conversation data changes
  useEffect(() => {
    if (conversationQuery.data) {
      const loadedMessages: CoworkerMessage[] = conversationQuery.data.messages.map((m, i) => ({
        id: `msg-${i}`,
        role: m.role,
        content: m.content,
        timestamp: m.timestamp,
        executedActions: m.executedActions,
      }));
      setMessages(loadedMessages);
      if (conversationQuery.data.context) {
        setContext(conversationQuery.data.context);
      }
      setLoading(false);
    }
  }, [conversationQuery.data, setMessages, setContext, setLoading]);

  // Delete conversation mutation
  const deleteMutation = api.coworker.deleteConversation.useMutation({
    onSuccess: () => {
      clearConversation();
      void utils.coworker.listConversations.invalidate();
    },
  });

  // Send a message
  const sendMessage = useCallback(
    async (message: string, messageContext?: CoworkerContext) => {
      // Add user message to UI immediately
      const userMessage: CoworkerMessage = {
        id: `msg-${Date.now()}-user`,
        role: 'user',
        content: message,
        timestamp: new Date().toISOString(),
      };
      addMessage(userMessage);

      // Use provided context or current context
      const effectiveContext = messageContext || context;

      // Send to API
      await chatMutation.mutateAsync({
        message,
        conversationId: conversationId || undefined,
        context: effectiveContext || undefined,
      });
    },
    [conversationId, context, addMessage, chatMutation]
  );

  // Load a conversation by ID
  const loadConversation = useCallback(
    (id: string) => {
      setConversationId(id);
      setMessages([]);
      setLoading(true);
    },
    [setConversationId, setMessages, setLoading]
  );

  // Start a new conversation
  const startNewConversation = useCallback(
    (newContext?: CoworkerContext) => {
      clearConversation();
      if (newContext) {
        setContext(newContext);
      }
    },
    [clearConversation, setContext]
  );

  // Delete a conversation
  const deleteConversation = useCallback(
    (id: string) => {
      deleteMutation.mutate({ conversationId: id });
    },
    [deleteMutation]
  );

  return {
    // State
    conversationId,
    messages,
    context,
    isLoading: isLoading || conversationQuery.isLoading,
    isSending,
    error,
    recentConversations,

    // Actions
    sendMessage,
    loadConversation,
    startNewConversation,
    deleteConversation,
    setContext,
    clearConversation,

    // Query states
    isLoadingConversations: conversationsQuery.isLoading,
  };
}
