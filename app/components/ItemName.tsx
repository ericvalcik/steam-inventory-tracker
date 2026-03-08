"use client";

import { useState } from "react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

export default function ItemName({ name }: { name: string }) {
  const [open, setOpen] = useState(false);

  return (
    <Tooltip
      open={open}
      onOpenChange={(o) => { if (!o) setOpen(false); }}
    >
      <TooltipTrigger asChild>
        <span
          className="text-zinc-700 dark:text-zinc-300 line-clamp-2 cursor-default text-left"
          onClick={() => setOpen((v) => !v)}
        >
          {name}
        </span>
      </TooltipTrigger>
      <TooltipContent className="sm:hidden data-[state=instant-open]:animate-in data-[state=instant-open]:fade-in-0 data-[state=instant-open]:zoom-in-95">
        {name}
      </TooltipContent>
    </Tooltip>
  );
}
