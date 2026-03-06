interface PriceEntry {
  market_hash_name: string;
  quantity: number;
  min_price: number;
}

async function getMasterPiecePrices(): Promise<PriceEntry[]> {
  const res = await fetch("https://csfloat.com/api/v1/listings/price-list", {
    next: { revalidate: 60 },
  });
  const data: PriceEntry[] = await res.json();
  return data.filter((item) => {
    const name = item.market_hash_name.toLowerCase();
    return name.includes("master piece") && !name.includes("souvenir");
  });
}

export default async function Home() {
  const items = await getMasterPiecePrices();

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black p-8">
      <main className="mx-auto max-w-2xl">
        <h1 className="text-2xl font-semibold text-black dark:text-white mb-6">
          Master Piece Prices
        </h1>
        {items.length === 0 ? (
          <p className="text-zinc-500">No items found.</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-200 dark:border-zinc-800 text-left text-zinc-500">
                <th className="pb-2 font-medium">Item</th>
                <th className="pb-2 font-medium text-right">Min Price</th>
                <th className="pb-2 font-medium text-right">Qty</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr
                  key={item.market_hash_name}
                  className="border-b border-zinc-100 dark:border-zinc-900 text-black dark:text-white"
                >
                  <td className="py-2">{item.market_hash_name}</td>
                  <td className="py-2 text-right">
                    ${(item.min_price / 100).toFixed(2)}
                  </td>
                  <td className="py-2 text-right text-zinc-500">
                    {item.quantity}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </main>
    </div>
  );
}
