"use client";

import { useState, useRef } from "react";
import Link from "next/link";
import { useParams, usePathname } from "next/navigation";
import {
  ChevronRight,
  ChevronDown,
  FileText,
  Database,
  GripVertical,
  MoreHorizontal,
  Plus,
  Pencil,
  Trash2,
  Copy,
} from "lucide-react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { api } from "@/trpc/react";

export interface PageTreeNodeData {
  id: string;
  title: string | null;
  icon: string | null;
  isDatabase: boolean;
  order: number;
  children: PageTreeNodeData[];
}

interface PageTreeNodeProps {
  node: PageTreeNodeData;
  level?: number;
  onRefetch?: () => void;
}

export function PageTreeNode({ node, level = 0, onRefetch }: PageTreeNodeProps) {
  const params = useParams();
  const pathname = usePathname();
  const dealId = params.id as string;

  const [expanded, setExpanded] = useState(level < 2);
  const [showContextMenu, setShowContextMenu] = useState(false);
  const [contextMenuPos, setContextMenuPos] = useState({ x: 0, y: 0 });
  const [isRenaming, setIsRenaming] = useState(false);
  const [renameValue, setRenameValue] = useState(node.title || "");
  const renameInputRef = useRef<HTMLInputElement>(null);

  const hasChildren = node.children && node.children.length > 0;

  // Sortable hook
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: node.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  // Mutations
  const updatePageMutation = api.page.update.useMutation({
    onSuccess: () => {
      onRefetch?.();
      setIsRenaming(false);
    },
  });

  const deletePageMutation = api.page.delete.useMutation({
    onSuccess: () => onRefetch?.(),
  });

  const createPageMutation = api.page.create.useMutation({
    onSuccess: () => {
      onRefetch?.();
      setExpanded(true);
    },
  });

  // Check if this page is currently active
  const isActive = pathname === `/deals/${dealId}/pages/${node.id}`;

  // Page URL
  const pageUrl = `/deals/${dealId}/pages/${node.id}`;

  // Context menu handlers
  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    setContextMenuPos({ x: e.clientX, y: e.clientY });
    setShowContextMenu(true);
  };

  const handleRename = () => {
    setShowContextMenu(false);
    setIsRenaming(true);
    setRenameValue(node.title || "");
    setTimeout(() => renameInputRef.current?.focus(), 0);
  };

  const handleRenameSubmit = () => {
    if (renameValue.trim() && renameValue !== node.title) {
      updatePageMutation.mutate({ id: node.id, title: renameValue.trim() });
    } else {
      setIsRenaming(false);
    }
  };

  const handleDelete = () => {
    setShowContextMenu(false);
    if (confirm(`Delete "${node.title || "Untitled"}"? This cannot be undone.`)) {
      deletePageMutation.mutate({ id: node.id });
    }
  };

  const handleAddSubpage = () => {
    setShowContextMenu(false);
    createPageMutation.mutate({
      dealId,
      parentPageId: node.id,
      title: "New Page",
    });
  };

  const handleDuplicate = () => {
    setShowContextMenu(false);
    // Duplicate creates a new page with same title + " (copy)"
    createPageMutation.mutate({
      dealId,
      parentPageId: node.id,
      title: `${node.title || "Untitled"} (copy)`,
    });
  };

  return (
    <div ref={setNodeRef} style={style}>
      <div
        className={`
          group flex items-center gap-1 px-2 py-1.5 rounded-md cursor-pointer
          transition-colors text-sm
          ${isActive
            ? "bg-orange/10 text-orange"
            : "text-charcoal/70 hover:bg-charcoal/5 hover:text-charcoal"
          }
        `}
        style={{ paddingLeft: `${8 + level * 12}px` }}
        onContextMenu={handleContextMenu}
      >
        {/* Drag Handle */}
        <button
          {...attributes}
          {...listeners}
          className="w-4 h-4 flex items-center justify-center flex-shrink-0 opacity-0 group-hover:opacity-50 hover:opacity-100 cursor-grab active:cursor-grabbing"
        >
          <GripVertical className="w-3 h-3" />
        </button>

        {/* Expand/Collapse Toggle */}
        <button
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            if (hasChildren) setExpanded(!expanded);
          }}
          className="w-4 h-4 flex items-center justify-center flex-shrink-0"
        >
          {hasChildren ? (
            expanded ? (
              <ChevronDown className="w-3.5 h-3.5" />
            ) : (
              <ChevronRight className="w-3.5 h-3.5" />
            )
          ) : (
            <span className="w-3.5" />
          )}
        </button>

        {/* Page Link or Rename Input */}
        {isRenaming ? (
          <input
            ref={renameInputRef}
            type="text"
            value={renameValue}
            onChange={(e) => setRenameValue(e.target.value)}
            onBlur={handleRenameSubmit}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleRenameSubmit();
              if (e.key === "Escape") setIsRenaming(false);
            }}
            className="flex-1 px-1 py-0 text-sm bg-white border border-orange rounded outline-none"
            onClick={(e) => e.stopPropagation()}
          />
        ) : (
          <Link
            href={pageUrl}
            className="flex items-center gap-2 flex-1 min-w-0"
          >
            {/* Icon */}
            <span className="flex-shrink-0">
              {node.icon ? (
                <span className="text-sm">{node.icon}</span>
              ) : node.isDatabase ? (
                <Database className="w-4 h-4" />
              ) : (
                <FileText className="w-4 h-4" />
              )}
            </span>

            {/* Title */}
            <span className="truncate">
              {node.title || "Untitled"}
            </span>
          </Link>
        )}

        {/* More Actions Button */}
        <button
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setContextMenuPos({ x: e.clientX, y: e.clientY });
            setShowContextMenu(!showContextMenu);
          }}
          className="w-5 h-5 flex items-center justify-center flex-shrink-0 opacity-0 group-hover:opacity-50 hover:opacity-100 rounded hover:bg-charcoal/10"
        >
          <MoreHorizontal className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Context Menu */}
      {showContextMenu && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setShowContextMenu(false)}
          />
          <div
            className="fixed z-50 bg-white rounded-lg shadow-lg border border-gold/20 py-1 min-w-[160px]"
            style={{ left: contextMenuPos.x, top: contextMenuPos.y }}
          >
            <button
              onClick={handleAddSubpage}
              className="w-full flex items-center gap-2 px-3 py-1.5 text-sm text-charcoal/70 hover:bg-charcoal/5 hover:text-charcoal"
            >
              <Plus className="w-4 h-4" />
              Add subpage
            </button>
            <button
              onClick={handleRename}
              className="w-full flex items-center gap-2 px-3 py-1.5 text-sm text-charcoal/70 hover:bg-charcoal/5 hover:text-charcoal"
            >
              <Pencil className="w-4 h-4" />
              Rename
            </button>
            <button
              onClick={handleDuplicate}
              className="w-full flex items-center gap-2 px-3 py-1.5 text-sm text-charcoal/70 hover:bg-charcoal/5 hover:text-charcoal"
            >
              <Copy className="w-4 h-4" />
              Duplicate
            </button>
            <div className="h-px bg-gold/10 my-1" />
            <button
              onClick={handleDelete}
              className="w-full flex items-center gap-2 px-3 py-1.5 text-sm text-red-500 hover:bg-red-50"
            >
              <Trash2 className="w-4 h-4" />
              Delete
            </button>
          </div>
        </>
      )}

      {/* Children */}
      {expanded && hasChildren && (
        <div>
          {node.children.map((child) => (
            <PageTreeNode
              key={child.id}
              node={child}
              level={level + 1}
              onRefetch={onRefetch}
            />
          ))}
        </div>
      )}
    </div>
  );
}
