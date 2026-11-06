interface SectionHeadingProps {
  index?: string;
  title: string;
  aside?: React.ReactNode;
}

export function SectionHeading({ title, aside }: SectionHeadingProps) {
  return (
    <div className="flex items-baseline justify-between gap-4 border-b border-foreground pb-3">
      <h2 className="font-display text-2xl font-semibold tracking-tight sm:text-3xl">{title}</h2>
      {aside ? <span className="eyebrow shrink-0">{aside}</span> : null}
    </div>
  );
}