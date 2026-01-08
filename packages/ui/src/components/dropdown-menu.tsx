/**
 * DropdownMenu Component
 *
 * A simple dropdown menu for actions and selections.
 * Follows "The Intelligent Hive" design system.
 */
"use client";

import * as React from "react";
import { cn } from "../lib/utils";

// =============================================================================
// DropdownMenu Context
// =============================================================================

interface DropdownMenuContextValue {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  triggerRef: React.RefObject<HTMLButtonElement | null>;
}

const DropdownMenuContext = React.createContext<DropdownMenuContextValue | null>(null);

function useDropdownMenuContext() {
  const context = React.useContext(DropdownMenuContext);
  if (!context) {
    throw new Error("DropdownMenu components must be used within a DropdownMenu");
  }
  return context;
}

// =============================================================================
// DropdownMenu Root
// =============================================================================

interface DropdownMenuProps {
  children: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function DropdownMenu({ children, open: controlledOpen, onOpenChange }: DropdownMenuProps) {
  const [internalOpen, setInternalOpen] = React.useState(false);
  const triggerRef = React.useRef<HTMLButtonElement>(null);

  const open = controlledOpen ?? internalOpen;
  const handleOpenChange = React.useCallback(
    (newOpen: boolean) => {
      if (onOpenChange) {
        onOpenChange(newOpen);
      } else {
        setInternalOpen(newOpen);
      }
    },
    [onOpenChange]
  );

  return (
    <DropdownMenuContext.Provider value={{ open, onOpenChange: handleOpenChange, triggerRef }}>
      {children}
    </DropdownMenuContext.Provider>
  );
}

// =============================================================================
// DropdownMenu Trigger
// =============================================================================

interface DropdownMenuTriggerProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  asChild?: boolean;
}

export function DropdownMenuTrigger({ children, className, asChild, ...props }: DropdownMenuTriggerProps) {
  const { open, onOpenChange, triggerRef } = useDropdownMenuContext();

  const handleClick = () => {
    onOpenChange(!open);
  };

  if (asChild && React.isValidElement(children)) {
    return React.cloneElement(children as React.ReactElement<{ onClick?: () => void; ref?: React.Ref<HTMLButtonElement> }>, {
      onClick: handleClick,
      ref: triggerRef,
    });
  }

  return (
    <button
      ref={triggerRef}
      type="button"
      onClick={handleClick}
      aria-expanded={open}
      aria-haspopup="menu"
      className={cn("inline-flex items-center justify-center", className)}
      {...props}
    >
      {children}
    </button>
  );
}

// =============================================================================
// DropdownMenu Content
// =============================================================================

interface DropdownMenuContentProps extends React.HTMLAttributes<HTMLDivElement> {
  align?: "start" | "center" | "end";
  sideOffset?: number;
}

export function DropdownMenuContent({
  children,
  className,
  align = "end",
  sideOffset = 4,
  ...props
}: DropdownMenuContentProps) {
  const { open, onOpenChange, triggerRef } = useDropdownMenuContext();
  const contentRef = React.useRef<HTMLDivElement>(null);
  const [position, setPosition] = React.useState({ top: 0, left: 0 });

  // Position the dropdown relative to trigger
  React.useEffect(() => {
    if (open && triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      const contentRect = contentRef.current?.getBoundingClientRect();
      const contentWidth = contentRect?.width || 200;

      let left = rect.left;
      if (align === "end") {
        left = rect.right - contentWidth;
      } else if (align === "center") {
        left = rect.left + rect.width / 2 - contentWidth / 2;
      }

      setPosition({
        top: rect.bottom + sideOffset,
        left: Math.max(8, left),
      });
    }
  }, [open, align, sideOffset, triggerRef]);

  // Close on click outside
  React.useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        open &&
        contentRef.current &&
        !contentRef.current.contains(e.target as Node) &&
        triggerRef.current &&
        !triggerRef.current.contains(e.target as Node)
      ) {
        onOpenChange(false);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && open) {
        onOpenChange(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open, onOpenChange, triggerRef]);

  if (!open) return null;

  return (
    <div
      ref={contentRef}
      role="menu"
      aria-orientation="vertical"
      style={{
        position: "fixed",
        top: position.top,
        left: position.left,
      }}
      className={cn(
        "z-50 min-w-[8rem] overflow-hidden rounded-md border border-bone bg-white p-1 shadow-md",
        "dark:border-charcoal dark:bg-deep-grey",
        "animate-in fade-in-0 zoom-in-95",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

// =============================================================================
// DropdownMenu Item
// =============================================================================

interface DropdownMenuItemProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  inset?: boolean;
  destructive?: boolean;
}

export function DropdownMenuItem({
  children,
  className,
  inset,
  destructive,
  onClick,
  ...props
}: DropdownMenuItemProps) {
  const { onOpenChange } = useDropdownMenuContext();

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    onClick?.(e);
    onOpenChange(false);
  };

  return (
    <button
      type="button"
      role="menuitem"
      onClick={handleClick}
      className={cn(
        "relative flex w-full cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none transition-colors",
        "hover:bg-alabaster focus:bg-alabaster",
        "dark:hover:bg-charcoal dark:focus:bg-charcoal",
        destructive && "text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/50",
        inset && "pl-8",
        "disabled:pointer-events-none disabled:opacity-50",
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}

// =============================================================================
// DropdownMenu Separator
// =============================================================================

interface DropdownMenuSeparatorProps extends React.HTMLAttributes<HTMLDivElement> {}

export function DropdownMenuSeparator({ className, ...props }: DropdownMenuSeparatorProps) {
  return (
    <div
      role="separator"
      className={cn("-mx-1 my-1 h-px bg-bone dark:bg-charcoal", className)}
      {...props}
    />
  );
}

// =============================================================================
// DropdownMenu Label
// =============================================================================

interface DropdownMenuLabelProps extends React.HTMLAttributes<HTMLDivElement> {
  inset?: boolean;
}

export function DropdownMenuLabel({ children, className, inset, ...props }: DropdownMenuLabelProps) {
  return (
    <div
      className={cn(
        "px-2 py-1.5 text-sm font-semibold text-charcoal dark:text-cultured-white",
        inset && "pl-8",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}
