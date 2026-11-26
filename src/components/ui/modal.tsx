"use client";

import { useEffect, useId, useRef } from "react";
import { cn } from "@/lib/utils";

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  eyebrow?: string;
  wide?: boolean;
  /** Smaller width for short forms */
  narrow?: boolean;
  /** One line title in the small uppercase style */
  slim?: boolean;
  /** Buttons shown in the header, before Esc */
  actions?: React.ReactNode;
  children: React.ReactNode;
}

export function Modal({
  open,
  onClose,
  title,
  eyebrow,
  wide,
  narrow,
  slim,
  actions,
  children,
}: ModalProps) {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      onClose={onClose}
      onClick={(event) => {
        if (event.target === event.currentTarget) event.currentTarget.close();
      }}
      aria-labelledby={titleId}
      className={cn(
        "bg-background text-foreground m-auto max-h-[calc(100svh-2rem)] w-[calc(100%-2rem)] overflow-y-auto border p-0 backdrop:bg-black/60 backdrop:backdrop-blur-sm",
        wide ? "max-w-2xl" : narrow ? "max-w-sm" : "max-w-lg",
      )}
    >
      <div
        className={cn(
          "bg-background sticky top-0 z-10 flex justify-between gap-4 border-b py-3 pl-5",
          slim ? "items-center" : "items-start",
        )}
      >
        <div className="min-w-0">
          {eyebrow && !slim ? <p className="eyebrow">{eyebrow}</p> : null}
          <h2
            id={titleId}
            className={
              slim ? "eyebrow" : "font-display text-xl font-semibold tracking-tight"
            }
          >
            {title}
          </h2>
        </div>
        <div className="mr-5 flex shrink-0 items-center gap-2">
          {actions}
          <button
            type="button"
            onClick={() => ref.current?.close()}
            aria-label="Close (Esc)"
            className="eyebrow hover:bg-muted border px-2 py-1"
          >
            Esc
          </button>
        </div>
      </div>
      <div className="p-5">{open ? children : null}</div>
    </dialog>
  );
}
