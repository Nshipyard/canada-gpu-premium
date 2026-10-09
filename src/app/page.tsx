"use client";

import { useState } from "react";
import { useLang } from "@/i18n";
import { Banner, Nav, Footer } from "@/components/chrome";
import HeroChart from "@/components/HeroChart";
import { DATA, getHeroGroups, getRows } from "@/lib/data";
import MapleLeaf from "@/components/MapleLeaf";

function SectionKicker({ children }: { children: React.ReactNode }) {
  return (
    <p className="mb-3 text-[13px] font-semibold uppercase tracking-[0.14em] text-canada">{children}</p>
  );
}

function Hero() {
  const { t } = useLang();
  return (
    <section id="top" className="border-b border-line">
      <div className="mx-auto max-w-[1392px] px-6 py-14 md:py-20">
        <SectionKicker>{t.hero.kicker}</SectionKicker>
        <h1 className="display max-w-[900px] text-[44px] md:text-[64px]">{t.hero.title}</h1>
        <p className="mt-6 max-w-[760px] text-[18px] leading-relaxed text-ink/75 md:text-[20px]">
          {t.hero.answer}
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <a href="#skus" className="rounded-full bg-ink px-6 py-3 text-[15px] font-medium text-white hover:bg-ink/85">
            {t.hero.cta1}
          </a>
          <a href="#methodology" className="rounded-full border border-line px-6 py-3 text-[15px] font-medium hover:border-ink/40">
            {t.hero.cta2}
          </a>
        </div>
        <div className="mt-10 grid grid-cols-2 gap-px overflow-hidden rounded-xl border border-line bg-line md:grid-cols-4">
          {t.stats.map((s, i) => (
            <div key={i} className="bg-paper p-6">
              <p className="display text-[34px] text-canada">{s.value}</p>
              <p className="mt-2 text-[13px] leading-snug text-ink/60">{s.label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function PremiumChart() {
  const { t } = useLang();
  const groups = getHeroGroups();
  return (
    <section id="premium" className="border-b border-line bg-paper-warm">
      <div className="mx-auto max-w-[1392px] px-6 py-14 md:py-20">
        <SectionKicker>{t.chart.kicker}</SectionKicker>
        <h2 className="display max-w-[800px] text-[34px] md:text-[44px]">{t.chart.title}</h2>
        <p className="mt-4 max-w-[720px] text-[17px] leading-relaxed text-ink/70">{t.chart.body}</p>
        <div className="mt-10 rounded-xl border border-line bg-paper p-6 md:p-10">
          <HeroChart groups={groups} />
        </div>
        <p className="mt-4 text-[13px] text-ink/50">
          Azure Retail Prices API, October 9, 2026 · FX: Bank of Canada, October 8, 2026
        </p>
      </div>
    </section>
  );
}

function SkuTable() {
  const { t, lang } = useLang();
  const rows = getRows();
  const fmt = (n: number) =>
    n.toLocaleString(lang === "fr" ? "fr-CA" : "en-US", { minimumFractionDigits: 3, maximumFractionDigits: 3 });
  return (
    <section id="skus" className="border-b border-line">
      <div className="mx-auto max-w-[1392px] px-6 py-14 md:py-20">
        <SectionKicker>{t.table.kicker}</SectionKicker>
        <h2 className="display max-w-[800px] text-[34px] md:text-[44px]">{t.table.title}</h2>
        <p className="mt-4 max-w-[720px] text-[17px] leading-relaxed text-ink/70">{t.table.body}</p>
        <div className="mt-8 overflow-x-auto rounded-xl border border-line">
          <table className="w-full min-w-[860px] border-collapse bg-paper text-left text-[14px]">
            <thead>
              <tr className="border-b border-line bg-muted">
                <th className="px-4 py-3 font-semibold">{t.table.cols.gpu}</th>
                <th className="px-4 py-3 font-semibold">SKU</th>
                <th className="px-4 py-3 text-right font-semibold">{t.table.cols.us}</th>
                <th className="px-4 py-3 text-right font-semibold">{t.table.cols.ca}</th>
                <th className="px-4 py-3 text-right font-semibold">{t.table.cols.usCad}</th>
                <th className="px-4 py-3 text-right font-semibold">{t.table.cols.caCad}</th>
                <th className="px-4 py-3 text-right font-semibold">{t.table.cols.premium}</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.sku} className="border-b border-line/60 last:border-0 hover:bg-paper-warm">
                  <td className="px-4 py-3 font-medium">{r.gpu}</td>
                  <td className="px-4 py-3 font-mono text-[13px] text-ink/80">{r.sku}</td>
                  <td className="px-4 py-3 text-right tabular-nums">${fmt(r.us_usd_hr)}</td>
                  <td className="px-4 py-3 text-right tabular-nums font-semibold">${fmt(r.ca_usd_hr)}</td>
                  <td className="px-4 py-3 text-right tabular-nums text-ink/60">${fmt(r.us_cad_hr)}</td>
                  <td className="px-4 py-3 text-right tabular-nums text-ink/60">${fmt(r.ca_cad_hr)}</td>
                  <td className="px-4 py-3 text-right">
                    <span className="rounded-full bg-canada/10 px-2.5 py-1 text-[13px] font-semibold text-canada">
                      +{r.premium_pct.toFixed(1)}%
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}

function Subsidy() {
  const { t } = useLang();
  return (
    <section className="border-b border-line bg-paper-warm">
      <div className="mx-auto max-w-[1392px] px-6 py-14 md:py-20">
        <SectionKicker>{t.subsidy.kicker}</SectionKicker>
        <h2 className="display max-w-[800px] text-[34px] md:text-[44px]">{t.subsidy.title}</h2>
        <p className="mt-4 max-w-[760px] text-[17px] leading-relaxed text-ink/75">{t.subsidy.body}</p>
        <p className="mt-4 max-w-[760px] text-[14px] leading-relaxed text-ink/55">{t.subsidy.note}</p>
      </div>
    </section>
  );
}

function Caveats() {
  const { t } = useLang();
  return (
    <section className="border-b border-line">
      <div className="mx-auto max-w-[1392px] px-6 py-14 md:py-20">
        <SectionKicker>{t.caveats.kicker}</SectionKicker>
        <h2 className="display max-w-[800px] text-[34px] md:text-[44px]">{t.caveats.title}</h2>
        <ul className="mt-8 flex max-w-[820px] flex-col gap-5">
          {t.caveats.items.map((c, i) => (
            <li key={i} className="flex gap-4">
              <span className="mt-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-canada/10 text-[14px] font-semibold text-canada">
                {i + 1}
              </span>
              <p className="text-[16px] leading-relaxed text-ink/80">{c}</p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

function Methodology() {
  const { t } = useLang();
  return (
    <section id="methodology" className="border-b border-line bg-paper-warm">
      <div className="mx-auto max-w-[1392px] px-6 py-14 md:py-20">
        <SectionKicker>{t.methodology.kicker}</SectionKicker>
        <h2 className="display max-w-[800px] text-[34px] md:text-[44px]">{t.methodology.title}</h2>
        <ol className="mt-8 flex max-w-[820px] flex-col gap-5">
          {t.methodology.items.map((m, i) => (
            <li key={i} className="flex gap-4">
              <span className="display mt-0.5 w-8 shrink-0 text-[20px] text-canada">{i + 1}.</span>
              <p className="text-[16px] leading-relaxed text-ink/80">{m}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

const MCP_TOOLS = ["premium_summary", "prices_list", "sku_lookup"];

function Developers() {
  const { t } = useLang();
  const [tab, setTab] = useState<keyof typeof t.mcp.tabs>("claudecode");
  const [copied, setCopied] = useState(false);
  const origin = "https://gpu.canada.nshipyard.com";
  const displayName = "The Montreal Premium";
  const slug = "gpu-premium";
  const example = "look up the H100 premium";
  const exampleLower = "look up the H100 premium";
  const prompt = t.mcp.tabs[tab] === t.mcp.tabs.chatgpt ? t.mcp.pChatgpt :
    tab === "claude" ? t.mcp.pClaude :
    tab === "claudecode" ? t.mcp.pClaudeCode :
    tab === "cli" ? t.mcp.pCli : "";
  const filled = prompt
    .replaceAll("{displayName}", displayName)
    .replaceAll("{origin}", origin)
    .replaceAll("{slug}", slug)
    .replaceAll("{example}", example)
    .replaceAll("{exampleLower}", exampleLower);
  const copy = async () => {
    await navigator.clipboard.writeText(filled);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <section id="developers" className="border-b border-line">
      <div className="mx-auto max-w-[1392px] px-6 py-14 md:py-20">
        <SectionKicker>{t.developers.kicker}</SectionKicker>
        <h2 className="display max-w-[800px] text-[34px] md:text-[44px]">{t.developers.title}</h2>
        <p className="mt-4 max-w-[720px] text-[17px] leading-relaxed text-ink/70">{t.developers.body}</p>

        <h3 className="display mt-10 text-[24px]">{t.developers.endpoints}</h3>
        <div className="mt-4 overflow-hidden rounded-xl border border-line">
          {[
            { m: "GET", p: "/api/v1/summary", d: "Headline premiums, FX rate and date, snapshot vintage" },
            { m: "GET", p: "/api/v1/prices", d: "Full normalized price table, filterable by provider and GPU" },
            { m: "GET", p: "/api/openapi.json", d: "OpenAPI 3.1 document for the REST API" },
            { m: "POST", p: "/mcp", d: "MCP server (streamable HTTP): premium_summary, prices_list, sku_lookup" },
          ].map((e) => (
            <div key={e.p} className="flex flex-wrap items-center gap-3 border-b border-line/60 bg-paper px-5 py-4 last:border-0">
              <span className="rounded bg-ink px-2 py-0.5 font-mono text-[12px] font-semibold text-white">{e.m}</span>
              <code className="font-mono text-[14px]">{e.p}</code>
              <span className="text-[14px] text-ink/55">{e.d}</span>
              <a href={e.p} target="_blank" rel="noopener noreferrer" className="ml-auto text-[14px] font-medium text-canada hover:underline">
                {t.developers.tryIt} →
              </a>
            </div>
          ))}
        </div>

        <h3 className="display mt-10 text-[24px]">{t.developers.mcpTitle}</h3>
        <p className="mt-2 max-w-[720px] text-[16px] text-ink/70">{t.developers.mcpBody}</p>

        <div className="mt-10 rounded-xl border border-line bg-paper-warm p-6 md:p-10">
          <SectionKicker>{t.mcp.kicker}</SectionKicker>
          <h3 className="display text-[28px]">{t.mcp.title}</h3>
          <p className="mt-3 max-w-[640px] text-[16px] text-ink/70">{t.mcp.body}</p>
          <div className="mt-6 flex flex-wrap gap-2">
            {(Object.keys(t.mcp.tabs) as (keyof typeof t.mcp.tabs)[]).map((k) => (
              <button
                key={k}
                onClick={() => { setTab(k); setCopied(false); }}
                className={`rounded-full px-4 py-2 text-[14px] font-medium ${tab === k ? "bg-ink text-white" : "border border-line text-ink/70 hover:border-ink/40"}`}
              >
                {t.mcp.tabs[k]}
              </button>
            ))}
          </div>
          {tab === "other" ? (
            <div className="mt-6">
              <p className="text-[16px] font-medium">{t.mcp.otherTitle}</p>
              <p className="mt-1 text-[15px] text-ink/65">{t.mcp.otherBody}</p>
              <dl className="mt-4 flex flex-col gap-2 font-mono text-[13px]">
                <div className="flex gap-3"><dt className="w-32 shrink-0 text-ink/55">{t.mcp.mcpEndpoint}</dt><dd>{origin}/mcp</dd></div>
                <div className="flex gap-3"><dt className="w-32 shrink-0 text-ink/55">{t.mcp.openapiSpec}</dt><dd>{origin}/api/openapi.json</dd></div>
                <div className="flex gap-3"><dt className="w-32 shrink-0 text-ink/55">{t.mcp.restBase}</dt><dd>{origin}/api/v1</dd></div>
              </dl>
            </div>
          ) : (
            <div className="mt-6 overflow-hidden rounded-xl border border-line bg-paper">
              <div className="flex items-center justify-between border-b border-line px-5 py-3">
                <p className="text-[14px] font-medium">
                  {t.mcp.cardTitle.replace("{tab}", t.mcp.tabs[tab])}
                </p>
                <button onClick={copy} className="rounded-full bg-ink px-4 py-1.5 text-[13px] font-medium text-white hover:bg-ink/85">
                  {copied ? t.mcp.copied : t.mcp.copy}
                </button>
              </div>
              {tab === "chatgpt" && <p className="border-b border-line bg-muted px-5 py-3 text-[13px] text-ink/60">{t.mcp.chatgptNote}</p>}
              <pre className="overflow-x-auto whitespace-pre-wrap px-5 py-4 font-mono text-[13px] leading-relaxed">{filled}</pre>
            </div>
          )}
        </div>
        <div className="mt-6 flex flex-wrap items-center gap-2 text-[14px] text-ink/60">
          <MapleLeaf className="h-4 w-4 text-canada" />
          <span>{t.developers.mcpTitle}: {MCP_TOOLS.join(", ")}</span>
        </div>
      </div>
    </section>
  );
}

function Downloads() {
  const { t } = useLang();
  return (
    <section id="data" className="border-b border-line bg-paper-warm">
      <div className="mx-auto max-w-[1392px] px-6 py-14 md:py-20">
        <SectionKicker>{t.downloads.kicker}</SectionKicker>
        <h2 className="display max-w-[800px] text-[34px] md:text-[44px]">{t.downloads.title}</h2>
        <p className="mt-4 max-w-[720px] text-[17px] leading-relaxed text-ink/70">{t.downloads.body}</p>
        <div className="mt-8 grid gap-4 md:grid-cols-2">
          {t.downloads.files.map((f) => (
            <div key={f.name} className="flex items-center justify-between gap-4 rounded-xl border border-line bg-paper p-6">
              <div>
                <p className="font-mono text-[15px] font-semibold">/data/{f.name}</p>
                <p className="mt-1 text-[14px] text-ink/60">{f.desc}</p>
              </div>
              <a
                href={`/data/${f.name}`}
                download
                className="shrink-0 rounded-full bg-ink px-5 py-2.5 text-[14px] font-medium text-white hover:bg-ink/85"
              >
                {t.downloads.download}
              </a>
            </div>
          ))}
        </div>
        <p className="mt-4 font-mono text-[13px] text-ink/50">
          snapshot: {DATA.snapshot_date} · FX {DATA.fx.pair} {DATA.fx.rate} ({DATA.fx.rate_date}) · {DATA.row_count} rows
        </p>
      </div>
    </section>
  );
}

export default function Page() {
  return (
    <>
      <Banner />
      <Nav />
      <main className="flex-1">
        <Hero />
        <PremiumChart />
        <SkuTable />
        <Subsidy />
        <Caveats />
        <Methodology />
        <Developers />
        <Downloads />
      </main>
      <Footer />
    </>
  );
}
