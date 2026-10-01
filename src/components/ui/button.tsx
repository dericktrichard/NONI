import { cn } from "@/lib/utils";

const variants = {
  primary: "bg-accent text-accent-foreground border-transparent hover:brightness-95",
  solid: "bg-foreground text-background border-transparent hover:opacity-90",
  outline: "bg-transparent text-foreground border-foreground hover:bg-muted",
  ghost: "bg-transparent text-foreground border-transparent hover:bg-muted",
} as const;

const sizes = {
  sm: "h-9 px-3 text-sm",
  md: "h-11 px-4 text-sm",
  lg: "h-12 px-6 text-base",
  icon: "h-11 w-11",
} as const;

type ButtonStyleOptions = {
  variant?: keyof typeof variants;
  size?: keyof typeof sizes;
  className?: string;
};

/** Exported so a <Link> can borrow button styling */
export function buttonStyles({
  variant = "solid",
  size = "md",
  className,
}: ButtonStyleOptions = {}) {
  return cn(
    "inline-flex shrink-0 items-center justify-center gap-2 border font-medium",
    "rounded-sm transition-[transform,background-color,opacity] duration-150",
    "active:scale-[0.97] disabled:pointer-events-none disabled:opacity-40",
    variants[variant],
    sizes[size],
    className,
  );
}

type ButtonProps = React.ComponentProps<"button"> & Omit<ButtonStyleOptions, "className">;

export function Button({ variant, size, className, type = "button", ...props }: ButtonProps) {
  return <button type={type} className={buttonStyles({ variant, size, className })} {...props} />;
}