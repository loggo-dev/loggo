import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export type LogCardSkeletonVariant = "text" | "task" | "code" | "attachment";

export function LogCardSkeleton({ className, variant = "text", lines = 3, badge = false }: { className?: string; variant?: LogCardSkeletonVariant; lines?: number; badge?: boolean }) {
  return <Card className={`relative ${className ?? ""}`} aria-hidden="true">
    {badge ? <Skeleton className="absolute right-2 top-2 h-5 w-9 rounded-full" /> : null}
    <CardContent className="flex flex-col gap-2">
      {variant === "code" ? (
        <>
          <Skeleton className="h-3 w-1/4" />
          <Skeleton className="h-20 w-full rounded-lg" />
        </>
      ) : variant === "task" ? (
        Array.from({ length: lines }, (_, index) => (
          <div key={index} className="flex items-center gap-2">
            <Skeleton className="size-4 shrink-0 rounded-[4px]" />
            <Skeleton className={index % 2 === 0 ? "h-3 w-4/5" : "h-3 w-3/5"} />
          </div>
        ))
      ) : variant === "attachment" ? (
        <>
          <Skeleton className="h-20 w-full rounded-lg" />
          <div className="flex items-center gap-2">
            <Skeleton className="size-7 shrink-0 rounded-md" />
            <div className="flex flex-1 flex-col gap-1.5"><Skeleton className="h-3 w-2/3" /><Skeleton className="h-2.5 w-1/3" /></div>
          </div>
        </>
      ) : (
        Array.from({ length: lines }, (_, index) => <Skeleton key={index} className={index === lines - 1 ? "h-3 w-3/5" : "h-3 w-full"} />)
      )}
    </CardContent>
  </Card>;
}
