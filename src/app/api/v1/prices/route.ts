import { NextResponse } from "next/server";
import { DATA, getRows } from "@/lib/data";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const provider = searchParams.get("provider")?.toLowerCase();
  const gpu = searchParams.get("gpu")?.toLowerCase();
  let rows = getRows();
  if (provider) rows = rows.filter((r) => r.provider.toLowerCase() === provider);
  if (gpu) rows = rows.filter((r) => r.gpu.toLowerCase().includes(gpu));
  return NextResponse.json({
    snapshot_date: DATA.snapshot_date,
    vintage_note: DATA.vintage_note,
    fx: DATA.fx,
    row_count: rows.length,
    rows,
  });
}
