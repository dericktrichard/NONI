interface SectionHeadingProps {
  index: string;
  title: string;
  aside?: string;
}

export function SectionHeading({ index, title, aside }: SectionHeadingProps) {
  return (
    <div>
      <div className="flex items-center gap-3">
        <span className="eyebrow">
          <b className="font-medium text-foreground">{index}</b>
        </span>
        <span className="h-px flex-1 bg-border" aria-hidden />
        {aside ? <span className="eyebrow">{aside}</span> : null}
      </div>
      <h2 className="mt-3 font-display text-3xl font-semibold tracking-tight sm:text-5xl">{title}</h2>
    </div>
  );
}