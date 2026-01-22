/**
 * AgentEditorModal - Create/Edit custom agent modal
 *
 * [TASK-128] Custom Agents Database + File Attachments
 */
"use client";

import { useState, useEffect } from "react";
import { X, Loader2, Bot, HelpCircle } from "lucide-react";
import { api } from "@/trpc/react";
import { TEMPLATE_VARIABLES } from "@trato-hive/shared";

interface AgentEditorModalProps {
  isOpen: boolean;
  agentId?: string; // If provided, edit mode
  onClose: () => void;
  onSuccess: () => void;
}

const OUTPUT_FORMATS = [
  { value: "FREEFORM", label: "Free Text", description: "Unstructured response" },
  { value: "TABLE", label: "Table", description: "Markdown table format" },
  { value: "BULLETS", label: "Bullets", description: "Bullet point list" },
  { value: "SUMMARY", label: "Summary", description: "Executive summary" },
  { value: "JSON", label: "JSON", description: "Structured JSON output" },
];

const EMOJI_OPTIONS = ["🤖", "📊", "⚖️", "💻", "📋", "🔍", "💰", "📈", "🎯", "🔬", "📝", "🛡️"];

export function AgentEditorModal({
  isOpen,
  agentId,
  onClose,
  onSuccess,
}: AgentEditorModalProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [icon, setIcon] = useState("🤖");
  const [promptTemplate, setPromptTemplate] = useState("");
  const [outputFormat, setOutputFormat] = useState("FREEFORM");
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");
  const [showVariables, setShowVariables] = useState(false);

  const isEditMode = !!agentId;

  // Fetch existing agent for edit mode
  const { data: existingAgent, isLoading: isLoadingAgent } = api.agent.get.useQuery(
    { id: agentId! },
    { enabled: isEditMode && isOpen }
  );

  // Populate form when editing
  useEffect(() => {
    if (existingAgent) {
      setName(existingAgent.name);
      setDescription(existingAgent.description || "");
      setIcon(existingAgent.icon || "🤖");
      setPromptTemplate(existingAgent.promptTemplate);
      setOutputFormat(existingAgent.outputFormat);
      setTags(existingAgent.tags);
    }
  }, [existingAgent]);

  // Reset form when modal closes
  useEffect(() => {
    if (!isOpen) {
      setName("");
      setDescription("");
      setIcon("🤖");
      setPromptTemplate("");
      setOutputFormat("FREEFORM");
      setTags([]);
      setTagInput("");
    }
  }, [isOpen]);

  const createMutation = api.agent.create.useMutation({
    onSuccess: () => onSuccess(),
  });

  const updateMutation = api.agent.update.useMutation({
    onSuccess: () => onSuccess(),
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const data = {
      name,
      description: description || undefined,
      icon,
      promptTemplate,
      outputFormat: outputFormat as any,
      tags,
    };

    if (isEditMode) {
      await updateMutation.mutateAsync({ id: agentId!, ...data });
    } else {
      await createMutation.mutateAsync(data);
    }
  };

  const handleAddTag = () => {
    const tag = tagInput.trim().toLowerCase();
    if (tag && !tags.includes(tag) && tags.length < 10) {
      setTags([...tags, tag]);
      setTagInput("");
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter((t) => t !== tagToRemove));
  };

  const insertVariable = (variable: string) => {
    setPromptTemplate((prev) => prev + variable);
  };

  const isSubmitting = createMutation.isPending || updateMutation.isPending;
  const isValid = name.trim() && promptTemplate.trim().length >= 10;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 overscroll-contain">
      <div className="bg-white dark:bg-deep-grey rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overscroll-contain">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-bone dark:border-charcoal/30">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-orange/10 rounded-lg">
              <Bot className="w-5 h-5 text-orange" />
            </div>
            <h2 className="text-lg font-semibold text-charcoal dark:text-cultured-white">
              {isEditMode ? "Edit Agent" : "Create Agent"}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-bone dark:hover:bg-charcoal/30 rounded transition-colors"
          >
            <X className="w-5 h-5 text-charcoal/60 dark:text-cultured-white/60" />
          </button>
        </div>

        {/* Content */}
        {isLoadingAgent ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-6 h-6 animate-spin text-orange" />
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-5">
            {/* Name & Icon */}
            <div className="flex gap-4">
              <div className="flex-shrink-0">
                <label className="block text-xs font-medium text-charcoal/60 dark:text-cultured-white/60 mb-1.5">
                  Icon
                </label>
                <div className="grid grid-cols-6 gap-1 p-2 bg-alabaster dark:bg-surface-dark rounded-lg border border-bone dark:border-charcoal/30">
                  {EMOJI_OPTIONS.map((emoji) => (
                    <button
                      key={emoji}
                      type="button"
                      onClick={() => setIcon(emoji)}
                      className={`w-8 h-8 text-lg rounded flex items-center justify-center transition-colors ${
                        icon === emoji
                          ? "bg-orange/20 ring-2 ring-orange"
                          : "hover:bg-white dark:hover:bg-charcoal/30"
                      }`}
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex-1">
                <label className="block text-xs font-medium text-charcoal/60 dark:text-cultured-white/60 mb-1.5">
                  Name *
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Financial Analyst"
                  maxLength={100}
                  className="w-full px-3 py-2 bg-white dark:bg-charcoal/20 border border-bone dark:border-charcoal/30 rounded-lg text-sm text-charcoal dark:text-cultured-white placeholder:text-charcoal/40 dark:placeholder:text-cultured-white/40 focus:outline-none focus:ring-2 focus:ring-orange/30 focus:border-orange"
                />
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="block text-xs font-medium text-charcoal/60 dark:text-cultured-white/60 mb-1.5">
                Description
              </label>
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Reviews financial documents for key metrics and risks"
                maxLength={500}
                className="w-full px-3 py-2 bg-white dark:bg-charcoal/20 border border-bone dark:border-charcoal/30 rounded-lg text-sm text-charcoal dark:text-cultured-white placeholder:text-charcoal/40 dark:placeholder:text-cultured-white/40 focus:outline-none focus:ring-2 focus:ring-orange/30 focus:border-orange"
              />
            </div>

            {/* Prompt Template */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-medium text-charcoal/60 dark:text-cultured-white/60">
                  Prompt Template *
                </label>
                <button
                  type="button"
                  onClick={() => setShowVariables(!showVariables)}
                  className="flex items-center gap-1 text-xs text-orange hover:text-orange/80"
                >
                  <HelpCircle className="w-3 h-3" />
                  Template Variables
                </button>
              </div>

              {showVariables && (
                <div className="mb-2 p-3 bg-orange/5 border border-orange/20 rounded-lg">
                  <p className="text-xs text-charcoal/70 dark:text-cultured-white/70 mb-2">
                    Click to insert variables that will be replaced with context:
                  </p>
                  <div className="flex flex-wrap gap-1">
                    {TEMPLATE_VARIABLES.map((v) => (
                      <button
                        key={v.name}
                        type="button"
                        onClick={() => insertVariable(v.name)}
                        className="px-2 py-1 bg-white dark:bg-charcoal/30 border border-bone dark:border-charcoal/30 rounded text-xs font-mono text-orange hover:bg-orange/10 transition-colors"
                        title={v.description}
                      >
                        {v.name}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <textarea
                value={promptTemplate}
                onChange={(e) => setPromptTemplate(e.target.value)}
                placeholder={`You are an expert M&A financial analyst.

Analyze the attached financial documents and provide:
1. **Revenue Analysis** - trends, growth rates
2. **EBITDA Calculation** - with adjustments
3. **Red Flags** - any concerns

Deal: {{dealName}}
Company: {{companyName}}`}
                rows={8}
                maxLength={10000}
                className="w-full px-3 py-2 bg-white dark:bg-charcoal/20 border border-bone dark:border-charcoal/30 rounded-lg text-sm text-charcoal dark:text-cultured-white placeholder:text-charcoal/40 dark:placeholder:text-cultured-white/40 focus:outline-none focus:ring-2 focus:ring-orange/30 focus:border-orange resize-none font-mono"
              />
              <p className="text-xs text-charcoal/40 dark:text-cultured-white/40 mt-1">
                {promptTemplate.length}/10000 characters
              </p>
            </div>

            {/* Output Format */}
            <div>
              <label className="block text-xs font-medium text-charcoal/60 dark:text-cultured-white/60 mb-1.5">
                Output Format
              </label>
              <div className="grid grid-cols-5 gap-2">
                {OUTPUT_FORMATS.map((format) => (
                  <button
                    key={format.value}
                    type="button"
                    onClick={() => setOutputFormat(format.value)}
                    className={`px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                      outputFormat === format.value
                        ? "bg-orange text-white"
                        : "bg-alabaster dark:bg-surface-dark text-charcoal dark:text-cultured-white hover:bg-orange/10"
                    }`}
                    title={format.description}
                  >
                    {format.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Tags */}
            <div>
              <label className="block text-xs font-medium text-charcoal/60 dark:text-cultured-white/60 mb-1.5">
                Tags
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleAddTag();
                    }
                  }}
                  placeholder="Add tag..."
                  maxLength={50}
                  className="flex-1 px-3 py-2 bg-white dark:bg-charcoal/20 border border-bone dark:border-charcoal/30 rounded-lg text-sm text-charcoal dark:text-cultured-white placeholder:text-charcoal/40 dark:placeholder:text-cultured-white/40 focus:outline-none focus:ring-2 focus:ring-orange/30 focus:border-orange"
                />
                <button
                  type="button"
                  onClick={handleAddTag}
                  disabled={!tagInput.trim() || tags.length >= 10}
                  className="px-3 py-2 bg-alabaster dark:bg-surface-dark text-charcoal dark:text-cultured-white border border-bone dark:border-charcoal/30 rounded-lg text-sm font-medium hover:bg-bone dark:hover:bg-charcoal/30 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Add
                </button>
              </div>
              {tags.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-2">
                  {tags.map((tag) => (
                    <span
                      key={tag}
                      className="inline-flex items-center gap-1 px-2 py-1 bg-bone dark:bg-charcoal/30 text-charcoal dark:text-cultured-white text-xs rounded"
                    >
                      {tag}
                      <button
                        type="button"
                        onClick={() => handleRemoveTag(tag)}
                        className="text-charcoal/50 dark:text-cultured-white/50 hover:text-charcoal dark:hover:text-cultured-white"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>
          </form>
        )}

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-bone dark:border-charcoal/30">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="px-4 py-2 text-sm font-medium text-charcoal/70 dark:text-cultured-white/70 hover:text-charcoal dark:hover:text-cultured-white transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={isSubmitting || !isValid}
            className="flex items-center gap-2 px-4 py-2 bg-orange hover:bg-orange/90 disabled:bg-orange/40 disabled:cursor-not-allowed text-white rounded-lg text-sm font-medium transition-colors"
          >
            {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
            {isEditMode ? "Save Changes" : "Create Agent"}
          </button>
        </div>
      </div>
    </div>
  );
}
