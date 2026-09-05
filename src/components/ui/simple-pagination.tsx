import { Button } from "./button";
import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react";

export function SimplePagination({ page, hasMore, onPageChange }: { page: number; hasMore: boolean; onPageChange: (page: number) => void }) {
  if (page === 1 && !hasMore) return null;
  return (
    <div className="mt-8 flex items-center justify-between pt-6 pb-6">
      <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => onPageChange(page - 1)}>
        <ChevronLeftIcon data-icon="inline-start" /> Previous
      </Button>
      <span className="text-sm text-muted-foreground">Page {page}</span>
      <Button variant="outline" size="sm" disabled={!hasMore} onClick={() => onPageChange(page + 1)}>
        Next <ChevronRightIcon data-icon="inline-end" />
      </Button>
    </div>
  );
}
