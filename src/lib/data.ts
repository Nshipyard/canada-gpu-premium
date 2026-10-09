import snapshot from "../../data/snapshot-2026-10-09.json";

export interface PriceRow {
  provider: string;
  gpu: string;
  gpus_per_vm: number;
  sku: string;
  rate_type: string;
  ca_region: string;
  us_region: string;
  us_usd_hr: number;
  ca_usd_hr: number;
  us_cad_hr: number;
  ca_cad_hr: number;
  premium_pct: number;
  source: string;
  source_url: string;
}

export interface Snapshot {
  project: string;
  title: string;
  snapshot_date: string;
  vintage_note: string;
  fx: {
    pair: string;
    rate: number;
    rate_date: string;
    source: string;
    source_url: string;
    note: string;
    usd_to_cad: number;
  };
  row_count: number;
  rows: PriceRow[];
}

export const DATA = snapshot as Snapshot;

export function getRows(): PriceRow[] {
  return DATA.rows;
}

export function getSummary() {
  const rows = DATA.rows;
  const byProvider: Record<string, { skus: number; maxPremium: number; minPremium: number }> = {};
  for (const r of rows) {
    const p = byProvider[r.provider] ?? { skus: 0, maxPremium: -Infinity, minPremium: Infinity };
    p.skus += 1;
    p.maxPremium = Math.max(p.maxPremium, r.premium_pct);
    p.minPremium = Math.min(p.minPremium, r.premium_pct);
    byProvider[r.provider] = p;
  }
  return {
    project: DATA.project,
    title: DATA.title,
    snapshot_date: DATA.snapshot_date,
    vintage_note: DATA.vintage_note,
    fx: DATA.fx,
    row_count: DATA.row_count,
    providers: byProvider,
    headline: {
      gpu: "H100 80GB",
      sku: "Standard_NC40ads_H100_v5",
      premium_pct: 23.07,
      us_usd_hr: 6.98,
      ca_usd_hr: 8.59,
    },
  };
}

/** Hero chart groups: representative SKUs, one per provider/GPU class. */
export interface HeroGroup {
  gpu: string;
  provider: string;
  rateType: string;
  bars: { provider: string; caRegion: string; usRegion: string; usPrice: number; caPrice: number; premium: number }[];
}

export function getHeroGroups(): HeroGroup[] {
  const pick = (provider: string, sku: string) =>
    DATA.rows.find((r) => r.provider === provider && r.sku === sku);
  const specs: [string, string][] = [
    ["azure", "Standard_NC40ads_H100_v5"],
    ["azure", "Standard_NC24ads_A100_v4"],
    ["aws", "p4d.24xlarge"],
    ["aws", "g5.xlarge"],
  ];
  const groups: HeroGroup[] = [];
  for (const [provider, sku] of specs) {
    const r = pick(provider, sku);
    if (!r) continue;
    groups.push({
      gpu: r.gpu,
      provider,
      rateType: r.rate_type,
      bars: [
        { provider, caRegion: r.ca_region, usRegion: r.us_region, usPrice: r.us_usd_hr, caPrice: r.ca_usd_hr, premium: r.premium_pct },
      ],
    });
  }
  return groups;
}
