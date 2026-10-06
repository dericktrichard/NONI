/** Placeholder rows shown while a filter or search loads. Same shape as RankingRow, so nothing jumps. */
export function RankingSkeleton({ rows = 8 }: { rows?: number }) {
  return (
    <ul aria-hidden className="border-t">
      {Array.from({ length: rows }, (_, i) => (
        <li key={i} className="flex animate-pulse items-center gap-3 border-b px-2 py-3 sm:gap-4">
          <span className="h-7 w-9 shrink-0 bg-muted sm:w-12" />
          <span className="h-18 w-14 shrink-0 bg-muted sm:h-20 sm:w-16" />
          <div className="min-w-0 flex-1 space-y-2">
            <span className="block h-4 w-2/5 bg-muted" />
            <span className="block h-3 w-3/5 bg-muted" />
            <span className="block h-2 w-24 bg-muted" />
          </div>
          <span className="h-9 w-14 shrink-0 bg-muted" />
        </li>
      ))}
    </ul>
  );
}
