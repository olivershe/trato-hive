"use client";

import { useState, useCallback } from "react";
import { useParams } from "next/navigation";
import { PageTreeSidebar } from "@/components/deals/PageTreeSidebar";
import { QuickSearch } from "@/components/deals/QuickSearch";
import { useKeyboardShortcuts } from "@/hooks/useKeyboardShortcuts";
import { api } from "@/trpc/react";

export default function DealLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const params = useParams();
  const dealId = params?.id as string;
  const [showQuickSearch, setShowQuickSearch] = useState(false);

  // Create page mutation for keyboard shortcut
  const utils = api.useUtils();
  const { data: tree } = api.page.getTree.useQuery(
    { dealId },
    { enabled: !!dealId }
  );

  const createPageMutation = api.page.create.useMutation({
    onSuccess: () => utils.page.getTree.invalidate({ dealId }),
  });

  // Keyboard shortcut handlers
  const handleNewPage = useCallback(() => {
    const rootPage = tree?.[0];
    createPageMutation.mutate({
      dealId,
      parentPageId: rootPage?.id,
      title: "New Page",
    });
  }, [dealId, tree, createPageMutation]);

  const handleQuickSearch = useCallback(() => {
    setShowQuickSearch(true);
  }, []);

  useKeyboardShortcuts({
    onNewPage: handleNewPage,
    onQuickSearch: handleQuickSearch,
  });

  return (
    <div className="flex h-full -m-6">
      <PageTreeSidebar dealId={dealId} />
      <main className="flex-1 overflow-auto p-6">
        {children}
      </main>

      {/* Quick Search Modal */}
      <QuickSearch
        dealId={dealId}
        isOpen={showQuickSearch}
        onClose={() => setShowQuickSearch(false)}
      />
    </div>
  );
}
