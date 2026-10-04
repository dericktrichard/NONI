/**
 * Try any two sample characters against each other.
 *
 *   npm run matchup -- goku saitama
 *   npm run matchup            (lists the available names)
 */
import { MOCK_SEEDS } from "@/config/mock-characters";
import { resolveMatchup } from "@/lib/ranking/matchup";
import { compileProfile } from "@/lib/ranking/profile";

const pct = (n: number) => `${(n * 100).toFixed(1)}%`;

function run(args: string[]): number {
  const [first, second] = args;
  const seedA = MOCK_SEEDS.find((s) => s.profile.slug === first);
  const seedB = MOCK_SEEDS.find((s) => s.profile.slug === second);

  if (!seedA || !seedB) {
    console.log("Usage: npm run matchup -- <slug> <slug>");
    console.log(`Available: ${MOCK_SEEDS.map((s) => s.profile.slug).join(", ")}`);
    return first || second ? 1 : 0;
  }

  const a = compileProfile(seedA.profile);
  const b = compileProfile(seedB.profile);
  const result = resolveMatchup(a, b);
  const winner = result.winner === null ? "no winner" : result.winner === "a" ? a.name : b.name;

  console.log(`\n${a.name}  vs  ${b.name}`);
  console.log(`Winner:  ${winner}  (${result.verdict})`);
  console.log(
    `Chance:  ${a.name} ${pct(result.probabilityA)}  /  ${b.name} ${pct(1 - result.probabilityA)}`,
  );
  console.log(`Initiative: ${a.name} ${pct(result.initiativeA)}`);
  console.log("\nWhy:");
  for (const reason of result.reasons) console.log(`  [${reason.favors}] ${reason.note}`);
  console.log();
  return 0;
}

process.exitCode = run(process.argv.slice(2));
