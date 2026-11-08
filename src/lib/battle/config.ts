/** Every tunable number of the battle games lives here. Change a value, run the tests. */
export const BATTLE = {
  /** Team sizes offered by the Team Battle screen */
  teamSizes: [3, 5],
  maxTeam: 5,

  /** How much wounds matter: the vitality ratio is raised to this power and multiplies the odds */
  vitalityWeight: 1.5,
  /** A winner loses (1 - lead) * woundScale of its vitality, kept between the two limits below */
  woundScale: 1.6,
  woundMin: 0.05,
  woundMax: 0.8,
  /** A winner is never worn down below this, only a defeat removes a fighter */
  minVitality: 0.1,

  /** Per-matchup win chance the counter team aims for at Fair. Winners stay on, so 0.44 here gives the opposing team about an even chance overall. */
  fairTarget: 0.44,
  /** The counter picker chooses at random among this many best candidates when it is given a random source */
  pickWidth: 3,
  /** Most characters one verse may place in a generated team */
  maxPerVerse: 2,
  /** A candidate "covers" an opponent when it wins at least this often against them */
  coverAt: 0.6,
} as const;

export const CLIMB = {
  /** Bracket sizes offered by the Tournament screen */
  sizes: [8, 16],
  /** Win probability the round opponents aim for against the user's character, first round to last */
  fair: { from: 0.3, to: 0.55 },
  hard: { from: 0.5, to: 0.85 },
  /** Fillers placed beside a counter must lose to it at least this often */
  fillerLoseAt: 0.55,
} as const;