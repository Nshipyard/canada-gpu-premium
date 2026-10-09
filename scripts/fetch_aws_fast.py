#!/usr/bin/env python3
"""Fast AWS EC2 price extraction: regex-scan the bulk JSON files (mmap),
parse only matching product entries, then pull their OnDemand/Reserved terms.
Outputs data/raw/aws_ec2_extracted.json"""
import json, os, re, mmap

ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..")
REGIONS = {"us-east-1": "US East (N. Virginia)", "ca-central-1": "Canada (Central)"}
TARGET_TYPES = ["g5.xlarge", "g5.2xlarge", "g5.12xlarge", "g5.48xlarge",
                "p4d.24xlarge", "p5.48xlarge"]

def find_entry(mm: bytes, pos: int) -> dict:
    """Given a position inside a product entry, find the entry's {...} bounds and parse it."""
    # scan backwards for the entry key: '"<SKU>" : {'
    # entries look like:     "ABCDEF1234567890" : {
    start = mm.rfind(b'"{', 0, pos)  # not reliable; do it properly below
    # find enclosing entry by scanning back for '": {' at line start-ish
    back = max(0, pos - 4000)
    chunk = mm[back:pos].decode("utf-8", errors="replace")
    m = None
    for m in re.finditer(r'"([A-Z0-9]{8,})"\s*:\s*\{\s*$', chunk, re.M):
        pass
    assert m, "entry start not found"
    entry_start = back + m.start()
    # brace-match forward from the opening brace
    brace_pos = back + m.end() - 1
    depth, in_str, esc, i = 0, False, False, brace_pos
    n = len(mm)
    while i < n:
        c = mm[i:i+1]
        if in_str:
            if esc: esc = False
            elif c == b'\\': esc = True
            elif c == b'"': in_str = False
        else:
            if c == b'"': in_str = True
            elif c == b'{': depth += 1
            elif c == b'}':
                depth -= 1
                if depth == 0:
                    return json.loads(mm[brace_pos:i+1].decode("utf-8"))
        i += 1
    raise EOFError("unbalanced")

def extract_terms(mm: bytes, sku: str, section: str):
    """Find the terms section entry for a SKU: "terms" -> section -> "SKU" : {...}"""
    # locate: "<section>" : { ... "SKU" : {
    tpos = mm.find(b'"terms"')
    spos = mm.find(b'"%s"' % section.encode(), tpos)
    # find '"SKU" : {' after spos
    needle = b'"%s"' % sku.encode()
    kpos = mm.find(needle, spos)
    if kpos == -1:
        return None
    # the entry value starts at the first '{' after the key
    bpos = mm.find(b'{', kpos + len(needle))
    depth, in_str, esc, i = 0, False, False, bpos
    n = len(mm)
    while i < n:
        c = mm[i:i+1]
        if in_str:
            if esc: esc = False
            elif c == b'\\': esc = True
            elif c == b'"': in_str = False
        else:
            if c == b'"': in_str = True
            elif c == b'{': depth += 1
            elif c == b'}':
                depth -= 1
                if depth == 0:
                    return json.loads(mm[bpos:i+1].decode("utf-8"))
        i += 1
    return None

def od_price(od_block):
    out = []
    for term in (od_block or {}).values():
        for dim in term.get("priceDimensions", {}).values():
            if dim.get("unit") == "Hrs":
                out.append((dim["pricePerUnit"]["USD"], dim.get("description", "")))
    return out

def reserved_offers(r_block):
    out = []
    for term in (r_block or {}).values():
        ta = term.get("termAttributes", {})
        for dim in term.get("priceDimensions", {}).values():
            if dim.get("unit") == "Hrs":
                out.append({"lease": ta.get("LeaseContractLength"),
                            "offering": ta.get("OfferingClass"),
                            "purchase": ta.get("PurchaseOption"),
                            "usd": dim["pricePerUnit"]["USD"],
                            "desc": dim.get("description", "")})
    return out

results = {}
type_pat = re.compile(rb'"instanceType"\s*:\s*"(' + b'|'.join(t.encode() for t in TARGET_TYPES) + rb')"')
for rcode, location in REGIONS.items():
    path = os.path.join(ROOT, "data", "raw", f"aws_ec2_{rcode.replace('-', '_')}.json")
    print(f"[{rcode}] mmap {path}...", flush=True)
    fh = open(path, "rb")
    mm = mmap.mmap(fh.fileno(), 0, access=mmap.ACCESS_READ)
    matched = {}
    for m in type_pat.finditer(mm):
        itype = m.group(1).decode()
        try:
            prod = find_entry(mm, m.start())
        except Exception as e:
            print("  entry parse failed:", e)
            continue
        a = prod.get("attributes", {})
        if (a.get("location") == location and a.get("tenancy") == "Shared"
                and a.get("operatingSystem") == "Linux"
                and prod.get("productFamily") == "Compute Instance"):
            matched[prod["sku"]] = {"instanceType": itype, "vcpu": a.get("vcpu"),
                                    "gpu": a.get("gpu"), "memory": a.get("memory"),
                                    "location": location}
    print(f"[{rcode}] {len(matched)} matching SKUs, pulling terms...", flush=True)
    rows = []
    for sku, meta in sorted(matched.items(), key=lambda kv: kv[1]["instanceType"]):
        od = extract_terms(mm, sku, "OnDemand")
        res = extract_terms(mm, sku, "Reserved")
        prices = od_price(od)
        rows.append({**meta, "sku": sku,
                     "ondemand_usd_hr": prices[0][0] if prices else None,
                     "ondemand_desc": prices[0][1] if prices else None,
                     "reserved": reserved_offers(res)})
    results[rcode] = rows
    for r in rows:
        print(f"  {r['instanceType']:15} gpu={str(r['gpu']):>4} ondemand={r['ondemand_usd_hr']} n_reserved={len(r['reserved'])}")
    mm.close(); fh.close()

with open(os.path.join(ROOT, "data/raw/aws_ec2_extracted.json"), "w") as fh:
    json.dump(results, fh, indent=2)
print("wrote data/raw/aws_ec2_extracted.json")
