import { LogCardSkeleton } from "@/components/log-card-skeleton";
import { Skeleton } from "@/components/ui/skeleton";

const navRows = ["w-16", "w-12", "w-14", "w-10", "w-24"];
const calendarDays = Array.from({ length: 35 });

const boardCards = [
  { height: 168, variant: "text" as const, lines: 4, title: true, badge: false },
  { height: 190, variant: "task" as const, lines: 5, title: true, badge: true },
  { height: 194, variant: "attachment" as const, lines: 2, title: true, badge: false },
  { height: 164, variant: "code" as const, lines: 2, title: true, badge: false },
  { height: 156, variant: "text" as const, lines: 3, title: false, badge: false },
  { height: 176, variant: "task" as const, lines: 4, title: true, badge: true },
  { height: 150, variant: "text" as const, lines: 3, title: true, badge: false },
  { height: 150, variant: "code" as const, lines: 2, title: false, badge: false },
  { height: 150, variant: "task" as const, lines: 3, title: false, badge: true },
];

function BoardCardsSkeleton() {
  return <div className="grid grid-cols-[repeat(auto-fit,minmax(280px,1fr))] items-start gap-4 p-1">{boardCards.map((card, index) => (
    <div key={index} className={index === 0 ? "block" : "hidden md:block"} style={{ height: card.height }}>
      <LogCardSkeleton variant={card.variant} lines={card.lines} title={card.title} badge={card.badge} className="h-full" />
    </div>
  ))}</div>;
}

export function AppLoadingSkeleton({ showSecondarySidebar, sidebarOpen }: { showSecondarySidebar: boolean; sidebarOpen: boolean }) {
  return <div className="flex h-svh overflow-hidden bg-background" aria-label="Loading Loggo" aria-busy="true">
    <aside className={`${sidebarOpen ? "w-52" : "w-12"} hidden shrink-0 border-r bg-sidebar p-2 md:flex md:flex-col`}>
      <div className="flex items-center gap-2 p-1">
        <Skeleton className="size-8 shrink-0 rounded-lg" />
        {sidebarOpen ? <div className="flex min-w-0 flex-1 flex-col gap-1"><Skeleton className="h-3 w-24" /><Skeleton className="h-2.5 w-16" /></div> : null}
      </div>
      <div className="mt-6 flex flex-1 flex-col gap-1">
        {navRows.map((width, index) => <div key={index} className="flex h-8 items-center gap-3 rounded-md px-2"><Skeleton className="size-5 shrink-0" />{sidebarOpen ? <Skeleton className={`h-3 ${width}`} /> : null}</div>)}
      </div>
      <div className="flex items-center gap-2 p-1">
        <Skeleton className="size-8 shrink-0 rounded-lg" />
        {sidebarOpen ? <div className="flex min-w-0 flex-1 flex-col gap-1"><Skeleton className="h-3 w-20" /><Skeleton className="h-2.5 w-28" /></div> : null}
      </div>
    </aside>

    {showSecondarySidebar ? <aside className="hidden w-[18.875rem] shrink-0 border-r bg-sidebar md:block">
      <div className="flex flex-col gap-3 border-b p-4">
        <div className="flex flex-col gap-1"><Skeleton className="h-3.5 w-28" /><Skeleton className="h-3 w-20" /></div>
        <Skeleton className="h-9 w-full rounded-lg" />
      </div>
      <div className="px-5 py-4">
        <div className="mb-5 flex items-center justify-between"><Skeleton className="h-4 w-20" /><div className="flex gap-2"><Skeleton className="size-8" /><Skeleton className="size-8" /></div></div>
        <div className="grid grid-cols-7 gap-x-2 gap-y-3">
          {calendarDays.map((_, index) => <Skeleton key={index} className={`mx-auto size-6 rounded-full ${index < 3 || index > 31 ? "opacity-40" : ""}`} />)}
        </div>
      </div>
    </aside> : null}

    <main className="relative min-h-0 min-w-0 flex-1 overflow-hidden bg-sidebar/30">
      <div className="absolute inset-x-0 top-0 z-10 flex justify-end p-4 md:p-8">
        <div className="flex h-10 items-center rounded-lg border bg-background/90 p-1 shadow-sm">
          <div className="px-3"><Skeleton className="h-3.5 w-20" /></div>
          <div className="mx-1 h-4 w-px bg-border" />
          <Skeleton className="size-7 rounded-md" />
        </div>
      </div>
      <div className="absolute inset-x-6 top-[88px] bottom-20 overflow-hidden md:inset-x-8">
        <BoardCardsSkeleton />
      </div>
      <div className="absolute inset-x-5 bottom-3 flex items-end gap-2 md:inset-x-8">
        <Skeleton className="mb-2 size-8 shrink-0 rounded-lg" />
        <Skeleton className="h-12 min-w-0 flex-1 rounded-xl border" />
      </div>
    </main>
  </div>;
}

export function DayBoardSkeleton() {
  return <div className="relative h-[calc(100svh-3rem)] w-screen overflow-hidden md:h-svh md:w-[calc(100vw-var(--sidebar-width))]" aria-label="Loading Logs" aria-busy="true">
    <div className="absolute inset-x-6 top-[88px] bottom-20 overflow-hidden md:inset-x-8"><BoardCardsSkeleton /></div>
  </div>;
}
