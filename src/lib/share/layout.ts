/** Shrinks a font size for long names so they stay on the card */
export function nameSize(name: string, base: number): number {
  const length = [...name].length;
  if (length > 28) return Math.round(base * 0.55);
  if (length > 20) return Math.round(base * 0.7);
  if (length > 14) return Math.round(base * 0.85);
  return base;
}