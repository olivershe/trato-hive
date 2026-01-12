"use client";

import { useState, useCallback } from "react";
import { Plus, Loader2, ChevronLeft } from "lucide-react";
import Link from "next/link";
import { api } from "@/trpc/react";
import { PageTreeNode, type PageTreeNodeData } from "./PageTreeNode";
import {
  DndContext,
  DragOverlay,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";

interface PageTreeSidebarProps {
  dealId: string;
}

/**
 * Flatten tree to get all page IDs for SortableContext
 */
function flattenTree(nodes: PageTreeNodeData[]): string[] {
  const ids: string[] = [];
  for (const node of nodes) {
    ids.push(node.id);
    if (node.children?.length) {
      ids.push(...flattenTree(node.children));
    }
  }
  return ids;
}

/**
 * Find a node by ID in the tree
 */
function findNode(nodes: PageTreeNodeData[], id: string): PageTreeNodeData | null {
  for (const node of nodes) {
    if (node.id === id) return node;
    if (node.children?.length) {
      const found = findNode(node.children, id);
      if (found) return found;
    }
  }
  return null;
}

export function PageTreeSidebar({ dealId }: PageTreeSidebarProps) {
  const [isCreating, setIsCreating] = useState(false);
  const [activeId, setActiveId] = useState<string | null>(null);

  // DnD sensors
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Fetch page tree
  const { data: tree, isLoading, refetch } = api.page.getTree.useQuery(
    { dealId },
    { enabled: !!dealId }
  );

  // Create page mutation
  const createPageMutation = api.page.create.useMutation({
    onSuccess: () => {
      refetch();
      setIsCreating(false);
    },
  });

  // Move page mutation
  const movePageMutation = api.page.move.useMutation({
    onSuccess: () => refetch(),
  });

  const handleCreatePage = async () => {
    setIsCreating(true);
    try {
      // Find root page to create under
      const rootPage = tree?.[0];
      await createPageMutation.mutateAsync({
        dealId,
        parentPageId: rootPage?.id,
        title: "New Page",
      });
    } catch (error) {
      console.error("Failed to create page:", error);
      setIsCreating(false);
    }
  };

  const handleDragStart = useCallback((event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  }, []);

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);

    if (!over || active.id === over.id) return;

    // Move page to new position (reorder within same parent)
    const allIds = tree ? flattenTree(tree) : [];
    const oldIndex = allIds.indexOf(active.id as string);
    const newIndex = allIds.indexOf(over.id as string);

    if (oldIndex !== -1 && newIndex !== -1) {
      movePageMutation.mutate({
        id: active.id as string,
        order: newIndex,
        // Pass null to keep in same parent (root level for now)
        parentPageId: null,
      });
    }
  }, [tree, movePageMutation]);

  const allPageIds = tree ? flattenTree(tree) : [];
  const activeNode = activeId && tree ? findNode(tree, activeId) : null;

  return (
    <aside className="w-64 bg-alabaster border-r border-gold/10 flex flex-col h-full">
      {/* Header */}
      <div className="p-3 border-b border-gold/10">
        <Link
          href="/deals"
          className="flex items-center gap-1 text-sm text-charcoal/60 hover:text-charcoal mb-2"
        >
          <ChevronLeft className="w-4 h-4" />
          Back to Deals
        </Link>

        <button
          onClick={handleCreatePage}
          disabled={isCreating || createPageMutation.isPending}
          className="
            w-full flex items-center justify-center gap-2
            px-3 py-1.5 text-sm
            bg-bone hover:bg-bone/80 text-charcoal/70
            rounded-md border border-gold/20
            transition-colors
            disabled:opacity-50 disabled:cursor-not-allowed
          "
        >
          {isCreating || createPageMutation.isPending ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Plus className="w-4 h-4" />
          )}
          New Page
        </button>
      </div>

      {/* Tree */}
      <div className="flex-1 overflow-y-auto p-2">
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-5 h-5 animate-spin text-orange" />
          </div>
        ) : !tree?.length ? (
          <div className="text-center py-8 text-charcoal/40 text-sm">
            No pages yet
          </div>
        ) : (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={allPageIds}
              strategy={verticalListSortingStrategy}
            >
              <div className="space-y-0.5">
                {tree.map((node) => (
                  <PageTreeNode
                    key={node.id}
                    node={node as PageTreeNodeData}
                    onRefetch={refetch}
                  />
                ))}
              </div>
            </SortableContext>

            <DragOverlay>
              {activeNode && (
                <div className="flex items-center gap-2 px-2 py-1.5 bg-white rounded-md shadow-lg border border-gold/20 text-sm">
                  <span>{activeNode.icon || "📄"}</span>
                  <span className="truncate">{activeNode.title || "Untitled"}</span>
                </div>
              )}
            </DragOverlay>
          </DndContext>
        )}
      </div>
    </aside>
  );
}
