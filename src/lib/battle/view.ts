/** What the screens need to draw a character in a battle. No rank or stats, on purpose. */
export interface BattleCard {
  slug: string;
  name: string;
  verse: string;
  imageUrl: string | null;
}
