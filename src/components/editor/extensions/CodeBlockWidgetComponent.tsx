import * as React from "react";
import { CopyIcon, Expand, CheckIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useState } from "react";

export function CodeBlockWidgetComponent({ language, code }: { language: string; code: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Dialog>
      {/* No separate header box - the label sits directly on the code
          block's own background. Copy/expand are real buttons (hover
          background, not bare icons), hidden until the pointer is over the
          code block - `cm-md-codeblock-controls` opacity is driven from
          theme.ts via the hover class codeBlockWidget.tsx toggles. */}
      <div className="flex items-center justify-between gap-2 px-2 select-none">
        <span className="text-[10px] font-mono leading-none text-muted-foreground/60">{language || "text"}</span>
        <div className="cm-md-codeblock-controls flex items-center gap-1">
          <Button variant="ghost" size="icon-xs" className="text-muted-foreground/70 hover:text-foreground" onClick={handleCopy} title="Copy code">
            {copied ? <CheckIcon className="size-3.5" /> : <CopyIcon className="size-3.5" />}
          </Button>
          <DialogTrigger render={<Button variant="ghost" size="icon-xs" className="text-muted-foreground/70 hover:text-foreground" title="Expand code" onClick={(e) => e.stopPropagation()} />}>
            <Expand className="size-3.5" />
          </DialogTrigger>
        </div>
      </div>
      {/* `sm:max-w-5xl` (not just `max-w-5xl`) is needed to win over the
          Dialog component's own `sm:max-w-sm` default at the same breakpoint.
          `gap-0` kills the component's default `gap-4`, which otherwise adds
          a blank row between the header and the code below it. */}
      <DialogContent className="max-w-5xl sm:max-w-5xl w-[90vw] h-[85vh] max-h-[85vh] flex flex-col gap-0 p-0 overflow-hidden">
        {/* Extra right padding keeps the Copy button clear of the dialog's
            own absolutely-positioned close (X) button in the same corner. */}
        <DialogHeader className="pl-4 pr-14 py-2 border-b flex-shrink-0">
          <DialogTitle className="flex justify-between items-center text-sm font-mono text-muted-foreground">
            {language || "text"}
            <Button variant="outline" size="sm" onClick={handleCopy} className="h-7 text-xs ml-4">
              {copied ? <CheckIcon className="h-3.5 w-3.5 mr-1" /> : <CopyIcon className="h-3.5 w-3.5 mr-1" />}
              {copied ? "Copied" : "Copy"}
            </Button>
          </DialogTitle>
        </DialogHeader>
        <ScrollArea className="flex-1 overflow-auto bg-muted/20">
          <pre className="p-4 text-sm font-mono text-foreground whitespace-pre-wrap break-words min-h-full">
            <code>{code}</code>
          </pre>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
