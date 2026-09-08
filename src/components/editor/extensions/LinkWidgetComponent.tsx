import * as React from "react";
import { EditorView } from "@codemirror/view";
import { Popover, PopoverContent } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { PencilIcon, CopyIcon } from "lucide-react";
import { toast } from "sonner";

export function LinkWidgetComponent({ text, url, markerFrom, view }: { text: string; url: string; markerFrom: number; view: EditorView }) {
  const [open, setOpen] = React.useState(false);
  const timeoutRef = React.useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const displayUrl = url.length > 40 ? url.substring(0, 37) + "..." : url;

  const handleMouseEnter = () => {
    clearTimeout(timeoutRef.current);
    setOpen(true);
  };

  const handleMouseLeave = () => {
    timeoutRef.current = setTimeout(() => setOpen(false), 200);
  };

  React.useEffect(() => {
    return () => clearTimeout(timeoutRef.current);
  }, []);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <span 
        className="group/link-popover relative inline-block"
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        <a 
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-primary underline underline-offset-2 cursor-pointer font-medium"
          onClick={(e) => {
            e.stopPropagation();
          }}
          onPointerDown={(e) => e.stopPropagation()}
          onMouseDown={(e) => e.preventDefault()}
        >
          {text || url}
        </a>
      </span>
      <PopoverContent 
        className="w-auto p-1.5 flex items-center gap-1 shadow-lg"
        align="start"
        sideOffset={4}
        data-markdown-editor-popover=""
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        <a 
          href={url} 
          target="_blank" 
          rel="noopener noreferrer" 
          className="text-xs text-muted-foreground hover:text-foreground hover:bg-muted px-2 py-1.5 rounded-md transition-colors flex items-center gap-1.5 max-w-[300px] truncate"
        >
          {displayUrl}
        </a>
        <div className="w-px h-4 bg-border mx-1" />
        <Button 
          variant="ghost" 
          size="icon" 
          className="h-7 w-7 text-muted-foreground hover:text-foreground" 
          onClick={() => {
            void navigator.clipboard.writeText(url);
            toast.success("Link copied");
            setOpen(false);
          }}
          title="Copy link"
        >
          <CopyIcon className="size-3.5" />
        </Button>
        <Button 
          variant="ghost" 
          size="icon" 
          className="h-7 w-7 text-muted-foreground hover:text-foreground" 
          onClick={() => {
            setOpen(false);
            view.dispatch({ selection: { anchor: markerFrom + 1 } });
            view.focus();
          }}
          title="Edit link"
        >
          <PencilIcon className="size-3.5" />
        </Button>
      </PopoverContent>
    </Popover>
  );
}
