"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { format, parseISO } from "date-fns";
import { CalendarDaysIcon, ChevronLeftIcon, ChevronRightIcon, EllipsisIcon, LayoutGridIcon, ListChecksIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { api, type LogSummary } from "@/lib/api-client";
import { tidyCardLayout, type TidyCardPosition } from "@/lib/tidy-card-layout";
import { DayBoardSkeleton } from "@/components/app-loading-skeleton";
import { useWorkspace } from "@/components/workspace-provider";
import { CanvasProvider, CanvasViewport, useCanvas } from "@/components/canvas-provider";
import { MinusIcon, PlusIcon, PanelsTopLeftIcon, Columns3Icon } from "lucide-react";

function DayToolbar({ parsed, layout, setLayout, shift, goToday, handleTidy, isTidyPending, canTidy }: { parsed: Date, layout: "canvas" | "masonry", setLayout: (val: "canvas" | "masonry") => void, shift: (days: number) => void, goToday: () => void, handleTidy: () => void, isTidyPending: boolean, canTidy: boolean }) {
  const { zoom, setZoom, setPanX, setPanY } = useCanvas();
  return (
    <div className="pointer-events-none absolute inset-x-0 top-0 z-40 p-4 md:p-8 flex justify-end">
      <div className="group pointer-events-auto flex items-center rounded-lg border bg-background/90 p-1 shadow-sm backdrop-blur h-10 transition-all duration-300">
        <div className="px-3 text-sm font-medium whitespace-nowrap">
          {format(parsed, "MMM d, yyyy")}
        </div>
        
        {layout === "canvas" ? (
          <div className="flex items-center overflow-hidden max-w-0 opacity-0 group-hover:max-w-[200px] group-hover:opacity-100 transition-all duration-300 ease-in-out">
            <div className="h-4 w-px bg-border mx-1" />
            <Button variant="ghost" size="icon-sm" onClick={() => setZoom(Math.max(0.1, zoom - 0.1))} aria-label="Zoom out"><MinusIcon className="size-4" /></Button>
            <button type="button" className="w-12 text-center text-xs font-medium tabular-nums hover:text-foreground text-muted-foreground" onClick={() => { setPanX(0); setPanY(0); setZoom(1); }} aria-label="Reset zoom and pan">{Math.round(zoom * 100)}%</button>
            <Button variant="ghost" size="icon-sm" onClick={() => setZoom(Math.min(5, zoom + 0.1))} aria-label="Zoom in"><PlusIcon className="size-4" /></Button>
          </div>
        ) : null}

        <div className="h-4 w-px bg-border mx-1" />

        <DropdownMenu>
          <DropdownMenuTrigger render={<Button size="icon-sm" variant="ghost" aria-label="Board actions" />}><EllipsisIcon className="size-4" /></DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuGroup>
              <DropdownMenuItem onClick={() => shift(-1)}><ChevronLeftIcon />Previous day<DropdownMenuShortcut>⌘←</DropdownMenuShortcut></DropdownMenuItem>
              <DropdownMenuItem onClick={goToday}><CalendarDaysIcon />Today</DropdownMenuItem>
              <DropdownMenuItem onClick={() => shift(1)}><ChevronRightIcon />Next day<DropdownMenuShortcut>⌘→</DropdownMenuShortcut></DropdownMenuItem>
            </DropdownMenuGroup>
            {layout === "canvas" ? (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuGroup>
                  <DropdownMenuItem onClick={handleTidy} disabled={!canTidy || isTidyPending}><LayoutGridIcon />{isTidyPending ? "Tidying…" : "Tidy cards"}</DropdownMenuItem>
                </DropdownMenuGroup>
              </>
            ) : null}
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItem onClick={() => setLayout("canvas")} disabled={layout === "canvas"}>
                <PanelsTopLeftIcon /> Canvas Layout
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setLayout("masonry")} disabled={layout === "masonry"}>
                <Columns3Icon /> Masonry Layout
              </DropdownMenuItem>
            </DropdownMenuGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}
import { TasksCard } from "@/components/day-tasks-panel";
import { LogCard } from "@/components/log-card";
import { QuickCaptureBar } from "@/components/quick-capture-bar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuGroup, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuShortcut, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty";
import { useDayLayout } from "@/hooks/use-day-layout";

const CARD_WIDTH = 300;
const CARD_HEIGHT = 220;

function cascadePosition(index: number) {
  const col = index % 4;
  const row = Math.floor(index / 4);
  return { x: 24 + col * CARD_WIDTH, y: 24 + row * CARD_HEIGHT };
}

export function DayBoard({ date, autoNew = false }: { date: string; autoNew?: boolean }) {
  const { workspace } = useWorkspace();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [layout, setLayout] = useDayLayout();
  const [expanded, setExpanded] = useState(autoNew);
  const [showTasks, setShowTasksState] = useState(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("loggo:show-tasks");
      if (saved) return saved === "true";
    }
    return false;
  });
  const setShowTasks = (value: boolean | ((val: boolean) => boolean)) => {
    setShowTasksState((prev) => {
      const next = typeof value === "function" ? value(prev) : value;
      localStorage.setItem("loggo:show-tasks", String(next));
      return next;
    });
  };
  const [draftId, setDraftId] = useState<string | null>(null);
  const ensuringRef = useRef<Promise<string> | null>(null);
  const boardRef = useRef<HTMLDivElement>(null);
  const logs = useQuery({ queryKey: ["logs", workspace.id, date], queryFn: () => api.logs(workspace.id, { day: date }) });
  const tags = useQuery({ queryKey: ["tags", workspace.id], queryFn: () => api.tags(workspace.id) });
  const tasks = useQuery({ queryKey: ["tasks", workspace.id, date], queryFn: () => api.tasks(workspace.id, { day: date }) });
  const tasksByLog = Object.groupBy(tasks.data?.tasks ?? [], (task) => task.logId);

  const applyTemplates = useMutation({
    mutationFn: () => api.applyTemplates(workspace.id, date),
    onSuccess: (res) => { if (res.applied) void queryClient.invalidateQueries({ queryKey: ["logs", workspace.id, date] }); }
  });

  useEffect(() => {
    applyTemplates.mutate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [date, workspace.id]);

  const invalidateComposerQueries = () => { void queryClient.invalidateQueries({ queryKey: ["logs", workspace.id] }); void queryClient.invalidateQueries({ queryKey: ["tags", workspace.id] }); void queryClient.invalidateQueries({ queryKey: ["tasks", workspace.id] }); };
  const resetComposer = () => { setExpanded(false); setDraftId(null); ensuringRef.current = null; };
  const toggleTask = useMutation({ mutationFn: ({ id, done }: { id: string; done: boolean }) => api.toggleTask(workspace.id, id, done), onSuccess: () => { void queryClient.invalidateQueries({ queryKey: ["tasks", workspace.id] }); void queryClient.invalidateQueries({ queryKey: ["logs", workspace.id] }); }, onError: (error) => toast.error(error.message) });

  const placed = useMemo(() => {
    let fallbackIndex = 0;
    return (logs.data?.logs ?? []).map((log) => {
      const position = log.posX != null && log.posY != null ? { x: log.posX, y: log.posY } : cascadePosition(fallbackIndex++);
      return { log, position };
    });
  }, [logs.data]);


  const nextPosition = useCallback(() => {
    if (placed.length === 0) return { x: 24, y: 24 };
    const latest = placed[placed.length - 1];
    return { x: latest.position.x, y: latest.position.y + CARD_HEIGHT + 24 };
  }, [placed]);

  const create = useMutation({ mutationFn: (values: { title: string | null; body: string; posX?: number; posY?: number }) => api.createLog(workspace.id, { ...values, day: date }), onSuccess: () => { resetComposer(); invalidateComposerQueries(); toast.success("Log created"); }, onError: (error) => toast.error(error.message) });
  const update = useMutation({ mutationFn: (values: { title: string | null; body: string }) => api.updateLog(workspace.id, draftId!, values), onSuccess: () => { resetComposer(); invalidateComposerQueries(); toast.success("Log saved"); }, onError: (error) => toast.error(error.message) });
  const ensureDraftLog = useCallback(async (values: { title: string | null; body: string }) => {
    if (draftId) return draftId;
    if (!ensuringRef.current) {
      const position = nextPosition();
      ensuringRef.current = api.createLog(workspace.id, { ...values, day: date, ...position }).then((created) => {
        setDraftId(created.id);
        invalidateComposerQueries();
        toast.message("Log created so the file could attach");
        return created.id;
      });
    }
    return ensuringRef.current;
  // invalidateComposerQueries closes over queryClient/workspace.id, both stable for the composer's lifetime.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [draftId, workspace.id, date, nextPosition]);
  const composerPasteFile = useCallback(async (file: File, values: { title: string | null; body: string }) => {
    const logId = await ensureDraftLog(values);
    const uploaded = await api.uploadAttachment(workspace.id, logId, file);
    await api.updateLog(workspace.id, logId, values);
    return uploaded.relativeLink;
  }, [ensureDraftLog, workspace.id]);
  const moveLog = (id: string, x: number, y: number) => {
    queryClient.setQueryData<{ logs: LogSummary[] }>(["logs", workspace.id, date], (data) => data && { logs: data.logs.map((log) => (log.id === id ? { ...log, posX: x, posY: y } : log)) });
    void api.setLogPosition(workspace.id, id, x, y).catch(() => toast.error("Couldn't save the new position"));
  };
  const resizeLog = (id: string, width: number, height: number) => {
    queryClient.setQueryData<{ logs: LogSummary[] }>(["logs", workspace.id, date], (data) => data && { logs: data.logs.map((log) => (log.id === id ? { ...log, width, height } : log)) });
    void api.setLogSize(workspace.id, id, width, height).catch(() => toast.error("Couldn't save the new size"));
  };
  const restackLog = (id: string, direction: "front" | "back") => {
    const currentLogs = logs.data?.logs ?? [];
    if (direction === "front") {
      const zIndex = Math.max(0, ...currentLogs.map((log) => log.zIndex)) + 1;
      queryClient.setQueryData<{ logs: LogSummary[] }>(["logs", workspace.id, date], (data) => data && { logs: data.logs.map((log) => (log.id === id ? { ...log, zIndex } : log)) });
      void api.setLogZIndex(workspace.id, id, zIndex).catch(() => toast.error("Couldn't restack the card"));
      return;
    }
    // A negative z-index doesn't just render behind its sibling cards - it
    // slips the card into the CanvasViewport's own transform-created
    // stacking context at a level below zero, which stops it receiving
    // pointer events entirely. So "back" never goes negative: everyone else
    // steps up by one and the target drops to 0 instead.
    const updates = currentLogs.map((log) => ({ id: log.id, zIndex: log.id === id ? 0 : log.zIndex + 1 }));
    queryClient.setQueryData<{ logs: LogSummary[] }>(["logs", workspace.id, date], (data) => data && { logs: data.logs.map((log) => { const update = updates.find((candidate) => candidate.id === log.id); return update ? { ...log, zIndex: update.zIndex } : log; }) });
    void Promise.all(updates.map((update) => api.setLogZIndex(workspace.id, update.id, update.zIndex))).catch(() => toast.error("Couldn't restack the card"));
  };
  const duplicateLog = useMutation({ mutationFn: (id: string) => api.duplicateLog(workspace.id, id), onSuccess: () => { void queryClient.invalidateQueries({ queryKey: ["logs", workspace.id] }); toast.success("Log duplicated"); }, onError: (error) => toast.error(error.message) });
  const tidyCards = useMutation({
    mutationFn: (positions: TidyCardPosition[]) => Promise.all(positions.map((position) => api.setLogPosition(workspace.id, position.id, position.x, position.y))),
    onMutate: (positions) => {
      const previous = queryClient.getQueryData<{ logs: LogSummary[] }>(["logs", workspace.id, date]);
      const byId = new Map(positions.map((position) => [position.id, position]));
      queryClient.setQueryData<{ logs: LogSummary[] }>(["logs", workspace.id, date], (data) => data && { logs: data.logs.map((log) => {
        const position = byId.get(log.id);
        return position ? { ...log, posX: position.x, posY: position.y } : log;
      }) });
      return { previous };
    },
    onError: (_error, _positions, context) => {
      if (context?.previous) queryClient.setQueryData(["logs", workspace.id, date], context.previous);
      toast.error("Couldn't tidy the cards");
    },
    onSuccess: () => toast.success("Cards tidied"),
  });
  const handleTidy = () => {
    const board = boardRef.current;
    if (!board || !placed.length) return;
    const renderedSizes = new Map([...board.querySelectorAll<HTMLElement>("[data-log-id]")].map((element) => [element.dataset.logId!, { width: element.offsetWidth, height: element.offsetHeight }]));
    tidyCards.mutate(tidyCardLayout(placed.map(({ log }) => {
      const rendered = renderedSizes.get(log.id);
      return { id: log.id, width: rendered?.width ?? log.width ?? CARD_WIDTH, height: rendered?.height ?? log.height ?? CARD_HEIGHT };
    }), board.clientWidth));
  };
  useEffect(() => { const handler = (event: KeyboardEvent) => { if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "l") { event.preventDefault(); setExpanded(true); } }; window.addEventListener("keydown", handler); return () => window.removeEventListener("keydown", handler); }, []);
  const parsed = parseISO(date);
  const shift = (days: number) => { const next = new Date(`${date}T12:00:00`); next.setDate(next.getDate() + days); router.push(`/d/${format(next, "yyyy-MM-dd")}`); };
  const goToday = () => router.push(`/d/${format(new Date(), "yyyy-MM-dd")}`);
  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      if (!(event.metaKey || event.ctrlKey)) return;
      if (event.key === "ArrowLeft") { event.preventDefault(); shift(-1); }
      else if (event.key === "ArrowRight") { event.preventDefault(); shift(1); }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
    // `shift` is recreated each render off `date`, but it's a stable
    // navigation call keyed by day - re-binding per keystroke isn't needed.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [date]);

  const openTaskCount = tasks.data?.tasks.filter((task) => !task.done).length ?? 0;

  return <CanvasProvider id={date}>
    <div className="relative flex h-[calc(100svh-3rem)] flex-col md:h-svh bg-background">
      <DayToolbar 
        parsed={parsed} 
        layout={layout}
        setLayout={setLayout}
        shift={shift} 
        goToday={goToday} 
        handleTidy={handleTidy} 
        isTidyPending={tidyCards.isPending} 
        canTidy={placed.length > 0} 
      />

      <div className="relative min-h-0 flex-1 overflow-hidden bg-sidebar/30 flex items-center justify-center">
        {!logs.isLoading && placed.length === 0 ? (
          <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center">
            <Empty className="pointer-events-auto max-w-sm border bg-background/50 backdrop-blur-xs shadow-sm"><EmptyHeader><EmptyMedia variant="icon"><ListChecksIcon /></EmptyMedia><EmptyTitle>No Logs for this day</EmptyTitle><EmptyDescription>Drop the first thought, snippet, or task onto the board.</EmptyDescription></EmptyHeader></Empty>
          </div>
        ) : null}

        {layout === "masonry" ? (
          <div className="h-full w-full max-w-[92rem] mx-auto overflow-y-auto px-4 pt-20 md:px-8 md:pt-24 pb-32">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 p-1 auto-rows-min items-start">
              {showTasks ? <div key="tasks"><TasksCard date={date} floating={false} /></div> : null}
              {logs.isLoading ? <DayBoardSkeleton /> : (
                logs.data?.logs.slice().reverse().map((log) => {
                  let colSpan = "col-span-1";
                  if (log.width) {
                    if (log.width > 900) colSpan = "col-span-1 md:col-span-2 lg:col-span-3 xl:col-span-4";
                    else if (log.width > 600) colSpan = "col-span-1 md:col-span-2 lg:col-span-3";
                    else if (log.width > 350) colSpan = "col-span-1 md:col-span-2";
                  }
                  return (
                    <div key={log.id} className={colSpan}>
                      <LogCard log={log} tasks={tasksByLog[log.id]} onToggleTask={(id, done) => toggleTask.mutate({ id, done })} onDuplicate={() => duplicateLog.mutate(log.id)} resize={{ width: log.width, height: log.height, onResize: (w, h) => resizeLog(log.id, w, h) }} clickToEdit gridMode />
                    </div>
                  );
                })
              )}
            </div>
          </div>
        ) : (
          <CanvasViewport>
            <div ref={boardRef} className="relative h-[2000px] w-[2000px]">
              {logs.isLoading ? <DayBoardSkeleton /> : placed.map(({ log, position }) => <LogCard key={log.id} log={log} tasks={tasksByLog[log.id]} onToggleTask={(id, done) => toggleTask.mutate({ id, done })} onDuplicate={() => duplicateLog.mutate(log.id)} drag={{ x: position.x, y: position.y, zIndex: log.zIndex, width: log.width, height: log.height, onMove: (x, y) => moveLog(log.id, x, y), onResize: (w, h) => resizeLog(log.id, w, h), onBringToFront: () => restackLog(log.id, "front"), onSendToBack: () => restackLog(log.id, "back") }} />)}
              {showTasks ? <TasksCard key={date} date={date} /> : null}
            </div>
          </CanvasViewport>
        )}
      </div>

      <div className="pointer-events-none absolute inset-x-0 bottom-0 z-40">
        <div className="pointer-events-auto mx-auto flex w-full max-w-[92rem] items-end gap-2 px-5 pt-2 pb-3 md:px-8">
          <Button type="button" size="icon" variant={showTasks ? "default" : "outline"} className="relative shrink-0 mb-2 shadow-sm" onClick={() => setShowTasks((value) => !value)} aria-label="Toggle today's tasks">
            <ListChecksIcon />
            {!showTasks && openTaskCount > 0 ? <Badge variant="secondary" className="absolute -right-2 -top-2 size-5 justify-center p-0">{openTaskCount}</Badge> : null}
          </Button>
          <div className="min-w-0 flex-1 drop-shadow-sm">
            <QuickCaptureBar
              expanded={expanded}
              onExpandedChange={setExpanded}
              tags={tags.data?.tags.map((tag) => tag.name) ?? []}
              saving={draftId ? update.isPending : create.isPending}
              onQuickCreate={(body) => create.mutate({ title: null, body, ...nextPosition() })}
              onSave={(values) => (draftId ? update.mutate(values) : create.mutate({ ...values, ...nextPosition() }))}
              onCancel={resetComposer}
              onPasteFile={composerPasteFile}
            />
          </div>
        </div>
      </div>
    </div>
  </CanvasProvider>;
}
