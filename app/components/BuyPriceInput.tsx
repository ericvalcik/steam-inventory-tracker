"use client";

import { useTransition, useState } from "react";
import { updateBuyPrice } from "@/app/actions/updateBuyPrice";

interface Props {
  assetid: string;
  initialCents: number;
  manuallySet: boolean;
}

export default function BuyPriceInput({ assetid, initialCents, manuallySet }: Props) {
  const [value, setValue] = useState((initialCents / 100).toFixed(2));
  const [saved, setSaved] = useState(manuallySet);
  const [dirty, setDirty] = useState(false);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const cents = Math.round(parseFloat(value) * 100);
    if (isNaN(cents) || cents < 0) return;
    startTransition(async () => {
      await updateBuyPrice(assetid, cents);
      setSaved(true);
      setDirty(false);
    });
  }

  return (
    <form onSubmit={handleSubmit} className="flex items-center justify-end gap-1.5">
      {saved && (
        <span className="text-xs text-indigo-400 text-center leading-tight">manually<br />set</span>
      )}
      <div className="relative">
        <span className="absolute left-2 top-1/2 -translate-y-1/2 text-zinc-400 text-xs">$</span>
        <input
          type="number"
          step="0.01"
          min="0"
          value={value}
          onChange={(e) => { setValue(e.target.value); setDirty(true); }}
          className={`w-24 pl-5 pr-2 py-1 bg-zinc-100 dark:bg-zinc-800 rounded text-xs text-zinc-800 dark:text-zinc-200 focus:outline-none border ${
            dirty
              ? "border-yellow-400 dark:border-yellow-400"
              : saved
              ? "border-indigo-500 dark:border-indigo-500"
              : "border-zinc-200 dark:border-zinc-700 focus:border-indigo-500"
          }`}
        />
      </div>
      <button
        type="submit"
        disabled={isPending || (saved && !dirty)}
        className="text-xs w-12 py-1 rounded bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 disabled:cursor-default text-white transition-colors text-center"
      >
        {isPending ? "..." : saved && !dirty ? "Saved" : "Set"}
      </button>
    </form>
  );
}
