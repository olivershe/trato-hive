/**
 * AgentTable - Table display for custom agents
 *
 * [TASK-128] Custom Agents Database + File Attachments
 */
"use client";

import { useState } from "react";
import {
  MoreHorizontal,
  Pencil,
  Trash2,
  Loader2,
  ToggleLeft,
  ToggleRight,
  Shield,
} from "lucide-react";
import { api } from "@/trpc/react";

interface Agent {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  icon: string | null;
  outputFormat: string;
  tags: string[];
  isActive: boolean;
  isSystem: boolean;
  callCount: number;
  lastCalledAt: Date | null;
  createdAt: Date;
  creator: {
    id: string;
    name: string | null;
    email: string;
  };
}

interface AgentTableProps {
  agents: Agent[];
  isLoading: boolean;
  onEdit: (id: string) => void;
  onDelete: () => void;
}

const OUTPUT_FORMAT_LABELS: Record<string, string> = {
  FREEFORM: "Free Text",
  TABLE: "Table",
  BULLETS: "Bullets",
  SUMMARY: "Summary",
  JSON: "JSON",
};

export function AgentTable({ agents, isLoading, onEdit, onDelete }: AgentTableProps) {
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

  const deleteMutation = api.agent.delete.useMutation({
    onSuccess: () => {
      setDeletingId(null);
      setOpenMenuId(null);
      onDelete();
    },
  });

  const toggleMutation = api.agent.update.useMutation();

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    await deleteMutation.mutateAsync({ id });
  };

  const handleToggleActive = async (agent: Agent) => {
    await toggleMutation.mutateAsync({
      id: agent.id,
      isActive: !agent.isActive,
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-orange" />
      </div>
    );
  }

  if (agents.length === 0) {
    return null;
  }

  return (
    <div className="bg-white dark:bg-deep-grey border border-bone dark:border-charcoal/30 rounded-lg overflow-hidden">
      <table className="w-full">
        <thead>
          <tr className="bg-alabaster dark:bg-surface-dark border-b border-bone dark:border-charcoal/30">
            <th className="px-4 py-3 text-left text-xs font-semibold text-charcoal/60 dark:text-cultured-white/60 uppercase tracking-wider">
              Agent
            </th>
            <th className="px-4 py-3 text-left text-xs font-semibold text-charcoal/60 dark:text-cultured-white/60 uppercase tracking-wider">
              Output
            </th>
            <th className="px-4 py-3 text-left text-xs font-semibold text-charcoal/60 dark:text-cultured-white/60 uppercase tracking-wider">
              Usage
            </th>
            <th className="px-4 py-3 text-left text-xs font-semibold text-charcoal/60 dark:text-cultured-white/60 uppercase tracking-wider">
              Status
            </th>
            <th className="px-4 py-3 w-12"></th>
          </tr>
        </thead>
        <tbody className="divide-y divide-bone dark:divide-charcoal/30">
          {agents.map((agent) => (
            <tr
              key={agent.id}
              className="hover:bg-alabaster/50 dark:hover:bg-charcoal/20 transition-colors"
            >
              {/* Agent Info */}
              <td className="px-4 py-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-orange/10 rounded-lg flex items-center justify-center flex-shrink-0">
                    <span className="text-xl">{agent.icon || "🤖"}</span>
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium text-charcoal dark:text-cultured-white">
                        {agent.name}
                      </p>
                      {agent.isSystem && (
                        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-400 text-xs rounded">
                          <Shield className="w-3 h-3" />
                          System
                        </span>
                      )}
                    </div>
                    {agent.description && (
                      <p className="text-xs text-charcoal/60 dark:text-cultured-white/60 truncate max-w-xs">
                        {agent.description}
                      </p>
                    )}
                    {agent.tags.length > 0 && (
                      <div className="flex gap-1 mt-1">
                        {agent.tags.slice(0, 3).map((tag) => (
                          <span
                            key={tag}
                            className="px-1.5 py-0.5 bg-bone dark:bg-charcoal/30 text-charcoal/70 dark:text-cultured-white/70 text-xs rounded"
                          >
                            {tag}
                          </span>
                        ))}
                        {agent.tags.length > 3 && (
                          <span className="text-xs text-charcoal/50 dark:text-cultured-white/50">
                            +{agent.tags.length - 3}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </td>

              {/* Output Format */}
              <td className="px-4 py-3">
                <span className="px-2 py-1 bg-gold/10 text-gold text-xs font-medium rounded">
                  {OUTPUT_FORMAT_LABELS[agent.outputFormat] || agent.outputFormat}
                </span>
              </td>

              {/* Usage */}
              <td className="px-4 py-3">
                <div>
                  <p className="text-sm text-charcoal dark:text-cultured-white">
                    {agent.callCount} calls
                  </p>
                  {agent.lastCalledAt && (
                    <p className="text-xs text-charcoal/50 dark:text-cultured-white/50">
                      Last: {new Date(agent.lastCalledAt).toLocaleDateString()}
                    </p>
                  )}
                </div>
              </td>

              {/* Status */}
              <td className="px-4 py-3">
                <button
                  onClick={() => handleToggleActive(agent)}
                  disabled={toggleMutation.isPending}
                  className="flex items-center gap-1.5 group"
                >
                  {agent.isActive ? (
                    <>
                      <ToggleRight className="w-5 h-5 text-emerald-500" />
                      <span className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">
                        Active
                      </span>
                    </>
                  ) : (
                    <>
                      <ToggleLeft className="w-5 h-5 text-charcoal/40 dark:text-cultured-white/40" />
                      <span className="text-xs text-charcoal/50 dark:text-cultured-white/50">
                        Inactive
                      </span>
                    </>
                  )}
                </button>
              </td>

              {/* Actions */}
              <td className="px-4 py-3">
                <div className="relative">
                  <button
                    onClick={() => setOpenMenuId(openMenuId === agent.id ? null : agent.id)}
                    className="p-1.5 hover:bg-bone dark:hover:bg-charcoal/30 rounded transition-colors"
                  >
                    <MoreHorizontal className="w-4 h-4 text-charcoal/60 dark:text-cultured-white/60" />
                  </button>

                  {openMenuId === agent.id && (
                    <>
                      {/* Backdrop */}
                      <div
                        className="fixed inset-0 z-10"
                        onClick={() => setOpenMenuId(null)}
                      />
                      {/* Menu */}
                      <div className="absolute right-0 top-full mt-1 z-20 bg-white dark:bg-deep-grey border border-bone dark:border-charcoal/30 rounded-lg shadow-lg py-1 min-w-[140px]">
                        <button
                          onClick={() => {
                            onEdit(agent.id);
                            setOpenMenuId(null);
                          }}
                          className="w-full flex items-center gap-2 px-3 py-2 text-sm text-charcoal dark:text-cultured-white hover:bg-alabaster dark:hover:bg-charcoal/30"
                        >
                          <Pencil className="w-4 h-4" />
                          Edit
                        </button>
                        {!agent.isSystem && (
                          <button
                            onClick={() => handleDelete(agent.id)}
                            disabled={deletingId === agent.id}
                            className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20"
                          >
                            {deletingId === agent.id ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <Trash2 className="w-4 h-4" />
                            )}
                            Delete
                          </button>
                        )}
                      </div>
                    </>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
