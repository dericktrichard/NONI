import type { CharacterPage } from "@/lib/data/summary";

/** Two different characters from the top 50, or null when that cannot be loaded */
export async function randomPair(): Promise<[string, string] | null> {
  try {
    const response = await fetch("/api/characters?limit=50");
    if (!response.ok) return null;

    const page = (await response.json()) as CharacterPage;
    const ids = page.items.map((item) => item.id);
    if (ids.length < 2) return null;

    const first = Math.floor(Math.random() * ids.length);
    let second = Math.floor(Math.random() * (ids.length - 1));
    if (second >= first) second += 1;

    return [ids[first]!, ids[second]!];
  } catch {
    return null;
  }
}