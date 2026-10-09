#!/usr/bin/env python3
"""Fetch Azure Retail Prices for GPU VMs in Canada Central vs East US.
Raw snapshot saved for provenance."""
import json, urllib.parse, urllib.request, os, datetime

BASE = "https://prices.azure.com/api/retail/prices"

def fetch_all(filter_expr):
    items = []
    url = BASE + "?$filter=" + urllib.parse.quote(filter_expr) + "&$top=1000"
    while url:
        req = urllib.request.Request(url, headers={"User-Agent": "nshipyard-gpu-premium/1.0"})
        try:
            with urllib.request.urlopen(req, timeout=60) as r:
                data = json.load(r)
        except urllib.error.HTTPError as e:
            print("FAILED URL:", url[:220])
            print("BODY:", e.read()[:600])
            raise
        items.extend(data.get("Items", []))
        nxt = data.get("NextPageLink")
        # Azure returns a bogus $top=-1000 in NextPageLink; sanitize it.
        url = nxt.replace("$top=-1000", "$top=1000") if nxt else None
    return items

out_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "data", "raw")
os.makedirs(out_dir, exist_ok=True)

for region in ["canadacentral", "eastus"]:
    f = f"serviceName eq 'Virtual Machines' and armRegionName eq '{region}'"
    items = fetch_all(f)
    path = os.path.join(out_dir, f"azure_retail_{region}.json")
    with open(path, "w") as fh:
        json.dump({"fetched_at": datetime.datetime.now(datetime.timezone.utc).isoformat(),
                   "count": len(items), "items": items}, fh)
    print(region, len(items), "items ->", path)

# discover GPU product names
all_items = []
for region in ["canadacentral", "eastus"]:
    with open(os.path.join(out_dir, f"azure_retail_{region}.json")) as fh:
        all_items.extend(json.load(fh)["items"])
names = {}
for it in all_items:
    pn = it.get("productName", "")
    if any(k in pn.upper() for k in ["NC", "ND", "NV"]):
        key = (it.get("armRegionName"), pn)
        names.setdefault(key, set()).add(it.get("armSkuName"))
for key in sorted(names):
    print(key, "->", sorted(names[key])[:8], "..." if len(names[key]) > 8 else "")
