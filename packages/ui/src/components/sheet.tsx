/**
 * Sheet Component
 *
 * A slide-in panel for forms and detail views.
 * Follows "The Intelligent Hive" design system.
 */
"use client";

import * as React from "react";
import { cn } from "../lib/utils";

// =============================================================================
// Sheet Context
// =============================================================================

interface SheetContextValue {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const SheetContext = React.createContext<SheetContextValue | null>(null);

function useSheetContext() {
  const context = React.useContext(SheetContext);
  if (!context) {
    throw new Error("Sheet components must be used within a Sheet");
  }
  return context;
}

// =============================================================================
// Sheet Root
// =============================================================================

interface SheetProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  children: React.ReactNode;
}

export function Sheet({ open = false, onOpenChange, children }: SheetProps) {
  const handleOpenChange = React.useCallback(
    (newOpen: boolean) => {
      onOpenChange?.(newOpen);
    },
    [onOpenChange]
  );

  return (
    <SheetContext.Provider value={{ open, onOpenChange: handleOpenChange }}>
      {children}
    </SheetContext.Provider>
  );
}

// =============================================================================
// Sheet Trigger
// =============================================================================

interface SheetTriggerProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  asChild?: boolean;
}

export function SheetTrigger({ children, asChild, ...props }: SheetTriggerProps) {
  const { onOpenChange } = useSheetContext();

  if (asChild && React.isValidElement(children)) {
    return React.cloneElement(children as React.ReactElement<{ onClick?: () => void }>, {
      onClick: () => onOpenChange(true),
    });
  }

  return (
    <button type="button" onClick={() => onOpenChange(true)} {...props}>
      {children}
    </button>
  );
}

// =============================================================================
// Sheet Content
// =============================================================================

type SheetSide = "top" | "right" | "bottom" | "left";

interface SheetContentProps extends React.HTMLAttributes<HTMLDivElement> {
  side?: SheetSide;
  onClose?: () => void;
}

const sideStyles: Record<SheetSide, string> = {
  top: "inset-x-0 top-0 border-b data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:slide-out-to-top data-[state=open]:slide-in-from-top",
  bottom: "inset-x-0 bottom-0 border-t data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:slide-out-to-bottom data-[state=open]:slide-in-from-bottom",
  left: "inset-y-0 left-0 h-full w-3/4 border-r sm:max-w-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:slide-out-to-left data-[state=open]:slide-in-from-left",
  right: "inset-y-0 right-0 h-full w-3/4 border-l sm:max-w-md data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:slide-out-to-right data-[state=open]:slide-in-from-right",
};

export function SheetContent({
  side = "right",
  className,
  children,
  onClose,
  ...props
}: SheetContentProps) {
  const { open, onOpenChange } = useSheetContext();
  const contentRef = React.useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = React.useState(false);
  const [isAnimating, setIsAnimating] = React.useState(false);

  // Handle open/close with animation
  React.useEffect(() => {
    if (open) {
      setIsVisible(true);
      // Small delay to ensure DOM is ready before animation starts
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setIsAnimating(true);
        });
      });
      return; // No cleanup needed when opening
    } else {
      setIsAnimating(false);
      // Wait for animation to complete before hiding
      const timer = setTimeout(() => {
        setIsVisible(false);
      }, 450);
      return () => clearTimeout(timer);
    }
  }, [open]);

  // Close on Escape key
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && open) {
        onOpenChange(false);
        onClose?.();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [open, onOpenChange, onClose]);

  // Prevent body scroll when open
  React.useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  if (!isVisible) return null;

  const getTransform = () => {
    if (isAnimating) return "translateX(0) scale(1)";
    switch (side) {
      case "right": return "translateX(120%) scale(0.85)";
      case "left": return "translateX(-120%) scale(0.85)";
      case "top": return "translateY(-120%) scale(0.85)";
      case "bottom": return "translateY(120%) scale(0.85)";
      default: return "translateX(120%) scale(0.85)";
    }
  };

  return (
    <div className="fixed inset-0 z-50">
      {/* Overlay - light touch to keep background visible */}
      <div
        className={cn(
          "fixed inset-0 bg-charcoal/10 transition-opacity duration-500 ease-out",
          isAnimating ? "opacity-100" : "opacity-0"
        )}
        onClick={() => {
          onOpenChange(false);
          onClose?.();
        }}
        aria-hidden="true"
      />
      {/* Content */}
      <div
        ref={contentRef}
        role="dialog"
        aria-modal="true"
        data-state={open ? "open" : "closed"}
        style={{
          transform: getTransform(),
          transition: "transform 450ms cubic-bezier(0.32, 0.72, 0, 1), opacity 400ms ease-out",
          opacity: isAnimating ? 1 : 0,
        }}
        className={cn(
          "fixed z-50 gap-4 bg-alabaster p-6 shadow-lg",
          "dark:bg-deep-grey dark:border-charcoal",
          sideStyles[side],
          className
        )}
        {...props}
      >
        {children}
      </div>
    </div>
  );
}

// =============================================================================
// Sheet Header
// =============================================================================

interface SheetHeaderProps extends React.HTMLAttributes<HTMLDivElement> {}

export function SheetHeader({ className, ...props }: SheetHeaderProps) {
  return (
    <div
      className={cn("flex flex-col space-y-2 text-left", className)}
      {...props}
    />
  );
}

// =============================================================================
// Sheet Title
// =============================================================================

interface SheetTitleProps extends React.HTMLAttributes<HTMLHeadingElement> {}

export function SheetTitle({ className, ...props }: SheetTitleProps) {
  return (
    <h2
      className={cn("text-lg font-semibold text-charcoal dark:text-cultured-white", className)}
      {...props}
    />
  );
}

// =============================================================================
// Sheet Description
// =============================================================================

interface SheetDescriptionProps extends React.HTMLAttributes<HTMLParagraphElement> {}

export function SheetDescription({ className, ...props }: SheetDescriptionProps) {
  return (
    <p
      className={cn("text-sm text-charcoal/70 dark:text-cultured-white/70", className)}
      {...props}
    />
  );
}

// =============================================================================
// Sheet Footer
// =============================================================================

interface SheetFooterProps extends React.HTMLAttributes<HTMLDivElement> {}

export function SheetFooter({ className, ...props }: SheetFooterProps) {
  return (
    <div
      className={cn(
        "flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2 pt-4 border-t border-bone dark:border-charcoal mt-auto",
        className
      )}
      {...props}
    />
  );
}

// =============================================================================
// Sheet Close Button
// =============================================================================

interface SheetCloseProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {}

export function SheetClose({ className, children, ...props }: SheetCloseProps) {
  const { onOpenChange } = useSheetContext();

  return (
    <button
      type="button"
      onClick={() => onOpenChange(false)}
      className={cn(
        "absolute right-4 top-4 rounded-sm opacity-70 ring-offset-white transition-opacity hover:opacity-100",
        "focus:outline-none focus:ring-2 focus:ring-gold focus:ring-offset-2",
        "disabled:pointer-events-none",
        className
      )}
      {...props}
    >
      {children || (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="h-4 w-4"
        >
          <path d="M18 6 6 18" />
          <path d="m6 6 12 12" />
        </svg>
      )}
      <span className="sr-only">Close</span>
    </button>
  );
}
