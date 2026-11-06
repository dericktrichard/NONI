"use client";

import { X } from "lucide-react";
import { useEffect, useId, useRef } from "react";
import { cn } from "@/lib/utils";

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  eyebrow?: string;
  wide?: boolean;
  children: React.ReactNode;
}

export function Modal({ open, onClose, title, eyebrow, wide, children }: ModalProps) {
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
      aria-labelledby={titleId}
      className={cn(
        "m-auto max-h-[calc(100svh-2rem)] w-[calc(100%-2rem)] overflow-y-auto border bg-background p-0 text-foreground backdrop:bg-black/60 backdrop:backdrop-blur-sm",
        wide ? "max-w-2xl" : "max-w-lg",
      )}
    >
      <div className="sticky top-0 z-10 flex items-start justify-between gap-4 border-b bg-background py-3 pl-5">
        <div className="min-w-0">
          {eyebrow ? <p className="eyebrow">{eyebrow}</p> : null}
          <h2 id={titleId} className="font-display text-xl font-semibold tracking-tight">
            {title}
          </h2>
        </div>
        <button
          type="button"
          onClick={() => ref.current?.close()}
          aria-label="Close"
          className="-my-3 grid size-14 shrink-0 place-items-center hover:bg-muted"
        >
          <X className="size-5" />
        </button>
      </div>
      <div className="p-5">{open ? children : null}</div>
    </dialog>
  );
}