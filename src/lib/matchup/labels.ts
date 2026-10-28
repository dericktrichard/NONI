import type { MatchupReason, MatchupResult } from "@/lib/ranking/matchup";

export interface SideNames {
  a: string;
  b: string;
}

export function percentA(probabilityA: number): number {
  if (!Number.isFinite(probabilityA)) return 50;
  return Math.round(Math.min(1, Math.max(0, probabilityA)) * 100);
}

export function verdictText(result: Pick<MatchupResult, "winner" | "verdict">, names: SideNames): string {
  if (result.verdict === "stalemate") return "Stalemate";
  if (result.verdict === "toss-up" || !result.winner) return "Too close to call";

  const winner = names[result.winner];
  switch (result.verdict) {
    case "decisive":
      return `${winner} wins decisively`;
    case "clear":
      return `${winner} wins clearly`;
    case "narrow":
      return `${winner} wins narrowly`;
    default:
      return "Too close to call";
  }
}

export function favorsText(favors: MatchupReason["favors"], names: SideNames): string {
  return favors === "even" ? "Even" : `Favors ${names[favors]}`;
}