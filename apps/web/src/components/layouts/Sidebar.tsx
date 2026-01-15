"use client";

import Link from "next/link";
import { usePathname, useParams } from "next/navigation";
import {
  LayoutDashboard,
  Briefcase,
  Search,
  Plus,
  Loader2,
  PanelLeftClose,
  PanelLeft,
} from "lucide-react";
import { useState, useCallback } from "react";
import { api } from "@/trpc/react";
import { PageTreeNode, type PageTreeNodeData } from "../deals/PageTreeNode";
import { useSidebar } from "./SidebarContext";
import { PinnedSection, RecentSection } from "../sidebar";
import { useActivePageExpansion } from "@/hooks";
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

const navigation = [
  {
    name: "Command Center",
    href: "/",
    icon: LayoutDashboard,
  },
  {
    name: "Deals",
    href: "/deals",
    icon: Briefcase,
  },
  {
    name: "Discovery",
    href: "/discovery",
    icon: Search,
  },
];

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

export function Sidebar() {
  const pathname = usePathname();
  const params = useParams();
  const { collapsed, setCollapsed } = useSidebar();

  // Auto-expand sidebar items when navigating to child pages
  useActivePageExpansion();

  // Check if we're on a deal page
  const dealId = params?.id as string | undefined;
  const isOnDealPage = pathname.startsWith("/deals/") && dealId;

  const isActive = (href: string) => {
    if (href === "/") {
      return pathname === "/";
    }
    return pathname.startsWith(href);
  };

  if (collapsed) {
    return (
      <aside className="fixed left-0 top-0 z-40 h-screen w-12 bg-alabaster border-r border-gold/10 flex flex-col">
        {/* Expand button */}
        <button
          onClick={() => setCollapsed(false)}
          className="p-3 hover:bg-bone transition-colors"
          title="Expand sidebar"
        >
          <PanelLeft className="w-5 h-5 text-charcoal/60" />
        </button>

        {/* Collapsed nav icons */}
        <nav className="flex-1 py-2">
          {navigation.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href);
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`
                  flex items-center justify-center p-3
                  transition-colors duration-200
                  ${active ? "text-orange" : "text-charcoal/60 hover:text-charcoal hover:bg-bone"}
                `}
                title={item.name}
              >
                <Icon className="w-5 h-5" />
              </Link>
            );
          })}
        </nav>

        {/* User avatar */}
        <div className="p-3 border-t border-gold/10">
          <div className="w-6 h-6 bg-orange/20 rounded-full flex items-center justify-center mx-auto">
            <span className="text-orange text-xs font-medium">D</span>
          </div>
        </div>
      </aside>
    );
  }

  return (
    <aside className="fixed left-0 top-0 z-40 h-screen w-60 bg-alabaster border-r border-gold/10 flex flex-col">
      {/* Header with workspace name */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-gold/10">
        <Link href="/" className="flex items-center gap-2 hover:bg-bone rounded px-2 py-1.5 -ml-2 transition-colors">
          <div className="w-6 h-6 bg-orange rounded flex items-center justify-center">
            <span className="text-white font-bold text-xs">TH</span>
          </div>
          <span className="text-sm font-medium text-charcoal">Trato Hive</span>
        </Link>
        <button
          onClick={() => setCollapsed(true)}
          className="p-1.5 hover:bg-bone rounded transition-colors"
          title="Collapse sidebar"
        >
          <PanelLeftClose className="w-4 h-4 text-charcoal/50" />
        </button>
      </div>

      {/* Main Navigation */}
      <nav className="px-2 py-2 space-y-0.5">
        {navigation.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.href);

          return (
            <Link
              key={item.name}
              href={item.href}
              className={`
                flex items-center gap-2.5 px-2 py-1.5 rounded-md text-sm
                transition-colors duration-150
                ${
                  active
                    ? "bg-orange/10 text-charcoal font-medium"
                    : "text-charcoal/70 hover:bg-bone hover:text-charcoal"
                }
              `}
            >
              <Icon className={`w-4 h-4 flex-shrink-0 ${active ? "text-orange" : "text-charcoal/50"}`} />
              <span>{item.name}</span>
            </Link>
          );
        })}
      </nav>

      {/* Pinned Items Section */}
      <PinnedSection />

      {/* Recent Items Section */}
      <RecentSection />

      {/* Deal Pages Section - shows when viewing a deal */}
      {isOnDealPage && (
        <DealPagesSection dealId={dealId} />
      )}

      {/* Spacer */}
      <div className="flex-1" />

      {/* User section */}
      <div className="px-2 py-2 border-t border-gold/10">
        <div className="flex items-center gap-2.5 px-2 py-1.5 rounded-md hover:bg-bone transition-colors cursor-pointer">
          <div className="w-6 h-6 bg-orange/20 rounded-full flex items-center justify-center flex-shrink-0">
            <span className="text-orange text-xs font-medium">D</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm text-charcoal truncate">Demo User</p>
          </div>
        </div>
      </div>
    </aside>
  );
}

/**
 * Deal Pages Section - Shows page tree for current deal
 */
function DealPagesSection({ dealId }: { dealId: string }) {
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

  // Fetch deal info for title
  const { data: dealData } = api.deal.get.useQuery(
    { id: dealId },
    { enabled: !!dealId }
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

    const allIds = tree ? flattenTree(tree) : [];
    const oldIndex = allIds.indexOf(active.id as string);
    const newIndex = allIds.indexOf(over.id as string);

    if (oldIndex !== -1 && newIndex !== -1) {
      movePageMutation.mutate({
        id: active.id as string,
        order: newIndex,
        parentPageId: null,
      });
    }
  }, [tree, movePageMutation]);

  const allPageIds = tree ? flattenTree(tree) : [];
  const activeNode = activeId && tree ? findNode(tree, activeId) : null;

  return (
    <div className="border-t border-gold/10 mt-2">
      {/* Section Header */}
      <div className="flex items-center justify-between px-4 py-2">
        <span className="text-xs font-medium text-charcoal/40 uppercase tracking-wider">
          {dealData?.name || "Deal Pages"}
        </span>
        <button
          onClick={handleCreatePage}
          disabled={isCreating || createPageMutation.isPending}
          className="p-1 hover:bg-bone rounded transition-colors disabled:opacity-50"
          title="New page"
        >
          {isCreating || createPageMutation.isPending ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin text-charcoal/40" />
          ) : (
            <Plus className="w-3.5 h-3.5 text-charcoal/40 hover:text-charcoal" />
          )}
        </button>
      </div>

      {/* Page Tree */}
      <div className="px-2 pb-2 max-h-[calc(100vh-300px)] overflow-y-auto">
        {isLoading ? (
          <div className="flex items-center justify-center py-4">
            <Loader2 className="w-4 h-4 animate-spin text-orange" />
          </div>
        ) : !tree?.length ? (
          <div className="px-2 py-3 text-charcoal/40 text-xs">
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
                <div className="flex items-center gap-2 px-2 py-1 bg-white rounded shadow-lg border border-gold/20 text-sm">
                  <span>{activeNode.icon || "📄"}</span>
                  <span className="truncate">{activeNode.title || "Untitled"}</span>
                </div>
              )}
            </DragOverlay>
          </DndContext>
        )}
      </div>
    </div>
  );
}
