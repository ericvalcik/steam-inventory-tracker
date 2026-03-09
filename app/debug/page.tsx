import { unstable_cache, revalidateTag } from "next/cache";
import { getInventoryRaw } from "@/lib/inventory";

const getCachedInventory = unstable_cache(
  async () => {
    const inventory = await getInventoryRaw();
    return inventory;
  },
  ["debug-inventory"],
  { tags: ["debug-inventory"] },
);

async function clearCache() {
  "use server";
  revalidateTag("debug-inventory", "page");
}

export default async function DebugPage() {
  const inventory = await getCachedInventory();

  return (
    <div className="min-h-screen bg-zinc-950 p-8 text-zinc-100">
      <div className="mx-auto max-w-4xl">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-xl font-semibold">Debug — Inventory</h1>
            <p className="text-sm text-zinc-500 mt-0.5">
              Raw inventory response · cached until cleared
            </p>
          </div>
          <form action={clearCache}>
            <button
              type="submit"
              className="px-3 py-1.5 text-sm rounded bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-zinc-200 transition-colors cursor-pointer"
            >
              Clear cache &amp; refetch
            </button>
          </form>
        </div>

        <pre className="bg-zinc-900 border border-zinc-800 rounded-lg p-4 text-xs text-zinc-300 overflow-auto max-h-[80vh] whitespace-pre-wrap break-words">
          {JSON.stringify(inventory, null, 2)}
        </pre>
      </div>
    </div>
  );
}
