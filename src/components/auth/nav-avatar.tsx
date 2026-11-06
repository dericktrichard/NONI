import { Portrait } from "@/components/characters/portrait";
import type { SessionUser } from "@/hooks/use-session";
import { cn } from "@/lib/utils";

type Props = {
  user: Pick<SessionUser, "handle" | "avatarUrl" | "avatarName">;
  className?: string;
};

export function NavAvatar({ user, className }: Props) {
  if (user.avatarUrl) {
    return (
      <Portrait
        name={user.avatarName ?? user.handle ?? "Your avatar"}
        src={user.avatarUrl}
        sizes="40px"
        className={cn("size-full", className)}
      />
    );
  }

  return (
    <span
      aria-hidden
      className={cn("grid size-full place-items-center font-display text-base font-semibold uppercase", className)}
    >
      {(user.handle ?? "?").slice(0, 1)}
    </span>
  );
}