/** A character joins lists, matchups and favourites only once it is no longer a draft */
export function isPublished(data: { draft?: unknown } | null | undefined): boolean {
  return data?.draft !== true;
}
