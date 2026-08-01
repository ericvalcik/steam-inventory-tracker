import DebugInventory from "@/app/components/DebugInventory";

// Steam refuses the request from Vercel's IPs, so prerendering this page at build
// time fails the build. The inventory is fetched client-side instead; this keeps
// the page out of the static export entirely.
export const dynamic = "force-dynamic";

export default function DebugPage() {
  return <DebugInventory />;
}
