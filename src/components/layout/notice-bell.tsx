"use client";

import { Bell } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Modal } from "@/components/ui/modal";
import { useSession } from "@/hooks/use-session";
import { postJson } from "@/lib/battle/client";
import type { Notice } from "@/lib/data/notices";
import { ago } from "@/lib/notices/time";
import { cn } from "@/lib/utils";

const REFRESH_MS = 60_000;

interface Inbox {
  items: Notice[];
  unread: number;
}

/** Rank and badge notices. Checked after sign-in and after navigation, at most once a minute. */
export function NoticeBell() {
  const { state } = useSession();
  const signedIn = state.status === "ready" && state.user !== null;
  const pathname = usePathname();
  const [inbox, setInbox] = useState<Inbox>({ items: [], unread: 0 });
  const [open, setOpen] = useState(false);
  /** Notices that were unread when the inbox was opened, kept marked while it stays open */
  const [fresh, setFresh] = useState<ReadonlySet<string>>(new Set());
  const [now, setNow] = useState(0);
  const last = useRef(0);

  useEffect(() => {
    if (!signedIn || Date.now() - last.current < REFRESH_MS) return;
    last.current = Date.now();
    void postJson<Inbox>("/api/notices", {}).then((reply) => {
      if (reply.ok) setInbox(reply.data);
    });
  }, [signedIn, pathname]);

  function show() {
    setNow(Date.now());
    setFresh(new Set(inbox.items.filter((item) => !item.read).map((item) => item.id)));
    setOpen(true);
    void postJson<Inbox>("/api/notices", { markRead: true }).then((reply) => {
      if (!reply.ok) return;
      setFresh(
        new Set(reply.data.items.filter((item) => !item.read).map((item) => item.id)),
      );
      setInbox({ items: reply.data.items, unread: 0 });
    });
  }

  if (!signedIn) return null;

  return (
    <>
      <button
        type="button"
        onClick={show}
        aria-label={inbox.unread > 0 ? `Notices, ${inbox.unread} unread` : "Notices"}
        className="hover:border-foreground relative grid size-10 place-items-center border transition-colors"
      >
        <Bell className="size-4" aria-hidden />
        {inbox.unread > 0 ? (
          <span className="bg-accent absolute top-1.5 right-1.5 size-2" aria-hidden />
        ) : null}
      </button>

      <Modal open={open} onClose={() => setOpen(false)} title="Notices" eyebrow="Inbox">
        {inbox.items.length === 0 ? (
          <div className="border p-4">
            <p className="text-sm font-medium">Nothing yet.</p>
            <p className="text-muted-foreground mt-1 text-sm">
              With boards on, you will see it here when you take a No. 1 spot, or when
              someone passes you.
            </p>
          </div>
        ) : (
          <ul className="border">
            {inbox.items.map((item) => (
              <li key={item.id} className="border-b last:border-b-0">
                <Link
                  href={item.href}
                  onClick={() => setOpen(false)}
                  className="hover:bg-muted flex items-start gap-3 px-3 py-3 transition-colors"
                >
                  <span
                    className={cn(
                      "mt-1.5 size-2 shrink-0",
                      fresh.has(item.id) ? "bg-accent" : "border",
                    )}
                    aria-hidden
                  />
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-medium">{item.text}</span>
                    <span className="eyebrow block">{ago(item.at, now)}</span>
                  </span>
                  {fresh.has(item.id) ? <span className="sr-only">Unread</span> : null}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </Modal>
    </>
  );
}
