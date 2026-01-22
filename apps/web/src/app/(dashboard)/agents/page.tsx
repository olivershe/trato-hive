/**
 * Agents Page - Custom AI Agents Management
 *
 * Lists and manages user-defined AI agents.
 * [TASK-128] Custom Agents Database + File Attachments
 */
"use client";

import { useState } from "react";
import { Bot, Plus, Search } from "lucide-react";
import { api } from "@/trpc/react";
import { AgentTable } from "@/components/agents/AgentTable";
import { AgentEditorModal } from "@/components/agents/AgentEditorModal";

export default function AgentsPage() {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingAgentId, setEditingAgentId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  // Fetch agents
  const { data, isLoading, refetch } = api.agent.list.useQuery({
    activeOnly: false,
    search: searchQuery || undefined,
    pageSize: 50,
  });

  const handleCreateSuccess = () => {
    setIsCreateModalOpen(false);
    refetch();
  };

  const handleEditSuccess = () => {
    setEditingAgentId(null);
    refetch();
  };

  const handleDeleteSuccess = () => {
    refetch();
  };

  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* Header */}
      <header className="flex items-center justify-between mb-6">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <div className="p-2 bg-orange/10 rounded-lg">
              <Bot className="w-6 h-6 text-orange" />
            </div>
            <h1 className="text-2xl font-bold text-charcoal dark:text-cultured-white">
              AI Agents
            </h1>
          </div>
          <p className="text-charcoal/60 dark:text-cultured-white/60">
            Create and manage custom AI specialists for your team
          </p>
        </div>
        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2 bg-orange hover:bg-orange/90 text-white rounded-lg font-medium transition-colors"
        >
          <Plus className="w-4 h-4" />
          Create Agent
        </button>
      </header>

      {/* Search */}
      <div className="mb-6">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-charcoal/40 dark:text-cultured-white/40" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search agents..."
            className="w-full pl-10 pr-4 py-2 bg-alabaster dark:bg-surface-dark border border-bone dark:border-charcoal/30 rounded-lg text-sm text-charcoal dark:text-cultured-white placeholder:text-charcoal/40 dark:placeholder:text-cultured-white/40 focus:outline-none focus:ring-2 focus:ring-orange/30 focus:border-orange"
          />
        </div>
      </div>

      {/* Agent Table */}
      <AgentTable
        agents={data?.items ?? []}
        isLoading={isLoading}
        onEdit={(id) => setEditingAgentId(id)}
        onDelete={handleDeleteSuccess}
      />

      {/* Empty State */}
      {!isLoading && (!data?.items || data.items.length === 0) && !searchQuery && (
        <div className="text-center py-16">
          <div className="w-16 h-16 mx-auto mb-4 bg-orange/10 rounded-2xl flex items-center justify-center">
            <Bot className="w-8 h-8 text-orange" />
          </div>
          <h3 className="text-lg font-semibold text-charcoal dark:text-cultured-white mb-2">
            No agents yet
          </h3>
          <p className="text-charcoal/60 dark:text-cultured-white/60 mb-6 max-w-md mx-auto">
            Create your first custom AI agent to automate document analysis,
            financial reviews, and other due diligence tasks.
          </p>
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-orange hover:bg-orange/90 text-white rounded-lg font-medium transition-colors"
          >
            <Plus className="w-4 h-4" />
            Create Your First Agent
          </button>
        </div>
      )}

      {/* Create Modal */}
      <AgentEditorModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSuccess={handleCreateSuccess}
      />

      {/* Edit Modal */}
      {editingAgentId && (
        <AgentEditorModal
          isOpen={true}
          agentId={editingAgentId}
          onClose={() => setEditingAgentId(null)}
          onSuccess={handleEditSuccess}
        />
      )}
    </div>
  );
}
