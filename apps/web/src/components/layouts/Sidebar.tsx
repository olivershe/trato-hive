"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Briefcase,
  Search,
  FileText,
  Download,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { useState } from "react";

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

export function Sidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  const isActive = (href: string) => {
    if (href === "/") {
      return pathname === "/";
    }
    return pathname.startsWith(href);
  };

  return (
    <aside
      className={`
        fixed left-0 top-0 z-40 h-screen
        bg-alabaster border-r border-gold/20
        transition-all duration-300 ease-in-out
        ${collapsed ? "w-16" : "w-60"}
      `}
    >
      {/* Logo */}
      <div className="flex h-16 items-center justify-between px-4 border-b border-gold/20">
        {!collapsed && (
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-orange rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">TH</span>
            </div>
            <span className="font-semibold text-charcoal">Trato Hive</span>
          </Link>
        )}
        {collapsed && (
          <div className="w-8 h-8 bg-orange rounded-lg flex items-center justify-center mx-auto">
            <span className="text-white font-bold text-sm">TH</span>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-2 py-4 space-y-1">
        {navigation.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.href);

          return (
            <Link
              key={item.name}
              href={item.href}
              className={`
                flex items-center gap-3 px-3 py-2.5 rounded-lg
                transition-colors duration-200
                ${
                  active
                    ? "bg-orange/10 text-orange font-medium"
                    : "text-charcoal/70 hover:bg-bone hover:text-charcoal"
                }
                ${collapsed ? "justify-center" : ""}
              `}
              title={collapsed ? item.name : undefined}
            >
              <Icon className={`w-5 h-5 flex-shrink-0 ${active ? "text-orange" : ""}`} />
              {!collapsed && <span>{item.name}</span>}
            </Link>
          );
        })}
      </nav>

      {/* Collapse toggle */}
      <div className="absolute bottom-4 left-0 right-0 px-2">
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="
            w-full flex items-center justify-center gap-2 px-3 py-2
            text-charcoal/50 hover:text-charcoal hover:bg-bone
            rounded-lg transition-colors
          "
        >
          {collapsed ? (
            <ChevronRight className="w-5 h-5" />
          ) : (
            <>
              <ChevronLeft className="w-5 h-5" />
              <span className="text-sm">Collapse</span>
            </>
          )}
        </button>
      </div>

      {/* User section */}
      <div
        className={`
          absolute bottom-16 left-0 right-0 px-2 py-3
          border-t border-gold/20
        `}
      >
        <div
          className={`
            flex items-center gap-3 px-3 py-2
            ${collapsed ? "justify-center" : ""}
          `}
        >
          <div className="w-8 h-8 bg-orange/20 rounded-full flex items-center justify-center">
            <span className="text-orange text-sm font-medium">D</span>
          </div>
          {!collapsed && (
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-charcoal truncate">Demo User</p>
              <p className="text-xs text-charcoal/50 truncate">demo@tratohive.com</p>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}
