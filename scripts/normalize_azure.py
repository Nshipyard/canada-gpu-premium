#!/usr/bin/env python3
"""Normalize Azure GPU VM on-demand prices: Canada Central vs East US.
On-demand = type Consumption, unitOfMeasure '1 Hour', meterName without
Spot/Low Priority, Linux product names, identical armSkuName in both regions."""
import json, os

RAW = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "data", "raw")

SERIES = ["NCads A100 v4", "NCadsH100v5", "NCSv3", "NCasT4 v3"]

def load(region):
    with open(os.path.join(RAW, f"azure_retail_{region}.json")) as fh:
        return json.load(fh)["items"]

def prices(region):
    out = {}
    for it in load(region):
        if it.get("type") != "Consumption":
            continue
        if it.get("unitOfMeasure") != "1 Hour":
            continue
        pn = it.get("productName", "")
        if "Windows" in pn:
            continue
        if not any(s in pn for s in SERIES):
            continue
        meter = it.get("meterName", "")
        if "Spot" in meter or "Low Priority" in meter:
            continue
        sku = it.get("armSkuName")
        key = (pn, sku)
        # keep lowest (dedupes any duplicate meter rows)
        if key not in out or it["retailPrice"] < out[key]["price"]:
            out[key] = {"price": it["retailPrice"], "meter": meter,
                        "start": it.get("effectiveStartDate"),
                        "unit": it.get("unitOfMeasure")}
    return out

ca = prices("canadacentral")
us = prices("eastus")
rows = []
for key in sorted(set(ca) & set(us)):
    u, c = us[key]["price"], ca[key]["price"]
    prem = (c - u) / u * 100
    rows.append({"product": key[0], "sku": key[1], "us_hr": u, "ca_hr": c,
                 "premium_pct": round(prem, 2)})

print(f"{'productName':32} {'sku':30} {'US $':>9} {'CA $':>9} {'prem%':>8}")
for r in rows:
    print(f"{r['product'][:31]:32} {r['sku'][:29]:30} {r['us_hr']:9.4f} {r['ca_hr']:9.4f} {r['premium_pct']:7.2f}%")

out = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "data", "azure_on_demand.json")
with open(out, "w") as fh:
    json.dump({"source": "Azure Retail Prices API (prices.azure.com/api/retail/prices), type=Consumption on-demand, Linux, per-hour",
               "regions": {"ca": "canadacentral", "us": "eastus"},
               "rows": rows}, fh, indent=2)
print("wrote", out, len(rows), "rows")
