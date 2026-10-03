export const LIMITS = {
  /** Default page size in the app. The Firestore rules cap it at 100. */
  pageSize: 50,
  featTitle: 120,
  featDescription: 1000,
  proofsPerFeat: 5,
  proofLocator: 120,
  proofExcerpt: 300,
  argumentBody: 2000,
  citationsPerArgument: 5,
  displayName: 40,
  bio: 200,
  handleMin: 3,
  handleMax: 20,
  tags: 8,
  aliases: 8,
} as const;