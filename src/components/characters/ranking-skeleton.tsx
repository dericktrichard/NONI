/** Placeholder rows shown while a filter or search loads. Same shape as RankingRow, so nothing jumps. */
export function RankingSkeleton({ rows = 8 }: { rows?: number }) {
  return (
    <ul aria-hidden className="border-t">
      {Array.from({ length: rows }, (_, i) => (
        <li
          key={i}
          className="flex animate-pulse items-center gap-3 border-b px-2 py-3 sm:gap-5 sm:px-3"
        >
          <span className="bg-muted h-7 w-9 shrink-0 sm:w-12" />
          <span className="bg-muted h-18 w-14 shrink-0 sm:h-20 sm:w-16" />
          <div className="min-w-0 flex-1 space-y-2">
            <span className="bg-muted block h-4 w-2/5" />
            <span className="bg-muted block h-3 w-3/5" />
            <span className="bg-muted block h-2 w-24" />
          </div>
          <span className="bg-muted hidden h-8 w-40 shrink-0 md:block" />
          <span className="bg-muted h-9 w-14 shrink-0" />
        </li>
      ))}
    </ul>
  );
}
