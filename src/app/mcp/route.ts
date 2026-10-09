import { NextResponse } from "next/server";
import { getSummary, getRows, DATA } from "@/lib/data";

// Minimal MCP server over streamable HTTP (JSON-RPC 2.0 via POST).
// Supports: initialize, tools/list, tools/call. Stateless.

const SERVER = { name: "canada-gpu-premium", version: "1.0.0" };

const TOOLS = [
  {
    name: "premium_summary",
    description:
      "Headline GPU price premiums: how much more identical GPU SKUs cost per hour in Canadian cloud regions vs the nearest US region, with FX rate, snapshot vintage, and the honest caveats (rate types, what was left out).",
    inputSchema: { type: "object", properties: {} },
  },
  {
    name: "prices_list",
    description:
      "Full normalized per-region GPU price table: provider, GPU, SKU, rate type, regions, USD and CAD hourly prices, premium percent. Filterable by provider and GPU.",
    inputSchema: {
      type: "object",
      properties: {
        provider: { type: "string", description: "Optional provider filter, e.g. azure" },
        gpu: { type: "string", description: "Optional GPU substring filter, e.g. H100" },
      },
    },
  },
  {
    name: "sku_lookup",
    description:
      "Full record for one SKU: US vs Canada hourly prices in USD and CAD, premium percent, source and source URL.",
    inputSchema: {
      type: "object",
      properties: {
        sku: { type: "string", description: "SKU, e.g. Standard_NC40ads_H100_v5" },
      },
      required: ["sku"],
    },
  },
];

function ok(id: unknown, result: unknown) {
  return { jsonrpc: "2.0", id, result };
}
function err(id: unknown, code: number, message: string) {
  return { jsonrpc: "2.0", id, error: { code, message } };
}
function textResult(data: unknown) {
  return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
}

function handle(msg: any) {
  if (!msg || msg.jsonrpc !== "2.0" || typeof msg.method !== "string") {
    return err(msg?.id ?? null, -32600, "Invalid Request");
  }
  const id = msg.id ?? null;
  switch (msg.method) {
    case "initialize":
      return ok(id, {
        protocolVersion: "2024-11-05",
        capabilities: { tools: {} },
        serverInfo: SERVER,
      });
    case "notifications/initialized":
      return null;
    case "tools/list":
      return ok(id, { tools: TOOLS });
    case "tools/call": {
      const { name, arguments: args } = msg.params ?? {};
      try {
        if (name === "premium_summary") {
          return ok(id, textResult(getSummary()));
        }
        if (name === "prices_list") {
          const provider = String(args?.provider ?? "").toLowerCase();
          const gpu = String(args?.gpu ?? "").toLowerCase();
          let rows = getRows();
          if (provider) rows = rows.filter((r) => r.provider.toLowerCase() === provider);
          if (gpu) rows = rows.filter((r) => r.gpu.toLowerCase().includes(gpu));
          return ok(id, textResult({ snapshot_date: DATA.snapshot_date, fx: DATA.fx, row_count: rows.length, rows }));
        }
        if (name === "sku_lookup") {
          const sku = String(args?.sku ?? "");
          const hit = getRows().find((r) => r.sku.toLowerCase() === sku.toLowerCase());
          if (!hit) return err(id, -32001, `No SKU ${sku}`);
          return ok(id, textResult(hit));
        }
        return err(id, -32602, `Unknown tool ${name}`);
      } catch (e) {
        return err(id, -32000, `Tool error: ${(e as Error).message}`);
      }
    }
    default:
      return err(id, -32601, `Method not found: ${msg.method}`);
  }
}

export async function POST(req: Request) {
  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(err(null, -32700, "Parse error"), { status: 400 });
  }
  if (Array.isArray(body)) {
    const out = body.map(handle).filter((r) => r !== null);
    return NextResponse.json(out);
  }
  const out = handle(body);
  if (out === null) return new NextResponse(null, { status: 202 });
  return NextResponse.json(out);
}

export async function GET() {
  return NextResponse.json(
    { error: "This MCP server accepts JSON-RPC 2.0 via POST only." },
    { status: 405 }
  );
}

export async function DELETE() {
  return new NextResponse(null, { status: 405 });
}
