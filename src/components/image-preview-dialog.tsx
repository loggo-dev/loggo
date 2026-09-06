"use client";

import { XIcon } from "lucide-react";
import type { ReactElement } from "react";
import { Dialog, DialogClose, DialogContent, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

// Sized to the image (w-fit/h-fit + max-[90vw/90vh]) rather than a fixed
// viewport-filling box, so small images don't get stretched full-screen and
// large ones stay capped and centered either way.
export function ImagePreviewDialog({ src, alt, trigger }: { src: string; alt: string; trigger: ReactElement }) {
  return (
    <Dialog>
      <DialogTrigger render={trigger} />
      <DialogContent showCloseButton={false} className="w-fit h-fit max-w-[90vw] sm:max-w-[90vw] max-h-[90vh] border-none bg-transparent p-0 shadow-none flex items-center justify-center">
        <DialogTitle className="sr-only">{alt}</DialogTitle>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={src} alt={alt} className="block max-w-[90vw] max-h-[90vh] w-auto h-auto rounded-lg object-contain" />
        <DialogClose className="absolute top-3 right-3 z-10 flex size-8 items-center justify-center rounded-full bg-black/50 text-white backdrop-blur-sm transition-colors hover:bg-black/70" aria-label="Close">
          <XIcon className="size-4" />
        </DialogClose>
      </DialogContent>
    </Dialog>
  );
}
