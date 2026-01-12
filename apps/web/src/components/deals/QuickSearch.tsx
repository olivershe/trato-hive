/**
 * QuickSearch
 *
 * Cmd+K modal for quickly navigating to pages within a deal.
 */
"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Search, FileText, Database, X } from "lucide-react";
import { api } from "@/trpc/react";

interface QuickSearchProps {
  dealId: string;
  isOpen: boolean;
  onClose: () => void;
}

interface PageTreeNode {
  id: string;
  title: string | null;
  icon: string | null;
  isDatabase: boolean;
  children: PageTreeNode[];
}

/**
 * Flatten tree to searchable list
 */
function flattenTreeWithPaths(
  nodes: PageTreeNode[],
  parentPath: string[] = []
): Array<PageTreeNode & { path: string[] }> {
  const result: Array<PageTreeNode & { path: string[] }> = [];
  for (const node of nodes) {
    const currentPath = [...parentPath, node.title || "Untitled"];
    result.push({ ...node, path: currentPath });
    if (node.children?.length) {
      result.push(...flattenTreeWithPaths(node.children, currentPath));
    }
  }
  return result;
}

export function QuickSearch({ dealId, isOpen, onClose }: QuickSearchProps) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);

  // Fetch page tree
  const { data: tree } = api.page.getTree.useQuery(
    { dealId },
    { enabled: !!dealId && isOpen }
  );

  // Flatten and filter pages
  const allPages = tree ? flattenTreeWithPaths(tree) : [];
  const filteredPages = query.trim()
    ? allPages.filter(
        (p) =>
          p.title?.toLowerCase().includes(query.toLowerCase()) ||
          p.path.join(" / ").toLowerCase().includes(query.toLowerCase())
      )
    : allPages;

  // Focus input on open
  useEffect(() => {
    if (isOpen) {
      setQuery("");
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 0);
    }
  }, [isOpen]);

  // Reset selection when query changes
  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setSelectedIndex((prev) =>
          prev < filteredPages.length - 1 ? prev + 1 : prev
        );
        break;
      case "ArrowUp":
        e.preventDefault();
        setSelectedIndex((prev) => (prev > 0 ? prev - 1 : 0));
        break;
      case "Enter":
        e.preventDefault();
        if (filteredPages[selectedIndex]) {
          router.push(`/deals/${dealId}/pages/${filteredPages[selectedIndex].id}`);
          onClose();
        }
        break;
      case "Escape":
        e.preventDefault();
        onClose();
        break;
    }
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-charcoal/50 z-50"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed top-[20%] left-1/2 -translate-x-1/2 w-full max-w-lg z-50">
        <div className="bg-white rounded-xl shadow-2xl border border-gold/20 overflow-hidden">
          {/* Search Input */}
          <div className="flex items-center gap-3 px-4 py-3 border-b border-gold/10">
            <Search className="w-5 h-5 text-charcoal/40" />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Search pages..."
              className="flex-1 text-base outline-none placeholder:text-charcoal/40"
            />
            <button
              onClick={onClose}
              className="p-1 rounded hover:bg-charcoal/5 text-charcoal/40 hover:text-charcoal"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Results */}
          <div className="max-h-80 overflow-y-auto">
            {filteredPages.length === 0 ? (
              <div className="px-4 py-8 text-center text-charcoal/40 text-sm">
                {query ? "No pages found" : "No pages yet"}
              </div>
            ) : (
              <div className="py-2">
                {filteredPages.map((page, index) => (
                  <button
                    key={page.id}
                    onClick={() => {
                      router.push(`/deals/${dealId}/pages/${page.id}`);
                      onClose();
                    }}
                    onMouseEnter={() => setSelectedIndex(index)}
                    className={`
                      w-full flex items-center gap-3 px-4 py-2 text-left
                      ${index === selectedIndex ? "bg-orange/10" : "hover:bg-charcoal/5"}
                    `}
                  >
                    <span className="flex-shrink-0">
                      {page.icon ? (
                        <span className="text-lg">{page.icon}</span>
                      ) : page.isDatabase ? (
                        <Database className="w-5 h-5 text-charcoal/50" />
                      ) : (
                        <FileText className="w-5 h-5 text-charcoal/50" />
                      )}
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-charcoal truncate">
                        {page.title || "Untitled"}
                      </div>
                      {page.path.length > 1 && (
                        <div className="text-xs text-charcoal/50 truncate">
                          {page.path.slice(0, -1).join(" / ")}
                        </div>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-4 py-2 border-t border-gold/10 flex items-center gap-4 text-xs text-charcoal/40">
            <span>
              <kbd className="px-1.5 py-0.5 bg-charcoal/5 rounded text-[10px]">↑↓</kbd> Navigate
            </span>
            <span>
              <kbd className="px-1.5 py-0.5 bg-charcoal/5 rounded text-[10px]">Enter</kbd> Open
            </span>
            <span>
              <kbd className="px-1.5 py-0.5 bg-charcoal/5 rounded text-[10px]">Esc</kbd> Close
            </span>
          </div>
        </div>
      </div>
    </>
  );
}
