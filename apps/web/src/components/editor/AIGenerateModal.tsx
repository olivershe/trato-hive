'use client';

import { useState, useEffect, useCallback } from 'react';
import { Sparkles, X, Globe } from 'lucide-react';
import { GENERATION_TEMPLATES } from '@trato-hive/ai-core';
import type { GenerationTemplate } from '@trato-hive/ai-core';

// =============================================================================
// Types
// =============================================================================

interface AIGenerateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onGenerate: (params: {
    prompt: string;
    template?: GenerationTemplate;
    enableWebSearch?: boolean;
  }) => void;
  dealId?: string;
}

// =============================================================================
// Component
// =============================================================================

export function AIGenerateModal({
  isOpen,
  onClose,
  onGenerate,
}: AIGenerateModalProps) {
  const [prompt, setPrompt] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState<
    GenerationTemplate | undefined
  >(undefined);
  const [enableWebSearch, setEnableWebSearch] = useState(false);

  // Close on escape
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Auto-focus prompt input when template changes
  useEffect(() => {
    if (selectedTemplate) {
      const template = GENERATION_TEMPLATES.find(
        (t) => t.id === selectedTemplate
      );
      if (template?.suggestedPrompt && !prompt) {
        setPrompt(template.suggestedPrompt);
      }
    }
  }, [selectedTemplate, prompt]);

  const handleGenerate = useCallback(() => {
    if (!prompt.trim()) return;
    onGenerate({
      prompt: prompt.trim(),
      template: selectedTemplate,
      enableWebSearch,
    });
    onClose();
    // Reset state
    setPrompt('');
    setSelectedTemplate(undefined);
    setEnableWebSearch(false);
  }, [prompt, selectedTemplate, enableWebSearch, onGenerate, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-xl mx-4 bg-white rounded-xl shadow-2xl border border-charcoal/10 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-charcoal/10">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-orange" />
            <h2 className="text-lg font-semibold text-charcoal">
              Generate with AI
            </h2>
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className="p-1 rounded-md hover:bg-charcoal/5 text-charcoal/40 hover:text-charcoal transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Template Picker */}
        <div className="px-6 pt-4">
          <p className="text-xs font-medium text-charcoal/50 uppercase tracking-wider mb-2">
            Template
          </p>
          <div className="flex flex-wrap gap-2">
            {GENERATION_TEMPLATES.map((template) => (
              <button
                key={template.id}
                onClick={() => setSelectedTemplate(template.id)}
                className={`px-3 py-1.5 text-sm rounded-lg border transition-colors ${
                  selectedTemplate === template.id
                    ? 'border-orange bg-orange/10 text-orange'
                    : 'border-charcoal/15 text-charcoal/70 hover:border-charcoal/30 hover:bg-charcoal/5'
                }`}
              >
                <span className="mr-1.5">{template.icon}</span>
                {template.name}
              </button>
            ))}
          </div>
        </div>

        {/* Prompt Input */}
        <div className="px-6 pt-4">
          <textarea
            autoFocus
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                handleGenerate();
              }
            }}
            placeholder="Describe what you want to generate..."
            className="w-full h-28 px-4 py-3 text-sm text-charcoal bg-charcoal/[0.03] border border-charcoal/15 rounded-lg resize-none focus:outline-none focus:border-orange/50 focus:ring-1 focus:ring-orange/20 placeholder:text-charcoal/30"
          />
        </div>

        {/* Options */}
        <div className="px-6 pt-3">
          <label className="flex items-center gap-2 cursor-pointer group">
            <input
              type="checkbox"
              checked={enableWebSearch}
              onChange={(e) => setEnableWebSearch(e.target.checked)}
              className="w-4 h-4 rounded border-charcoal/20 text-orange focus:ring-orange/20"
            />
            <Globe className="w-3.5 h-3.5 text-charcoal/40 group-hover:text-charcoal/60" />
            <span className="text-sm text-charcoal/60 group-hover:text-charcoal/80">
              Enable web search for additional context
            </span>
          </label>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 mt-2 border-t border-charcoal/10 bg-charcoal/[0.02]">
          <p className="text-xs text-charcoal/40">
            <kbd className="px-1.5 py-0.5 text-xs bg-charcoal/10 rounded">
              ⌘ Enter
            </kbd>{' '}
            to generate
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm text-charcoal/60 hover:text-charcoal transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleGenerate}
              disabled={!prompt.trim()}
              className="px-4 py-2 text-sm font-medium text-white bg-orange rounded-lg hover:bg-orange/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
            >
              <Sparkles className="w-4 h-4" />
              Generate
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
