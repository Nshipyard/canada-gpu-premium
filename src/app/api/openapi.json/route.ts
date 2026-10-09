import { NextResponse } from "next/server";

const spec = {
  openapi: "3.1.0",
  info: {
    title: "The Montreal Premium API",
    version: "1.0.0",
    description:
      "Per-region GPU list prices: identical cloud GPU SKUs priced in Canadian regions vs the nearest US region, with the percentage premium in USD and CAD terms. Snapshot October 9, 2026 (Azure Retail Prices API, on-demand, Linux); Bank of Canada FX October 8, 2026. Prices move monthly; check snapshot_date before citing. MIT licensed.",
  },
  servers: [{ url: "https://gpu.canada.nshipyard.com/api/v1" }],
  paths: {
    "/summary": {
      get: {
        summary: "Headline premiums, FX rate and date, snapshot vintage, per-provider ranges",
        responses: { "200": { description: "Summary with headline H100/A100 premiums and methodology notes" } },
      },
    },
    "/prices": {
      get: {
        summary: "Normalized per-region GPU price table with premium percentages",
        parameters: [
          { name: "provider", in: "query", required: false, schema: { type: "string" }, example: "azure" },
          { name: "gpu", in: "query", required: false, schema: { type: "string" }, description: "GPU substring filter, e.g. H100", example: "H100" },
        ],
        responses: { "200": { description: "Snapshot metadata plus matching price rows" } },
      },
    },
  },
};

export async function GET() {
  return NextResponse.json(spec);
}
