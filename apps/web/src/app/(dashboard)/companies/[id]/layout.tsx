"use client";

import { useParams } from "next/navigation";
import { api } from "@/trpc/react";
import { useSidebarStore } from "@/stores/sidebar";
import { useEffect } from "react";
import { SidebarItemType } from "@trato-hive/shared";

export default function CompanyLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const params = useParams();
  const companyId = params?.id as string;
  const addRecent = useSidebarStore((state) => state.addRecent);

  // Fetch company info for tracking
  const { data: company } = api.company.get.useQuery(
    { id: companyId },
    { enabled: !!companyId }
  );

  // Track company visit in recent items
  useEffect(() => {
    if (company) {
      addRecent({
        id: company.id,
        type: SidebarItemType.COMPANY,
        title: company.name,
        icon: "Building2",
        href: `/companies/${company.id}`,
        metadata: {
          industry: company.industry || undefined,
        },
      });
    }
  }, [company, addRecent]);

  return <>{children}</>;
}
