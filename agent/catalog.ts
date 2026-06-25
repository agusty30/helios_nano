/**
 * Example catalog of paid x402 services the budget bot optimizes across.
 *
 * Prices and value scores are illustrative — in production these come from
 * `circle services search` / the marketplace and from the agent's own
 * value model. The local server's `/nano` and `/hello-world` are included so
 * the bot has live, payable targets on Arc Testnet.
 */
import type { PaidService } from "./budget.ts";

export const SERVICE_CATALOG: PaidService[] = [
  // --- live, payable on this deployment ---
  { name: "helios /nano", host: "heliosnano-pay.up.railway.app", category: "demo", pricePerCallUsd: 0.000001, valueScore: 5, maxCallsPerDay: 500 },
  { name: "helios /hello-world", host: "heliosnano-pay.up.railway.app", category: "demo", pricePerCallUsd: 0.01, valueScore: 12, maxCallsPerDay: 50 },

  // --- market data ---
  { name: "Crypto Spot Prices", host: "api.cryptoprice.x402", category: "market-data", pricePerCallUsd: 0.001, valueScore: 38, maxCallsPerDay: 400 },
  { name: "Equity Quotes", host: "api.equityquotes.x402", category: "market-data", pricePerCallUsd: 0.004, valueScore: 30, maxCallsPerDay: 150 },
  { name: "FX Rates", host: "api.fxrates.x402", category: "market-data", pricePerCallUsd: 0.0008, valueScore: 22, maxCallsPerDay: 300 },
  { name: "Onchain Analytics", host: "api.onchain.x402", category: "market-data", pricePerCallUsd: 0.02, valueScore: 55, maxCallsPerDay: 40 },

  // --- search & web ---
  { name: "Web Search", host: "api.websearch.x402", category: "search", pricePerCallUsd: 0.005, valueScore: 40, maxCallsPerDay: 120 },
  { name: "News Search", host: "api.newssearch.x402", category: "search", pricePerCallUsd: 0.003, valueScore: 28, maxCallsPerDay: 150 },
  { name: "Academic Papers", host: "api.papers.x402", category: "search", pricePerCallUsd: 0.006, valueScore: 33, maxCallsPerDay: 60 },

  // --- AI / inference ---
  { name: "Text Summarize", host: "api.summarize.x402", category: "ai", pricePerCallUsd: 0.008, valueScore: 36, maxCallsPerDay: 100 },
  { name: "Embeddings", host: "api.embeddings.x402", category: "ai", pricePerCallUsd: 0.0004, valueScore: 18, maxCallsPerDay: 800 },
  { name: "Image Caption", host: "api.imgcaption.x402", category: "ai", pricePerCallUsd: 0.01, valueScore: 30, maxCallsPerDay: 50 },
  { name: "Translate", host: "api.translate.x402", category: "ai", pricePerCallUsd: 0.002, valueScore: 26, maxCallsPerDay: 200 },
  { name: "OCR / Document", host: "api.ocr.x402", category: "ai", pricePerCallUsd: 0.012, valueScore: 34, maxCallsPerDay: 40 },

  // --- social & signals ---
  { name: "Social Trends", host: "api.socialtrends.x402", category: "social", pricePerCallUsd: 0.004, valueScore: 24, maxCallsPerDay: 120 },
  { name: "Sentiment", host: "api.sentiment.x402", category: "social", pricePerCallUsd: 0.0015, valueScore: 20, maxCallsPerDay: 200 },
  { name: "Prediction Markets", host: "api.predmarkets.x402", category: "social", pricePerCallUsd: 0.003, valueScore: 29, maxCallsPerDay: 100 },

  // --- geo / weather ---
  { name: "Weather", host: "api.weather.x402", category: "geo", pricePerCallUsd: 0.0006, valueScore: 16, maxCallsPerDay: 300 },
  { name: "Geocoding", host: "api.geocode.x402", category: "geo", pricePerCallUsd: 0.0005, valueScore: 14, maxCallsPerDay: 300 },
  { name: "Routing / Maps", host: "api.routing.x402", category: "geo", pricePerCallUsd: 0.002, valueScore: 21, maxCallsPerDay: 120 },

  // --- comms / utility ---
  { name: "Send SMS", host: "api.sms.x402", category: "comms", pricePerCallUsd: 0.015, valueScore: 27, maxCallsPerDay: 30 },
  { name: "Send Email", host: "api.email.x402", category: "comms", pricePerCallUsd: 0.001, valueScore: 17, maxCallsPerDay: 100 },
  { name: "Sports Scores", host: "api.sports.x402", category: "data", pricePerCallUsd: 0.0007, valueScore: 15, maxCallsPerDay: 200 },
  { name: "Company Filings", host: "api.filings.x402", category: "data", pricePerCallUsd: 0.009, valueScore: 31, maxCallsPerDay: 40 },
];
