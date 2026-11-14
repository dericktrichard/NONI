/** Brings the nav bars back during a game on a small screen, and hides them again */
export function MenuToggle({ open, onToggle }: { open: boolean; onToggle: () => void }) {
  return (
    <button
      type="button"
      aria-pressed={open}
      onClick={onToggle}
      className="eyebrow hover:underline lg:hidden"
    >
      {open ? "Hide menu" : "Menu"}
    </button>
  );
}
