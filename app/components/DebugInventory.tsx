"use client";

import { useCallback, useEffect, useState } from "react";
import type { InventoryResponse } from "@/lib/inventory";

export default function DebugInventory() {
  const [inventory, setInventory] = useState<InventoryResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/debug/inventory", { cache: "no-store" });
      const body = await res.json();
      if (!res.ok) throw new Error(body.error ?? `Request failed (${res.status})`);
      setInventory(body);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      setInventory(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div className="min-h-screen bg-zinc-950 p-8 text-zinc-100">
      <div className="mx-auto max-w-4xl">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-xl font-semibold">Debug — Inventory</h1>
            <p className="text-sm text-zinc-500 mt-0.5">
              Raw inventory response · fetched in the browser
            </p>
          </div>
          <button
            type="button"
            onClick={load}
            disabled={loading}
            className="px-3 py-1.5 text-sm rounded bg-zinc-800 hover:bg-zinc-700 disabled:opacity-40 disabled:cursor-default border border-zinc-700 text-zinc-200 transition-colors cursor-pointer"
          >
            {loading ? "Fetching…" : "Refetch"}
          </button>
        </div>

        {error ? (
          <div className="bg-red-950/40 border border-red-900 rounded-lg p-4 text-sm text-red-300">
            <p className="font-medium">Failed to load inventory</p>
            <p className="mt-1 text-red-400/90 break-words">{error}</p>
          </div>
        ) : (
          <pre className="bg-zinc-900 border border-zinc-800 rounded-lg p-4 text-xs text-zinc-300 overflow-auto max-h-[80vh] whitespace-pre-wrap break-words">
            {inventory ? JSON.stringify(inventory, null, 2) : "Loading…"}
          </pre>
        )}
      </div>
    </div>
  );
}
