import { NextRequest, NextResponse } from "next/server";
import { getInventoryRaw } from "@/lib/inventory";

// Never prerendered or cached — the debug page wants the live Steam response.
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  // proxy.ts lets every /api/ path through unauthenticated, so this route has to
  // repeat the cookie check the /debug page gets from the proxy.
  if (req.cookies.get("auth")?.value !== process.env.AUTH_TOKEN) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    return NextResponse.json(await getInventoryRaw());
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[debug] Inventory fetch failed:", message);
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
