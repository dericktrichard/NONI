export interface NoticePanelProps {
  title: string;
  body: string;
}

/** The admin notice board on the home page. Same surface as the nav and the hero panel. */
export function NoticePanel({ title, body }: NoticePanelProps) {
  return (
    <aside
      aria-label="Notice"
      className="reveal acrylic pointer-events-auto relative mx-auto w-full max-w-2xl p-4 sm:p-5"
    >
      <div className="flex items-center justify-between gap-4">
        <p className="eyebrow flex items-center gap-2">
          <span className="bg-accent size-2" aria-hidden />
          Notice
        </p>
        <p className="eyebrow flex items-center gap-2">
          Admin
          <span className="bg-accent size-2" aria-hidden />
        </p>
      </div>
      <h2 className="font-display mt-2 text-xl font-semibold tracking-tight sm:text-2xl">
        {title}
      </h2>
      <p className="text-muted-foreground mt-2 text-sm whitespace-pre-line">{body}</p>
      <span aria-hidden className="absolute inset-x-0 bottom-0 h-1 bg-(--coral)" />
    </aside>
  );
}
