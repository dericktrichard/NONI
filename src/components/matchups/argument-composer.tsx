"use client";

import { Plus } from "lucide-react";
import { useState } from "react";
import { ArgumentForm } from "@/components/matchups/argument-form";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { useSession } from "@/hooks/use-session";
import { OPEN_SIGN_IN } from "@/lib/auth/events";
import type { CitableFeat } from "@/lib/data/matchup-page";

interface Side {
  slug: string;
  name: string;
}

interface ArgumentComposerProps {
  a: Side;
  b: Side;
  citable: CitableFeat[];
}

export function ArgumentComposer({ a, b, citable }: ArgumentComposerProps) {
  const { state } = useSession();
  const user = state.status === "ready" ? state.user : null;
  const [open, setOpen] = useState(false);
  const [slot, setSlot] = useState<HTMLElement | null>(null);

  function show() {
    if (!user) {
      window.dispatchEvent(new Event(OPEN_SIGN_IN));
      return;
    }
    setOpen(true);
  }

  return (
    <>
      <div className="mt-4">
        <Button variant="primary" size="sm" onClick={show}>
          <Plus className="size-4" aria-hidden />
          Make your case
        </Button>
      </div>

      <Modal
        wide
        slim
        open={open}
        onClose={() => setOpen(false)}
        title="Make your case"
        actions={<span ref={setSlot} className="contents" />}
      >
        <ArgumentForm
          a={a}
          b={b}
          citable={citable}
          slot={slot}
          onPosted={() => setOpen(false)}
        />
      </Modal>
    </>
  );
}
