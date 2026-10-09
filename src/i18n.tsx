"use client";

import { createContext, useContext, useEffect, useState } from "react";
import type { ReactNode } from "react";

export type Lang = "en" | "fr";

const en = {
  banner: {
    line: "An open-source civic project. Not affiliated with the Government of Canada.",
    badge: "Open source",
    repo: "GitHub repo",
  },
  nav: {
    premium: "The premium",
    skus: "All SKUs",
    methodology: "Methodology",
    developers: "Developers",
    data: "Data",
    back: "All projects",
  },
  hero: {
    kicker: "Open Nshipyard · Cloud GPU pricing",
    title: "The Montreal Premium.",
    answer:
      "The same GPU costs 11.0% to 23.1% more per hour in a Canadian cloud region than in the nearest US region, on identical on-demand SKUs priced October 9, 2026. Azure's H100 80GB carries the largest premium at 23.1%; AWS's A10G carries the smallest at 11.0%.",
    annotation: "Paying the Montreal premium, or training in Virginia?",
    cta1: "See every SKU",
    cta2: "Read the methodology",
  },
  stats: [
    { value: "18", label: "identical GPU SKUs compared across Canada vs US regions, on-demand, Linux, October 9, 2026 snapshot (13 Azure, 5 AWS)" },
    { value: "+23.1%", label: "premium on Azure H100 80GB (NC40ads_H100_v5): $6.98/hr East US vs $8.59/hr Canada Central" },
    { value: "+11.0%", label: "premium on AWS A10G (g5.xlarge): $1.006/hr US East vs $1.117/hr Canada Central" },
    { value: "1.4241", label: "CAD per USD used for billing-currency conversion (Bank of Canada, October 8, 2026)" },
  ],
  chart: {
    kicker: "The premium",
    title: "Same SKU, same hour, different price.",
    body: "Each pair compares one identical GPU SKU in a Canadian region against the nearest US region, on-demand list price per hour, Linux, October 9, 2026. Azure: Canada Central (Toronto) vs East US (Virginia). AWS: Canada (Central, Montreal) vs US East (N. Virginia). Red is Canada; grey is the US baseline.",
    perHour: "/hr",
    canadaLabel: "Canada",
    usLabel: "US",
    premium: "premium",
    onDemand: "on-demand",
  },
  table: {
    kicker: "All SKUs",
    title: "Every SKU in the snapshot.",
    body: "Eighteen GPU SKUs across five GPU types and two providers, all on-demand, all Linux, all priced the same day. Premiums are computed as (Canada minus US) divided by US, in USD list prices; the FX conversion does not change the percentage.",
    cols: { gpu: "GPU", sku: "SKU", us: "US $/hr", ca: "CA $/hr", usCad: "US C$/hr", caCad: "CA C$/hr", premium: "Premium" },
  },
  subsidy: {
    kicker: "Policy context",
    title: "Does the federal subsidy erase the premium?",
    body: "The AI Compute Access Fund, an Innovation, Science and Economic Development Canada (ISED) program under the Canadian Sovereign AI Compute Strategy, covers two-thirds of eligible Canadian cloud compute costs and one-half of non-Canadian costs, for projects of $100,000 to $5,000,000 (program guide, June 24, 2025). For a funded company, a 23.1% Canada premium becomes roughly a 59% discount against the US price after the subsidy: the company pays about one-third of the Canadian price versus the full US price. The catch is eligibility: Canadian SMEs under 500 employees doing R&D in Canada, and the non-Canadian coverage ends March 31, 2027. Unfunded teams pay the full premium.",
    note: "Subsidy figures verified against the ISED program guide, October 9, 2026. Coverage rules can change; check the guide before budgeting.",
  },
  caveats: {
    kicker: "What this does not show",
    title: "Read this before you share the chart.",
    items: [
      "Rate types: every bar is on-demand list price, the price with no commitment. Committed-use and reservation prices are lower on both sides and are not in this snapshot; the premium on committed rates may differ.",
      "AWS P5 (H100) instances have no true on-demand list price, so no AWS on-demand H100 bar exists. The bulk price file lists $55.04/hr for p5.48xlarge in US East, but labels it per Unused Reservation Instance Hour, not on-demand. Any honest H100 comparison on AWS must use committed or reservation rates.",
      "The claimed AWS reservation-rate inversion (non-US regions cheaper than US East for H100 reservations) does not extend to Canada: 1-year reserved p5.48xlarge is $43.34/hr ($5.42/GPU-hr) in US East vs $49.85/hr ($6.23/GPU-hr) in Canada Central, a 15.0% Canada premium, matching the on-demand pattern.",
      "Prices are USD list prices from the vendors' public pricing APIs. Your invoice adds tax, and Canadian customers are billed in CAD at the vendor's conversion; the CAD columns use the Bank of Canada rate of October 8, 2026 (1 USD = 1.4241 CAD), not each vendor's billing rate.",
      "Regions compared are Azure Canada Central (Toronto) vs East US (Virginia), and AWS Canada (Central, Montreal) vs US East (N. Virginia), the nearest US regions. Latency, data residency, and carbon intensity differ by region and are not priced here.",
      "Vintage: prices move monthly. This snapshot is October 9, 2026. Re-run the scripts in the repo for a fresh pull.",
      "GCP is not in this snapshot: Google publishes per-region GPU prices behind a JavaScript region selector, and the Cloud Billing Catalog API requires an API key, so no citable Montreal figure could be verified. The methodology page documents the attempt.",
    ],
  },
  methodology: {
    kicker: "Methodology",
    title: "How the premium was computed, and what was left out.",
    items: [
      "Sources: the Azure Retail Prices API (prices.azure.com/api/retail/prices, keyless), queried October 9, 2026 for serviceName 'Virtual Machines' in arm regions canadacentral and eastus; and the AWS Price List Bulk API (AmazonEC2 offer files for us-east-1 and ca-central-1, downloaded October 9, 2026), parsed for Compute Instance, Shared tenancy, Linux. Raw responses are committed in data/raw/.",
      "SKU normalization: Azure rows were filtered to type Consumption (on-demand), unitOfMeasure '1 Hour', Linux product names, meter names without Spot or Low Priority suffixes, then inner-joined on identical armSkuName across the two regions (13 SKUs matched). AWS rows were filtered to instanceType, location, tenancy Shared, operatingSystem Linux, productFamily Compute Instance, then matched on identical instanceType across the two regions (5 instance types matched). Every published figure is one of those rows.",
      "The premium is (Canada price minus US price) divided by US price, on USD list prices. Currency conversion cannot change the percentage; CAD columns are shown because Canadian invoices land in CAD.",
      "FX: Bank of Canada Valet, FXCADUSD 0.7022 on October 8, 2026, meaning 1 USD = 1.4241 CAD. Rate and date are stamped in the dataset.",
      "Rate-type honesty: on-demand only. AWS P5 (H100) has no true on-demand list price (the $55.04/hr entry in the bulk file is labeled per Unused Reservation Instance Hour), so AWS on-demand H100 is excluded by rule, not by omission. The reservation-rate inversion claim was checked: 1-year reserved p5.48xlarge shows no inversion for Canada ($5.42/GPU-hr US East vs $6.23/GPU-hr Canada Central).",
      "GCP: per-region GPU prices could not be verified. Google's published pricing pages render one region's prices behind a JavaScript selector, and the Cloud Billing Catalog API needs a key. No Montreal figure is published rather than an unverified one.",
      "What moves: cloud GPU list prices change monthly. The snapshot is dated October 9, 2026; scripts/fetch_azure.py, scripts/fetch_aws_fast.py, and scripts/build_snapshot.py re-pull and rebuild it deterministically.",
    ],
  },
  developers: {
    kicker: "For developers",
    title: "Query it from code, or from an agent.",
    body: "Three consumption paths, same snapshot. REST for applications, OpenAPI for integration, MCP tools over streamable HTTP for AI agents.",
    endpoints: "Endpoints",
    tryIt: "Try it",
    openapi: "OpenAPI spec",
    mcpTitle: "MCP server",
    mcpBody: "One streamable-HTTP endpoint. Tools: premium_summary, prices_list, sku_lookup.",
  },
  mcp: {
    kicker: "Connect your agent",
    title: "Put this data to work inside your AI tools.",
    body: "Pick your harness, copy the prompt, send it to your agent. Your agent runs the setup itself.",
    tabs: { chatgpt: "ChatGPT", claude: "Claude", claudecode: "Claude Code", cli: "CLI", other: "Other" },
    cardTitle: "Copy and send this to {tab}",
    copy: "Copy",
    copied: "Copied",
    chatgptNote: "ChatGPT connects through the documented REST API rather than MCP directly.",
    pChatgpt:
      "I want to use the {displayName} through its API.\n- OpenAPI spec: {origin}/api/openapi.json\n- REST base: {origin}/api/v1\nFirst tell me in two sentences what this API offers, then {exampleLower}, and show me the result.",
    pClaude:
      "In Claude (claude.ai), open Settings, then Connectors, and add a custom connector:\n- Name: {displayName}\n- URL: {origin}/mcp\nThen list the available tools, {exampleLower}, and show me the result.",
    pClaudeCode:
      "Set up the {displayName} MCP server so I can query it from here.\n1. Run: claude mcp add --transport http {slug} {origin}/mcp\n2. Run `claude mcp list` to confirm it connected.\n3. {example}, and show me the result.",
    pCli:
      "# MCP endpoint (streamable HTTP)\n{origin}/mcp\n\n# List the available tools\ncurl -s -X POST {origin}/mcp -H 'Content-Type: application/json' \\\n  -d '{\"jsonrpc\":\"2.0\",\"id\":1,\"method\":\"tools/list\"}'",
    otherTitle: "Everything else",
    otherBody: "Any harness that speaks MCP over streamable HTTP, or plain REST.",
    mcpEndpoint: "MCP endpoint",
    openapiSpec: "OpenAPI spec",
    restBase: "REST base",
  },
  downloads: {
    kicker: "Data",
    title: "Take the files.",
    body: "The normalized per-region price table and the snapshot metadata, MIT licensed. Prices move monthly; check the snapshot date before citing.",
    files: [
      { name: "prices.csv", desc: "Normalized GPU price comparison: provider, GPU, SKU, rate type, regions, USD and CAD hourly prices, premium percent" },
      { name: "prices.json", desc: "Same data as JSON, plus FX rate and date, vintage note, and source URLs" },
    ],
    download: "Download",
  },
  footer: {
    line: "An open-source civic project. Not affiliated with the Government of Canada.",
    sources: "Sources: Azure Retail Prices API (Oct 9, 2026); AWS Price List Bulk API (Oct 9, 2026); Bank of Canada Valet FX (Oct 8, 2026); ISED AI Compute Access Fund program guide (June 24, 2025).",
  },
};

export type Dict = typeof en;

const fr: Dict = {
  banner: {
    line: "Un projet civique à code source ouvert. Sans affiliation avec le gouvernement du Canada.",
    badge: "Code source ouvert",
    repo: "Dépôt GitHub",
  },
  nav: {
    premium: "La prime",
    skus: "Tous les SKU",
    methodology: "Méthodologie",
    developers: "Développeurs",
    data: "Données",
    back: "Tous les projets",
  },
  hero: {
    kicker: "Open Nshipyard · Tarification des GPU infonuagiques",
    title: "La prime de Montréal.",
    answer:
      "Le même GPU coûte de 11,0 % à 23,1 % plus cher l'heure dans une région infonuagique canadienne que dans la région américaine la plus proche, sur des SKU à la demande identiques tarifés le 9 octobre 2026. Le H100 80 Go d'Azure porte la prime la plus élevée à 23,1 %; l'A10G d'AWS porte la plus faible à 11,0 %.",
    annotation: "Payer la prime de Montréal, ou entraîner en Virginie?",
    cta1: "Voir chaque SKU",
    cta2: "Lire la méthodologie",
  },
  stats: [
    { value: "18", label: "SKU de GPU identiques comparés entre le Canada et les régions américaines, à la demande, Linux, instantané du 9 octobre 2026 (13 Azure, 5 AWS)" },
    { value: "+23,1 %", label: "prime sur le H100 80 Go d'Azure (NC40ads_H100_v5) : 6,98 $/h en East US contre 8,59 $/h au Canada Central" },
    { value: "+11,0 %", label: "prime sur l'A10G d'AWS (g5.xlarge) : 1,006 $/h en US East contre 1,117 $/h au Canada Central" },
    { value: "1,4241", label: "CAD par USD utilisés pour la conversion en devise de facturation (Banque du Canada, 8 octobre 2026)" },
  ],
  chart: {
    kicker: "La prime",
    title: "Même SKU, même heure, prix différent.",
    body: "Chaque paire compare un SKU de GPU identique dans une région canadienne et la région américaine la plus proche, au prix catalogue horaire à la demande, Linux, 9 octobre 2026. Azure : Canada Central (Toronto) contre East US (Virginie). AWS : Canada (Central, Montréal) contre US East (Virginie du Nord). Le rouge est le Canada; le gris est la référence américaine.",
    perHour: "/h",
    canadaLabel: "Canada",
    usLabel: "É.-U.",
    premium: "prime",
    onDemand: "à la demande",
  },
  table: {
    kicker: "Tous les SKU",
    title: "Chaque SKU de l'instantané.",
    body: "Dix-huit SKU de GPU dans cinq types de GPU et deux fournisseurs, tous à la demande, tous Linux, tous tarifés le même jour. Les primes sont calculées comme (Canada moins É.-U.) divisé par É.-U., sur les prix catalogues en USD; la conversion de change ne modifie pas le pourcentage.",
    cols: { gpu: "GPU", sku: "SKU", us: "É.-U. $/h", ca: "CA $/h", usCad: "É.-U. $ CA/h", caCad: "CA $ CA/h", premium: "Prime" },
  },
  subsidy: {
    kicker: "Contexte stratégique",
    title: "La subvention fédérale efface-t-elle la prime?",
    body: "Le Fonds d'accès au calcul pour l'IA, un programme d'Innovation, Sciences et Développement économique Canada (ISDE) dans le cadre de la Stratégie canadienne en matière de calcul souverain pour l'IA, couvre les deux tiers des coûts admissibles de calcul infonuagique canadien et la moitié des coûts non canadiens, pour des projets de 100 000 $ à 5 000 000 $ (guide du programme, 24 juin 2025). Pour une entreprise financée, une prime canadienne de 23,1 % devient environ un rabais de 59 % par rapport au prix américain après la subvention : l'entreprise paie environ le tiers du prix canadien contre le plein prix américain. La condition est l'admissibilité : PME canadiennes de moins de 500 employés faisant de la R-D au Canada, et la couverture non canadienne se termine le 31 mars 2027. Les équipes non financées paient la prime au complet.",
    note: "Chiffres de la subvention vérifiés contre le guide du programme d'ISDE, 9 octobre 2026. Les règles de couverture peuvent changer; consultez le guide avant de budgéter.",
  },
  caveats: {
    kicker: "Ce que ceci ne montre pas",
    title: "Lisez ceci avant de partager le graphique.",
    items: [
      "Types de tarifs : chaque barre est au prix catalogue à la demande, le prix sans engagement. Les prix d'utilisation engagée et de réservation sont plus bas des deux côtés et ne figurent pas dans cet instantané; la prime sur les tarifs engagés peut différer.",
      "Les instances AWS P5 (H100) n'ont pas de véritable prix catalogue à la demande, donc aucune barre AWS H100 à la demande n'existe. Le fichier de prix en vrac liste 55,04 $/h pour p5.48xlarge en US East, mais l'étiquette comme par heure de réservation inutilisée, pas à la demande. Toute comparaison honnête du H100 sur AWS doit utiliser des tarifs engagés ou de réservation.",
      "L'inversion présumée des tarifs de réservation AWS (régions non américaines moins chères que US East pour les réservations H100) ne s'étend pas au Canada : le p5.48xlarge réservé 1 an est à 43,34 $/h (5,42 $/GPU-h) en US East contre 49,85 $/h (6,23 $/GPU-h) au Canada Central, une prime canadienne de 15,0 %, conforme au motif à la demande.",
      "Les prix sont des prix catalogues en USD tirés des API publiques de tarification des fournisseurs. Votre facture ajoute les taxes, et les clients canadiens sont facturés en CAD au taux du fournisseur; les colonnes en CAD utilisent le taux de la Banque du Canada du 8 octobre 2026 (1 USD = 1,4241 CAD), pas le taux de facturation de chaque fournisseur.",
      "Les régions comparées sont Azure Canada Central (Toronto) contre East US (Virginie), et AWS Canada (Central, Montréal) contre US East (Virginie du Nord), les régions américaines les plus proches. La latence, la résidence des données et l'intensité carbone diffèrent par région et ne sont pas chiffrées ici.",
      "Millésime : les prix bougent chaque mois. Cet instantané date du 9 octobre 2026. Relancez les scripts du dépôt pour une extraction fraîche.",
      "GCP ne figure pas dans cet instantané : Google publie ses prix de GPU par région derrière un sélecteur de région en JavaScript, et l'API du catalogue de facturation infonuagique exige une clé API, donc aucun chiffre citable pour Montréal n'a pu être vérifié. La page de méthodologie documente la tentative.",
    ],
  },
  methodology: {
    kicker: "Méthodologie",
    title: "Comment la prime a été calculée, et ce qui a été exclu.",
    items: [
      "Sources : l'API Azure Retail Prices (prices.azure.com/api/retail/prices, sans clé), interrogée le 9 octobre 2026 pour le service « Virtual Machines » dans les régions arm canadacentral et eastus; et l'API en vrac des prix AWS (fichiers d'offre AmazonEC2 pour us-east-1 et ca-central-1, téléchargés le 9 octobre 2026), analysés pour Compute Instance, location partagée, Linux. Les réponses brutes sont versées dans data/raw/.",
      "Normalisation des SKU : les lignes Azure ont été filtrées au type Consumption (à la demande), unité « 1 Hour », noms de produit Linux, noms de compteur sans suffixe Spot ou Low Priority, puis jointes sur l'armSkuName identique entre les deux régions (13 SKU correspondaient). Les lignes AWS ont été filtrées par instanceType, région, location partagée, système d'exploitation Linux, famille de produit Compute Instance, puis appariées sur l'instanceType identique entre les deux régions (5 types correspondaient). Chaque chiffre publié est l'une de ces lignes.",
      "La prime est (prix Canada moins prix É.-U.) divisé par le prix É.-U., sur les prix catalogues en USD. La conversion de devises ne peut pas changer le pourcentage; les colonnes en CAD sont affichées parce que les factures canadiennes arrivent en CAD.",
      "Change : Banque du Canada Valet, FXCADUSD 0,7022 le 8 octobre 2026, soit 1 USD = 1,4241 CAD. Le taux et la date sont estampillés dans le jeu de données.",
      "Honnêteté des types de tarifs : à la demande seulement. AWS P5 (H100) n'a pas de véritable prix catalogue à la demande (l'entrée de 55,04 $/h dans le fichier en vrac est étiquetée par heure de réservation inutilisée), donc le H100 AWS à la demande est exclu par règle, pas par oubli. L'inversion des tarifs de réservation a été vérifiée : le p5.48xlarge réservé 1 an ne montre aucune inversion pour le Canada (5,42 $/GPU-h en US East contre 6,23 $/GPU-h au Canada Central).",
      "GCP : les prix de GPU par région n'ont pas pu être vérifiés. Les pages de tarification publiées de Google affichent les prix d'une seule région derrière un sélecteur JavaScript, et l'API du catalogue de facturation exige une clé. Aucun chiffre pour Montréal n'est publié plutôt qu'un chiffre non vérifié.",
      "Ce qui bouge : les prix catalogues des GPU infonuagiques changent chaque mois. L'instantané est daté du 9 octobre 2026; scripts/fetch_azure.py, scripts/fetch_aws_fast.py et scripts/build_snapshot.py le reconstruisent de façon déterministe.",
    ],
  },
  developers: {
    kicker: "Pour les développeurs",
    title: "Interrogez-la depuis du code, ou depuis un agent.",
    body: "Trois façons de consommer le même instantané. REST pour les applications, OpenAPI pour l'intégration, outils MCP en HTTP continu pour les agents IA.",
    endpoints: "Points de terminaison",
    tryIt: "Essayer",
    openapi: "Spécification OpenAPI",
    mcpTitle: "Serveur MCP",
    mcpBody: "Un point de terminaison HTTP continu. Outils : premium_summary, prices_list, sku_lookup.",
  },
  mcp: {
    kicker: "Connectez votre agent",
    title: "Exploitez ces données dans vos outils d'IA.",
    body: "Choisissez votre plateforme, copiez l'invite, envoyez-la à votre agent. Votre agent exécute la configuration lui-même.",
    tabs: { chatgpt: "ChatGPT", claude: "Claude", claudecode: "Claude Code", cli: "CLI", other: "Autre" },
    cardTitle: "Copiez et envoyez ceci à {tab}",
    copy: "Copier",
    copied: "Copié",
    chatgptNote: "ChatGPT se connecte via l'API REST documentée plutôt que directement en MCP.",
    pChatgpt:
      "Je veux utiliser {displayName} via son API.\n- Spécification OpenAPI : {origin}/api/openapi.json\n- Base REST : {origin}/api/v1\nD'abord, dis-moi en deux phrases ce que cette API offre, puis {exampleLower}, et montre-moi le résultat.",
    pClaude:
      "Dans Claude (claude.ai), ouvre les paramètres, puis Connecteurs, et ajoute un connecteur personnalisé :\n- Nom : {displayName}\n- URL : {origin}/mcp\nEnsuite, liste les outils disponibles, {exampleLower}, et montre-moi le résultat.",
    pClaudeCode:
      "Configure le serveur MCP {displayName} pour que je puisse l'interroger d'ici.\n1. Exécute : claude mcp add --transport http {slug} {origin}/mcp\n2. Exécute `claude mcp list` pour confirmer la connexion.\n3. {example}, et montre-moi le résultat.",
    pCli:
      "# Point de terminaison MCP (HTTP continu)\n{origin}/mcp\n\n# Lister les outils disponibles\ncurl -s -X POST {origin}/mcp -H 'Content-Type: application/json' \\\n  -d '{\"jsonrpc\":\"2.0\",\"id\":1,\"method\":\"tools/list\"}'",
    otherTitle: "Tout le reste",
    otherBody: "Toute plateforme qui parle MCP en HTTP continu, ou REST tout court.",
    mcpEndpoint: "Point de terminaison MCP",
    openapiSpec: "Spécification OpenAPI",
    restBase: "Base REST",
  },
  downloads: {
    kicker: "Données",
    title: "Prenez les fichiers.",
    body: "La table de prix normalisée par région et les métadonnées de l'instantané, sous licence MIT. Les prix bougent chaque mois; vérifiez la date de l'instantané avant de citer.",
    files: [
      { name: "prices.csv", desc: "Comparaison normalisée des prix de GPU : fournisseur, GPU, SKU, type de tarif, régions, prix horaires en USD et CAD, pourcentage de prime" },
      { name: "prices.json", desc: "Mêmes données en JSON, plus le taux et la date de change, la note de millésime et les URL sources" },
    ],
    download: "Télécharger",
  },
  footer: {
    line: "Un projet civique à code source ouvert. Sans affiliation avec le gouvernement du Canada.",
    sources: "Sources : API Azure Retail Prices (9 oct. 2026); API en vrac des prix AWS (9 oct. 2026); Valet des taux de change de la Banque du Canada (8 oct. 2026); guide du programme du Fonds d'accès au calcul pour l'IA d'ISDE (24 juin 2025).",
  },
};

const dicts: Record<Lang, Dict> = { en, fr };

const LangCtx = createContext<{ lang: Lang; setLang: (l: Lang) => void; t: Dict }>({
  lang: "en",
  setLang: () => {},
  t: en,
});

export function LangProvider({ children }: { children: ReactNode }) {
  const [lang, setLang] = useState<Lang>("en");
  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);
  return <LangCtx.Provider value={{ lang, setLang, t: dicts[lang] }}>{children}</LangCtx.Provider>;
}

export function useLang() {
  return useContext(LangCtx);
}
