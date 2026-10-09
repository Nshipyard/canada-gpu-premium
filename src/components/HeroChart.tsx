"use client";

import { useLang } from "@/i18n";
import type { HeroGroup } from "@/lib/data";

export default function HeroChart({ groups }: { groups: HeroGroup[] }) {
  const { t, lang } = useLang();
  const fmt = (n: number) =>
    n.toLocaleString(lang === "fr" ? "fr-CA" : "en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const pct = (n: number) =>
    (lang === "fr" ? "+" : "+") + n.toFixed(1).replace(".", lang === "fr" ? "," : ".") + "%";

  return (
    <div className="flex flex-col gap-10">
      {groups.map((g) => {
        const max = Math.max(...g.bars.flatMap((b) => [b.usPrice, b.caPrice]));
        return (
          <div key={g.gpu}>
            <div className="mb-4 flex flex-wrap items-baseline gap-x-3">
              <h3 className="display text-[26px]">{g.gpu}</h3>
              <span className="text-[13px] font-medium uppercase tracking-wide text-ink/50">
                {g.provider === "azure" ? "Azure" : "AWS"} · {t.chart.onDemand}
              </span>
            </div>
            <div className="flex flex-col gap-5">
              {g.bars.map((b) => (
                <div key={b.provider} className="flex flex-col gap-2">
                  <div className="flex items-center gap-2 md:gap-3">
                    <span className="w-[86px] shrink-0 text-[13px] font-medium text-ink/70 md:w-[128px] md:text-[14px]">
                      {t.chart.canadaLabel}
                    </span>
                    <div className="relative h-[44px] min-w-0 flex-1">
                      <div
                        className="absolute inset-y-0 left-0 rounded-r-md bg-canada"
                        style={{ width: `${(b.caPrice / max) * 100}%` }}
                      />
                    </div>
                    <span className="w-[92px] shrink-0 text-right text-[14px] font-semibold tabular-nums md:w-[132px] md:text-[15px]">
                      ${fmt(b.caPrice)}
                      <span className="font-normal text-ink/50">{t.chart.perHour}</span>
                    </span>
                    <span className="w-[64px] shrink-0 rounded-full bg-canada/10 px-1 py-1 text-center text-[12px] font-semibold text-canada md:w-[76px] md:text-[13px]">
                      {pct(b.premium)}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 md:gap-3">
                    <span className="w-[86px] shrink-0 text-[13px] font-medium text-ink/70 md:w-[128px] md:text-[14px]">
                      {t.chart.usLabel}
                    </span>
                    <div className="relative h-[44px] min-w-0 flex-1">
                      <div
                        className="absolute inset-y-0 left-0 rounded-r-md bg-ink/25"
                        style={{ width: `${(b.usPrice / max) * 100}%` }}
                      />
                    </div>
                    <span className="w-[92px] shrink-0 text-right text-[14px] font-medium tabular-nums text-ink/70 md:w-[132px] md:text-[15px]">
                      ${fmt(b.usPrice)}
                      <span className="font-normal text-ink/50">{t.chart.perHour}</span>
                    </span>
                    <span className="w-[64px] shrink-0 md:w-[76px]" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      })}
      <p className="display text-[20px] italic text-ink/70">“{t.hero.annotation}”</p>
    </div>
  );
}
