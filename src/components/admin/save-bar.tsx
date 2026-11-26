export function SaveBar({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-background sticky bottom-0 z-10 flex flex-wrap items-center gap-3 border-t py-3">
      {children}
    </div>
  );
}
