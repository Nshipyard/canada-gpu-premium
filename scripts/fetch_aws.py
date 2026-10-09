#!/usr/bin/env python3
"""Stream the AWS EC2 bulk price-list files and extract on-demand prices for
target GPU instance types in Canada (Central) vs US East (N. Virginia),
plus Reserved terms for p5.48xlarge (H100) to check the reservation-rate claim.
No full-file download: single-pass streaming brace-matched parser."""
import json, os, re, sys

REGIONS = {
    "us-east-1": "US East (N. Virginia)",
    "ca-central-1": "Canada (Central)",
}
TARGET_TYPES = ["g5.xlarge", "g5.2xlarge", "g5.12xlarge", "g5.48xlarge",
                "p4d.24xlarge", "p5.48xlarge"]

class Streamer:
    def __init__(self, resp):
        self.resp = resp
        self.buf = ""
        self.eof = False
    def _fill(self, n):
        while len(self.buf) < n and not self.eof:
            chunk = self.resp.read(65536)
            if not chunk:
                self.eof = True
                break
            self.buf += chunk.decode("utf-8", errors="replace")
    def peek(self, n=1):
        self._fill(n)
        return self.buf[:n]
    def take(self, n):
        self._fill(n)
        out, self.buf = self.buf[:n], self.buf[n:]
        return out
    def skip_ws(self):
        while True:
            self._fill(1)
            if not self.buf or self.buf[0] not in " \t\r\n":
                return
            self.buf = self.buf[1:]
    def expect(self, s):
        self.skip_ws()
        got = self.take(len(s))
        assert got == s, f"expected {s!r} got {got!r}"
    def read_string(self):
        self.expect('"')
        out = []
        while True:
            self._fill(1)
            c = self.take(1)
            if c == '"':
                return "".join(out)
            if c == "\\":
                out.append(self.take(1))
            else:
                out.append(c)
    def read_balanced(self):
        """Read a balanced {...} object, return raw text."""
        self.skip_ws()
        assert self.peek(1) == "{"
        depth, in_str, esc = 0, False, False
        out = []
        while True:
            self._fill(1)
            if not self.buf:
                raise EOFError("unbalanced")
            c = self.take(1)
            out.append(c)
            if in_str:
                if esc:
                    esc = False
                elif c == "\\":
                    esc = True
                elif c == '"':
                    in_str = False
            else:
                if c == '"':
                    in_str = True
                elif c == "{":
                    depth += 1
                elif c == "}":
                    depth -= 1
                    if depth == 0:
                        return "".join(out)
    def find_key(self, key):
        """Scan forward until a top-level \"key\": is found; consume through colon."""
        needle = f'"{key}"'
        while True:
            self._fill(len(needle) + 4)
            if not self.buf and self.eof:
                raise EOFError(f"key {key} not found")
            i = self.buf.find(needle)
            if i == -1:
                # keep tail that could contain partial needle
                self.buf = self.buf[-(len(needle)):]
                continue
            self.buf = self.buf[i + len(needle):]
            self.skip_ws()
            if self.peek(1) == ":":
                self.take(1)
                return

def section_entries(st, want_skus=None):
    """Yield (key, raw_json_text) for each entry in the current {...} section."""
    st.expect("{")
    while True:
        st.skip_ws()
        if st.peek(1) == "}":
            st.take(1)
            return
        key = st.read_string()
        st.expect(":")
        raw = st.read_balanced()
        yield key, raw
        st.skip_ws()
        c = st.peek(1)
        if c == ",":
            st.take(1)

def process_region(rcode, location):
    path = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "data", "raw",
                        f"aws_ec2_{rcode.replace('-', '_')}.json")
    print(f"[{rcode}] parsing {path}...", flush=True)
    resp = open(path, "rb")
    st = Streamer(resp)
    st.find_key("products")
    matched = {}
    for key, raw in section_entries(st):
        # fast prefilter before json parsing
        if '"instanceType"' not in raw:
            continue
        try:
            prod = json.loads(raw)
        except Exception:
            continue
        a = prod.get("attributes", {})
        if (a.get("instanceType") in TARGET_TYPES
                and a.get("location") == location
                and a.get("tenancy") == "Shared"
                and a.get("operatingSystem") == "Linux"
                and prod.get("productFamily") == "Compute Instance"):
            matched[key] = {"instanceType": a["instanceType"],
                            "vcpu": a.get("vcpu"), "gpu": a.get("gpu"),
                            "memory": a.get("memory"), "location": location}
    print(f"[{rcode}] matched {len(matched)} product SKUs", flush=True)
    st.find_key("terms")
    st.expect("{")
    ondemand, reserved = {}, {}
    while True:
        st.skip_ws()
        if st.peek(1) == "}":
            st.take(1)
            break
        tname = st.read_string()
        st.expect(":")
        if tname in ("OnDemand", "Reserved"):
            for key, raw in section_entries(st):
                if key in matched:
                    try:
                        (ondemand if tname == "OnDemand" else reserved)[key] = json.loads(raw)
                    except Exception:
                        pass
        else:
            st.read_balanced()  # skip other term types
        st.skip_ws()
        if st.peek(1) == ",":
            st.take(1)
    resp.close()
    return matched, ondemand, reserved

def od_price(od_block):
    out = []
    for term in od_block.values():
        for dim in term.get("priceDimensions", {}).values():
            if dim.get("unit") == "Hrs":
                out.append((dim["pricePerUnit"]["USD"], dim.get("description", "")))
    return out

def reserved_offers(r_block):
    out = []
    for termcode, term in r_block.items():
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
for rcode, loc in REGIONS.items():
    matched, od, res = process_region(rcode, loc)
    rows = []
    for sku, m in sorted(matched.items(), key=lambda kv: kv[1]["instanceType"]):
        prices = od_price(od.get(sku, {}))
        rows.append({**m, "sku": sku,
                     "ondemand_usd_hr": prices[0][0] if prices else None,
                     "ondemand_desc": prices[0][1] if prices else None,
                     "reserved": reserved_offers(res.get(sku, {}))})
    results[rcode] = rows
    for r in rows:
        print(f"  {r['instanceType']:15} gpu={r['gpu']:>3} ondemand=${r['ondemand_usd_hr']}/hr n_reserved={len(r['reserved'])}")

with open("data/raw/aws_ec2_extracted.json", "w") as fh:
    json.dump(results, fh, indent=2)
print("wrote data/raw/aws_ec2_extracted.json")
