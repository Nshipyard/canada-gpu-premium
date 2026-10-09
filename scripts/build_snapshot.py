#!/usr/bin/env python3
"""Build the canonical monthly snapshot: normalized per-region GPU prices.
Inputs: data/azure_on_demand.json, data/raw/aws_ec2_extracted.json (optional),
        data/raw/boc_fxcadusd.json.
Outputs: data/snapshot-2026-10-09.json, public/data/prices.json,
         public/data/prices.csv
Every figure traces to a source row; FX rate and date stamped."""
import json, csv, os, datetime

ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..")
SNAP_DATE = "2026-10-09"

def load(p):
    with open(os.path.join(ROOT, p)) as fh:
        return json.load(fh)

# --- FX: Bank of Canada Valet, FXCADUSD (CAD per USD), latest observation
fx_raw = load("data/raw/boc_fxcadusd.json")
obs = fx_raw["observations"][-1]
fx_rate = float(obs["FXCADUSD"]["v"])   # USD->CAD: 1 USD = 1/fx CAD... see note
fx_date = obs["d"]
# FXCADUSD is quoted as CAD per USD? No: FXCADUSD = value of CAD in USD terms,
# i.e. 0.7022 means 1 CAD = 0.7022 USD, so 1 USD = 1/0.7022 CAD.
usd_to_cad = 1.0 / fx_rate

rows = []

# --- Azure: retail prices API, on-demand Consumption, Linux
az = load("data/azure_on_demand.json")
GPU_OF_SKU = {
    "Standard_NC24ads_A100_v4": ("A100 80GB", 1),
    "Standard_NC48ads_A100_v4": ("A100 80GB", 2),
    "Standard_NC96ads_A100_v4": ("A100 80GB", 4),
    "Standard_NC40ads_H100_v5": ("H100 80GB", 1),
    "Standard_NC80adis_H100_v5": ("H100 80GB", 2),
    "Standard_NC6s_v3": ("V100 16GB", 1),
    "Standard_NC12s_v3": ("V100 16GB", 2),
    "Standard_NC24s_v3": ("V100 16GB", 4),
    "Standard_NC24rs_v3": ("V100 16GB", 4),
    "Standard_NC4as_T4_v3": ("T4 16GB", 1),
    "Standard_NC8as_T4_v3": ("T4 16GB", 1),
    "Standard_NC16as_T4_v3": ("T4 16GB", 2),
    "Standard_NC64as_T4_v3": ("T4 16GB", 4),
}
for r in az["rows"]:
    gpu, n = GPU_OF_SKU.get(r["sku"], (r["sku"], 1))
    u, c = r["us_hr"], r["ca_hr"]
    rows.append({
        "provider": "azure",
        "gpu": gpu,
        "gpus_per_vm": n,
        "sku": r["sku"],
        "rate_type": "on-demand",
        "ca_region": "canadacentral",
        "us_region": "eastus",
        "us_usd_hr": round(u, 4),
        "ca_usd_hr": round(c, 4),
        "us_cad_hr": round(u * usd_to_cad, 4),
        "ca_cad_hr": round(c * usd_to_cad, 4),
        "premium_pct": round((c - u) / u * 100, 2),
        "source": "Azure Retail Prices API",
        "source_url": "https://prices.azure.com/api/retail/prices",
    })

# --- AWS: bulk price list, on-demand (g5/A10G, p4d/A100); p5 reserved checked separately
aws_path = os.path.join(ROOT, "data/raw/aws_ec2_extracted.json")
AWS_GPU = {"g5.xlarge": ("A10G 24GB", 1), "g5.2xlarge": ("A10G 24GB", 1),
           "g5.12xlarge": ("A10G 24GB", 4), "g5.48xlarge": ("A10G 24GB", 8),
           "p4d.24xlarge": ("A100 40GB", 8)}
if os.path.exists(aws_path):
    aws = load("data/raw/aws_ec2_extracted.json")
    by_type = {}
    for rcode, rrows in aws.items():
        for r in rrows:
            # keep the row with a real non-zero on-demand price
            try:
                p = float(r["ondemand_usd_hr"] or 0)
            except (TypeError, ValueError):
                p = 0
            if p <= 0:
                continue
            key = (r["instanceType"], rcode)
            if key not in by_type:
                by_type[key] = r
    for itype, (gpu, n) in AWS_GPU.items():
        us_r, ca_r = by_type.get((itype, "us-east-1")), by_type.get((itype, "ca-central-1"))
        if us_r and ca_r:
            u, c = float(us_r["ondemand_usd_hr"]), float(ca_r["ondemand_usd_hr"])
            rows.append({
                "provider": "aws",
                "gpu": gpu,
                "gpus_per_vm": n,
                "sku": itype,
                "rate_type": "on-demand",
                "ca_region": "ca-central-1",
                "us_region": "us-east-1",
                "us_usd_hr": round(u, 4),
                "ca_usd_hr": round(c, 4),
                "us_cad_hr": round(u * usd_to_cad, 4),
                "ca_cad_hr": round(c * usd_to_cad, 4),
                "premium_pct": round((c - u) / u * 100, 2),
                "source": "AWS Price List Bulk API (AmazonEC2 offer file)",
                "source_url": "https://pricing.us-east-1.amazonaws.com/offers/v1.0/aws/AmazonEC2/current/",
            })

rows.sort(key=lambda r: (r["provider"], r["gpu"], r["sku"]))

snapshot = {
    "project": "canada-gpu-premium",
    "title": "The Montreal Premium",
    "snapshot_date": SNAP_DATE,
    "vintage_note": "Cloud GPU list prices move monthly. This snapshot is dated; re-run scripts/ to refresh.",
    "fx": {
        "pair": "FXCADUSD",
        "rate": fx_rate,
        "rate_date": fx_date,
        "source": "Bank of Canada Valet",
        "source_url": "https://www.bankofcanada.ca/valet/observations/FXCADUSD/json",
        "note": f"FXCADUSD {fx_rate} on {fx_date} means 1 CAD = {fx_rate} USD; 1 USD = {round(usd_to_cad,4)} CAD. Canadian customers are billed in CAD against USD list prices, so premiums are shown in both currencies.",
        "usd_to_cad": round(usd_to_cad, 4),
    },
    "row_count": len(rows),
    "rows": rows,
}

with open(os.path.join(ROOT, f"data/snapshot-{SNAP_DATE}.json"), "w") as fh:
    json.dump(snapshot, fh, indent=2)
with open(os.path.join(ROOT, "public/data/prices.json"), "w") as fh:
    json.dump(snapshot, fh, indent=2)

csv_fields = ["provider", "gpu", "gpus_per_vm", "sku", "rate_type", "ca_region",
              "us_region", "us_usd_hr", "ca_usd_hr", "us_cad_hr", "ca_cad_hr",
              "premium_pct", "source", "source_url"]
with open(os.path.join(ROOT, "public/data/prices.csv"), "w", newline="") as fh:
    w = csv.DictWriter(fh, fieldnames=csv_fields, extrasaction="ignore")
    w.writeheader()
    w.writerows(rows)

print(f"snapshot {SNAP_DATE}: {len(rows)} rows, FX {fx_rate} on {fx_date}")
for r in rows:
    print(f"  {r['provider']:6} {r['gpu']:10} {r['sku']:28} US ${r['us_usd_hr']:<9} CA ${r['ca_usd_hr']:<9} +{r['premium_pct']}%")
