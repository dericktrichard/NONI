interface SectionLabelProps {
  title: string;
  aside?: string;
}

export function SectionLabel({ title, aside }: SectionLabelProps) {
  return (
    <div className="flex items-baseline justify-between gap-4 border-b pb-2">
      <h2 className="eyebrow">{title}</h2>
      {aside ? <span className="eyebrow tabular">{aside}</span> : null}
    </div>
  );
}
