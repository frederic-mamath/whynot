import { useState, useRef, useEffect, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { cn } from "../../../lib/utils";
import type { LucideIcon } from "lucide-react";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

export interface HoverMenuItem {
  icon: LucideIcon;
  label: string;
  to: string;
  onClick?: () => void;
}

export interface HoverMenuProps {
  /** The trigger element rendered in the nav bar */
  trigger: ReactNode;
  /** Menu items displayed in the panel */
  items: HoverMenuItem[];
  /** Extra classes on the panel container */
  className?: string;
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export default function HoverMenu({
  trigger,
  items,
  className,
}: HoverMenuProps) {
  const [open, setOpen] = useState(false);
  /** Whether the panel is still in the DOM (kept mounted during exit animation) */
  const [mounted, setMounted] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  /** Small delay before closing so the cursor can travel to the panel */
  const scheduleClose = () => {
    timeoutRef.current = setTimeout(() => setOpen(false), 150);
  };

  const cancelClose = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  };

  const handleEnter = () => {
    cancelClose();
    setMounted(true);
    // Ensure mount happens before open triggers the enter animation
    requestAnimationFrame(() => setOpen(true));
  };

  const handleLeave = () => {
    scheduleClose();
  };

  /** When closing animation ends, unmount the panel */
  const handleAnimationEnd = () => {
    if (!open) {
      setMounted(false);
    }
  };

  /* Cleanup on unmount */
  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className="relative"
      onMouseEnter={handleEnter}
      onMouseLeave={handleLeave}
    >
      {/* Trigger */}
      <button
        type="button"
        className={cn(
          "inline-flex items-center gap-1 rounded-md px-3 py-2 text-sm font-medium",
          "text-foreground/80 transition-colors hover:text-foreground",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
          open && "text-foreground",
        )}
      >
        {trigger}
        <svg
          className={cn(
            "size-3.5 transition-transform duration-200",
            open && "rotate-180",
          )}
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="m6 9 6 6 6-6" />
        </svg>
      </button>

      {/* Panel */}
      {mounted && (
        <div
          className={cn("absolute left-0 top-full pt-2 z-50", className)}
          onTransitionEnd={handleAnimationEnd}
        >
          <div
            className={cn(
              "min-w-[200px] rounded-xl border border-border bg-popover p-1.5",
              "shadow-lg shadow-black/8 dark:shadow-black/25",
              "transition-all duration-150 ease-out",
              open
                ? "opacity-100 scale-100 translate-y-0"
                : "opacity-0 scale-95 -translate-y-1",
            )}
          >
            <ul className="flex flex-col gap-0.5">
              {items.map((item) => (
                <li key={item.to}>
                  <Link
                    to={item.to}
                    onClick={() => {
                      setOpen(false);
                      item.onClick?.();
                    }}
                    className={cn(
                      "flex items-center gap-3 rounded-lg px-3 py-2.5",
                      "text-sm text-popover-foreground/80",
                      "transition-colors hover:bg-accent hover:text-accent-foreground",
                    )}
                  >
                    <item.icon className="size-[18px] shrink-0" />
                    <span className="font-medium">{item.label}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}
