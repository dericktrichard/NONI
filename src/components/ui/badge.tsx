import { cn } from "@/lib/utils";

const variants = {
  default: "bg-muted text-foreground border-border",
  accent: "bg-accent text-accent-foreground border-transparent",
  outline: "bg-transparent text-foreground border-foreground",
} as const;

type BadgeProps = React.ComponentProps<"span"> & {
  variant?: keyof typeof variants;
};

export function Badge({ variant = "default", className, ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex h-6 items-center rounded-sm border px-2",
        "font-mono text-[0.6875rem] font-medium uppercase tracking-[0.08em]",
        variants[variant],
        className,
      )}
      {...props}
    />
  );
}