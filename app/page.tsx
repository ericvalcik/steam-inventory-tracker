export const dynamic = "force-dynamic";

interface Asset {
  assetid: string;
  classid: string;
  instanceid: string;
  amount: string;
}

interface Description {
  classid: string;
  instanceid: string;
  name: string;
  market_hash_name: string;
  icon_url: string;
  tradable: number;
  marketable: number;
  tags: { category: string; localized_tag_name: string }[];
}

interface InventoryResponse {
  assets: Asset[];
  descriptions: Description[];
  total_inventory_count: number;
}

interface InventoryItem extends Description {
  assetid: string;
  amount: number;
}

async function getInventory(): Promise<InventoryItem[]> {
  const steamid = process.env.STEAM_ID;

  const res = await fetch(
    `https://steamcommunity.com/inventory/${steamid}/730/2?l=english&count=5000`,
    { next: { revalidate: 300 } }
  );

  const data: InventoryResponse = await res.json();
  const { assets, descriptions } = data ?? {};
  if (!assets || !descriptions) return [];

  const descMap = new Map<string, Description>();
  for (const desc of descriptions) {
    descMap.set(`${desc.classid}_${desc.instanceid}`, desc);
  }

  return assets.map((asset) => {
    const desc = descMap.get(`${asset.classid}_${asset.instanceid}`)!;
    return { ...desc, assetid: asset.assetid, amount: Number(asset.amount) };
  });
}

function getIconUrl(iconUrl: string) {
  return `https://community.akamai.steamstatic.com/economy/image/${iconUrl}/96fx96f`;
}

export default async function Home() {
  const items = await getInventory();

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 p-8">
      <main className="mx-auto max-w-4xl">
        <h1 className="text-2xl font-semibold text-black dark:text-white mb-2">
          Steam Inventory
        </h1>
        <p className="text-sm text-zinc-500 mb-6">{items.length} items</p>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
          {items.map((item) => (
            <div
              key={item.assetid}
              className="flex flex-col items-center gap-1 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-3"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={getIconUrl(item.icon_url)}
                alt={item.name}
                width={64}
                height={64}
              />
              <span className="text-xs text-center text-zinc-700 dark:text-zinc-300 leading-tight">
                {item.market_hash_name}
              </span>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
