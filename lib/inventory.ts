export interface Asset {
  assetid: string;
  classid: string;
  instanceid: string;
  amount: string;
}

export interface Description {
  classid: string;
  instanceid: string;
  name: string;
  market_hash_name: string;
  icon_url: string;
  tradable: number;
  marketable: number;
  tags: { category: string; localized_tag_name: string }[];
}

export interface InventoryResponse {
  assets: Asset[];
  descriptions: Description[];
  total_inventory_count: number;
}

export interface InventoryItem extends Description {
  assetid: string;
  amount: number;
}

export const STEAM_ID = "76561198282835607";

export async function getInventory(): Promise<InventoryItem[]> {
  const res = await fetch(
    `https://steamcommunity.com/inventory/${STEAM_ID}/730/2`,
    {
      next: { revalidate: 300 },
      headers: { "User-Agent": "Mozilla/5.0" },
    }
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

export async function getPriceMap(): Promise<Map<string, number>> {
  const res = await fetch("https://csfloat.com/api/v1/listings/price-list", {
    next: { revalidate: 300 },
    headers: { "User-Agent": "Mozilla/5.0" },
  });
  const data: { market_hash_name: string; min_price: number }[] =
    await res.json();
  const map = new Map<string, number>();
  for (const item of data) {
    map.set(item.market_hash_name, item.min_price);
  }
  return map;
}
