"use client";

import { useState, useRef, useEffect } from "react";

export default function ItemName({ name }: { name: string }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (!open) return;
    function handleClick(e: MouseEvent) {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  return (
    <span ref={ref} className="relative">
      <span
        className="text-zinc-700 dark:text-zinc-300 line-clamp-2 cursor-pointer"
        onClick={() => setOpen((v) => !v)}
      >
        {name}
      </span>
      {open && (
        <span className="absolute left-0 top-full mt-1 z-10 rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-xs text-zinc-200 shadow-lg w-48">
          {name}
        </span>
      )}
    </span>
  );
}
