export interface PaidService {
  name: string;
  host: string;
  category: string;
  pricePerCallUsd: number;
  valueScore: number;
  maxCallsPerDay: number;
}

export interface BudgetBucket {
  key: string;
  spent: number;
  calls: number;
}

export interface BudgetState {
  dailyUsd: number;
  spentToday: number;
  remaining: number;
  pctUsed: number;
  callsToday: number;
  burnRatePerHour: number;
  projectedRunoutHours: number | null;
  byCategory: BudgetBucket[];
  byService: BudgetBucket[];
}

export interface AllocationItem {
  service: PaidService;
  calls: number;
  cost: number;
  value: number;
  valuePerDollar: number;
}

export interface AllocationPlan {
  remaining: number;
  items: AllocationItem[];
  totalCost: number;
  totalValue: number;
  utilization: number;
}

export const SERVICE_CATALOG: PaidService[] = [
  { name: "helios /nano", host: "heliosnano-pay.up.railway.app", category: "demo", pricePerCallUsd: 0.000001, valueScore: 5, maxCallsPerDay: 500 },
  { name: "helios /hello-world", host: "heliosnano-pay.up.railway.app", category: "demo", pricePerCallUsd: 0.01, valueScore: 12, maxCallsPerDay: 50 },
  { name: "Crypto Spot Prices", host: "api.cryptoprice.x402", category: "market-data", pricePerCallUsd: 0.001, valueScore: 38, maxCallsPerDay: 400 },
  { name: "Equity Quotes", host: "api.equityquotes.x402", category: "market-data", pricePerCallUsd: 0.004, valueScore: 30, maxCallsPerDay: 150 },
  { name: "FX Rates", host: "api.fxrates.x402", category: "market-data", pricePerCallUsd: 0.0008, valueScore: 22, maxCallsPerDay: 300 },
  { name: "Onchain Analytics", host: "api.onchain.x402", category: "market-data", pricePerCallUsd: 0.02, valueScore: 55, maxCallsPerDay: 40 },
  { name: "Web Search", host: "api.websearch.x402", category: "search", pricePerCallUsd: 0.005, valueScore: 40, maxCallsPerDay: 120 },
  { name: "News Search", host: "api.newssearch.x402", category: "search", pricePerCallUsd: 0.003, valueScore: 28, maxCallsPerDay: 150 },
  { name: "Academic Papers", host: "api.papers.x402", category: "search", pricePerCallUsd: 0.006, valueScore: 33, maxCallsPerDay: 60 },
  { name: "Text Summarize", host: "api.summarize.x402", category: "ai", pricePerCallUsd: 0.008, valueScore: 36, maxCallsPerDay: 100 },
  { name: "Embeddings", host: "api.embeddings.x402", category: "ai", pricePerCallUsd: 0.0004, valueScore: 18, maxCallsPerDay: 800 },
  { name: "Image Caption", host: "api.imgcaption.x402", category: "ai", pricePerCallUsd: 0.01, valueScore: 30, maxCallsPerDay: 50 },
  { name: "Translate", host: "api.translate.x402", category: "ai", pricePerCallUsd: 0.002, valueScore: 26, maxCallsPerDay: 200 },
  { name: "OCR / Document", host: "api.ocr.x402", category: "ai", pricePerCallUsd: 0.012, valueScore: 34, maxCallsPerDay: 40 },
  { name: "Social Trends", host: "api.socialtrends.x402", category: "social", pricePerCallUsd: 0.004, valueScore: 24, maxCallsPerDay: 120 },
  { name: "Sentiment", host: "api.sentiment.x402", category: "social", pricePerCallUsd: 0.0015, valueScore: 20, maxCallsPerDay: 200 },
  { name: "Prediction Markets", host: "api.predmarkets.x402", category: "social", pricePerCallUsd: 0.003, valueScore: 29, maxCallsPerDay: 100 },
  { name: "Weather", host: "api.weather.x402", category: "geo", pricePerCallUsd: 0.0006, valueScore: 16, maxCallsPerDay: 300 },
  { name: "Geocoding", host: "api.geocode.x402", category: "geo", pricePerCallUsd: 0.0005, valueScore: 14, maxCallsPerDay: 300 },
  { name: "Routing / Maps", host: "api.routing.x402", category: "geo", pricePerCallUsd: 0.002, valueScore: 21, maxCallsPerDay: 120 },
  { name: "Send SMS", host: "api.sms.x402", category: "comms", pricePerCallUsd: 0.015, valueScore: 27, maxCallsPerDay: 30 },
  { name: "Send Email", host: "api.email.x402", category: "comms", pricePerCallUsd: 0.001, valueScore: 17, maxCallsPerDay: 100 },
  { name: "Sports Scores", host: "api.sports.x402", category: "data", pricePerCallUsd: 0.0007, valueScore: 15, maxCallsPerDay: 200 },
  { name: "Company Filings", host: "api.filings.x402", category: "data", pricePerCallUsd: 0.009, valueScore: 31, maxCallsPerDay: 40 },
];

export function computeBudgetState(dailyUsd: number, catalog: PaidService[]): BudgetState {
  const plan = optimizeAllocation(dailyUsd, catalog);
  const spentToday = plan.totalCost;
  const remaining = Math.max(0, dailyUsd - spentToday);

  const catMap = new Map<string, BudgetBucket>();
  const svcMap = new Map<string, BudgetBucket>();

  for (const item of plan.items) {
    const cat = item.service.category;
    const c = catMap.get(cat) ?? { key: cat, spent: 0, calls: 0 };
    c.spent += item.cost;
    c.calls += item.calls;
    catMap.set(cat, c);

    const s = svcMap.get(item.service.name) ?? { key: item.service.name, spent: 0, calls: 0 };
    s.spent += item.cost;
    s.calls += item.calls;
    svcMap.set(item.service.name, s);
  }

  const burnRatePerHour = spentToday / 24;
  const sortDesc = (a: BudgetBucket, b: BudgetBucket) => b.spent - a.spent;

  return {
    dailyUsd,
    spentToday,
    remaining,
    pctUsed: dailyUsd > 0 ? Math.min(1, spentToday / dailyUsd) : 0,
    callsToday: plan.items.reduce((s, i) => s + i.calls, 0),
    burnRatePerHour,
    projectedRunoutHours: burnRatePerHour > 0 && remaining > 0 ? remaining / burnRatePerHour : null,
    byCategory: [...catMap.values()].sort(sortDesc),
    byService: [...svcMap.values()].sort(sortDesc),
  };
}

export function optimizeAllocation(remaining: number, catalog: PaidService[]): AllocationPlan {
  const ranked = [...catalog]
    .filter((s) => s.pricePerCallUsd > 0)
    .map((s) => ({ s, vpd: s.valueScore / s.pricePerCallUsd }))
    .sort((a, b) => b.vpd - a.vpd);

  let budget = remaining;
  const items: AllocationItem[] = [];

  for (const { s, vpd } of ranked) {
    if (budget <= 0) break;
    const affordable = Math.floor(budget / s.pricePerCallUsd);
    const calls = Math.min(s.maxCallsPerDay, affordable);
    if (calls <= 0) continue;
    const cost = calls * s.pricePerCallUsd;
    items.push({ service: s, calls, cost, value: calls * s.valueScore, valuePerDollar: vpd });
    budget -= cost;
  }

  const totalCost = items.reduce((a, i) => a + i.cost, 0);
  const totalValue = items.reduce((a, i) => a + i.value, 0);

  return {
    remaining,
    items,
    totalCost,
    totalValue,
    utilization: remaining > 0 ? totalCost / remaining : 0,
  };
}
