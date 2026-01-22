/**
 * AgentPicker - Modal for selecting a custom agent in the editor
 *
 * Triggered by the "/agent" slash command.
 * Lists available agents and inserts a CustomAgentBlock on selection.
 *
 * [TASK-128] Custom Agents Database + File Attachments
 */
"use client";

import { useState, useEffect, useCallback } from "react";
import { Bot, Search, Loader2, X } from "lucide-react";
import { api } from "@/trpc/react";
import { useEditorStore } from "@/stores/editor";

export function AgentPicker() {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const editor = useEditorStore((state) => state.editor);

  // Listen for the agent:picker event
  useEffect(() => {
    const handleOpen = () => setIsOpen(true);
    window.addEventListener("agent:picker", handleOpen);
    return () => window.removeEventListener("agent:picker", handleOpen);
  }, []);

  // Fetch agents
  const { data: agents, isLoading } = api.agent.search.useQuery(
    { query: searchQuery || "", limit: 10 },
    { enabled: isOpen }
  );

  const handleSelect = useCallback(
    (agent: { id: string; name: string; icon: string | null }) => {
      if (!editor) return;

      // Insert the CustomAgentBlock with the selected agent
      editor
        .chain()
        .focus()
        .setCustomAgentBlock({
          agentId: agent.id,
          agentName: agent.name,
          agentIcon: agent.icon,
          status: "idle",
          attachments: [],
          selectedDocumentIds: [],
          result: null,
          errorMessage: null,
          userPrompt: null,
        })
        .run();

      setIsOpen(false);
      setSearchQuery("");
    },
    [editor]
  );

  const handleClose = useCallback(() => {
    setIsOpen(false);
    setSearchQuery("");
  }, []);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-[20vh] bg-black/50 overscroll-contain">
      <div className="bg-white dark:bg-deep-grey rounded-xl shadow-2xl w-full max-w-md mx-4 overflow-hidden overscroll-contain">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-bone dark:border-charcoal/30">
          <div className="flex items-center gap-2">
            <Bot className="w-5 h-5 text-orange" />
            <h2 className="text-sm font-semibold text-charcoal dark:text-cultured-white">
              Select an Agent
            </h2>
          </div>
          <button
            onClick={handleClose}
            className="p-1 hover:bg-bone dark:hover:bg-charcoal/30 rounded transition-colors"
          >
            <X className="w-4 h-4 text-charcoal/60 dark:text-cultured-white/60" />
          </button>
        </div>

        {/* Search */}
        <div className="p-3 border-b border-bone dark:border-charcoal/30">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-charcoal/40 dark:text-cultured-white/40" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search agents..."
              autoFocus
              className="w-full pl-9 pr-3 py-2 bg-alabaster dark:bg-charcoal/20 border border-bone dark:border-charcoal/30 rounded-lg text-sm text-charcoal dark:text-cultured-white placeholder:text-charcoal/40 dark:placeholder:text-cultured-white/40 focus:outline-none focus:ring-2 focus:ring-orange/30 focus:border-orange"
            />
          </div>
        </div>

        {/* Agent List */}
        <div className="max-h-[300px] overflow-y-auto p-2">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-5 h-5 animate-spin text-orange" />
            </div>
          ) : !agents?.length ? (
            <div className="py-8 text-center">
              <Bot className="w-8 h-8 mx-auto mb-2 text-charcoal/20 dark:text-cultured-white/20" />
              <p className="text-sm text-charcoal/60 dark:text-cultured-white/60">
                {searchQuery ? "No agents found" : "No agents available"}
              </p>
              <p className="text-xs text-charcoal/40 dark:text-cultured-white/40 mt-1">
                {searchQuery ? "Try a different search" : "Create agents in the Agents page"}
              </p>
            </div>
          ) : (
            <div className="space-y-1">
              {agents.map((agent) => (
                <button
                  key={agent.id}
                  onClick={() =>
                    handleSelect({
                      id: agent.id,
                      name: agent.name,
                      icon: agent.icon,
                    })
                  }
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-alabaster dark:hover:bg-charcoal/30 transition-colors text-left"
                >
                  <div className="w-9 h-9 bg-orange/10 rounded-lg flex items-center justify-center flex-shrink-0">
                    <span className="text-lg">{agent.icon || "🤖"}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-charcoal dark:text-cultured-white truncate">
                      {agent.name}
                    </p>
                    {agent.description && (
                      <p className="text-xs text-charcoal/60 dark:text-cultured-white/60 truncate">
                        {agent.description}
                      </p>
                    )}
                  </div>
                  {agent.isSystem && (
                    <span className="px-1.5 py-0.5 bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-400 text-xs rounded">
                      System
                    </span>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-4 py-2 border-t border-bone dark:border-charcoal/30 bg-alabaster dark:bg-surface-dark">
          <p className="text-xs text-charcoal/50 dark:text-cultured-white/50 text-center">
            Press <kbd className="px-1.5 py-0.5 bg-white dark:bg-charcoal/30 rounded text-[10px] font-mono">Esc</kbd> to close
          </p>
        </div>
      </div>
    </div>
  );
}
