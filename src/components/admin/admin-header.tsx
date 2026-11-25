interface AdminHeaderProps {
  title: string;
  text?: string;
  actions?: React.ReactNode;
}

export function AdminHeader({ title, text, actions }: AdminHeaderProps) {
  return (
    <header className="mt-8 mb-6 flex flex-wrap items-end justify-between gap-x-6 gap-y-3">
      <div className="min-w-0">
        <p className="eyebrow">Admin</p>
        <h1 className="font-display mt-1 text-2xl font-semibold tracking-tight sm:text-3xl">
          {title}
        </h1>
        {text ? (
          <p className="text-muted-foreground mt-2 max-w-2xl text-sm">{text}</p>
        ) : null}
      </div>
      {actions ? <div className="flex flex-wrap gap-2">{actions}</div> : null}
    </header>
  );
}
