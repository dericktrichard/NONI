/** What the screens need to draw a character in a battle */
export interface BattleCard {
  slug: string;
  name: string;
  verse: string;
  imageUrl: string | null;
  rank: number | null;
}