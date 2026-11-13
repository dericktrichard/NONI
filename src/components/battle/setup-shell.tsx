interface SetupShellProps {
  top: React.ReactNode;
  picker: React.ReactNode;
  action: React.ReactNode;
}

/** Desktop: rules and picks beside the roster, no page scroll. Phone: the roster gets a screen-sized box that scrolls inside itself. */
export function SetupShell({ top, picker, action }: SetupShellProps) {
  return (
    <div className="flex flex-col gap-3 lg:grid lg:h-[calc(100dvh-var(--nav-height)-7.5rem)] lg:grid-cols-[24rem_minmax(0,1fr)] lg:grid-rows-[minmax(0,1fr)_auto] lg:gap-x-6">
      <div className="flex shrink-0 flex-col gap-2 lg:col-start-1 lg:row-start-1 lg:overflow-y-auto">
        {top}
      </div>
      <div className="flex h-[clamp(12rem,calc(100dvh-var(--nav-height)-26rem),32rem)] flex-col lg:col-start-2 lg:row-span-2 lg:row-start-1 lg:h-auto lg:min-h-0">
        {picker}
      </div>
      <div className="lg:col-start-1 lg:row-start-2">{action}</div>
    </div>
  );
}
