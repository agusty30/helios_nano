/**
 * DNS-over-HTTPS resolver — bypasses ISP DNS hijacking.
 *
 * Some networks (e.g. ISP-level content filters such as Indonesia's
 * "Internet Sehat") hijack plaintext DNS for `*.circle.com`, pointing it at a
 * filter box that serves a bogus TLS cert and a 302 to a block page. Node's
 * global `fetch` then fails closed with "fetch failed", so the agent can't
 * reach Circle's Gateway API even though the real endpoint (behind Cloudflare)
 * is perfectly reachable by IP.
 *
 * Fix: resolve the affected hostnames over DoH (HTTPS to a public resolver,
 * which the hijack can't tamper with) and connect to the real IP while keeping
 * the original hostname as the TLS SNI. We install this as the global undici
 * dispatcher, so it transparently covers every `fetch` in the process —
 * including `GatewayClient.pay()`, balances, the server middleware, and doctor.
 *
 * Scope is limited to hosts matching `HIJACK_SUSPECTS`; everything else uses
 * the normal system resolver. Enabled by default; disable with
 * `AGENT_DOH=0`. Override the resolver with `AGENT_DOH_URL`.
 */
import { Agent, setGlobalDispatcher } from "undici";
import { lookup as dnsLookup } from "node:dns";

/** Hostnames we route through DoH (the ones ISPs tend to hijack here). */
const HIJACK_SUSPECTS = [/(^|\.)circle\.com$/i];

const DOH_URLS = [
  process.env.AGENT_DOH_URL ?? "https://cloudflare-dns.com/dns-query",
  "https://dns.google/resolve",
];

interface CacheEntry {
  ips: string[];
  expires: number;
}
const cache = new Map<string, CacheEntry>();

function isSuspect(host: string): boolean {
  return HIJACK_SUSPECTS.some((re) => re.test(host));
}

/** Query a DoH endpoint (RFC 8484 JSON form) for A records. */
async function dohResolve(host: string): Promise<string[]> {
  const cached = cache.get(host);
  if (cached && cached.expires > Date.now()) return cached.ips;

  for (const base of DOH_URLS) {
    try {
      const url = `${base}?name=${encodeURIComponent(host)}&type=A`;
      const res = await fetch(url, {
        headers: { accept: "application/dns-json" },
      });
      if (!res.ok) continue;
      const json = (await res.json()) as {
        Answer?: { type: number; data: string; TTL?: number }[];
      };
      const ips = (json.Answer ?? [])
        .filter((a) => a.type === 1) // A records only
        .map((a) => a.data);
      if (ips.length > 0) {
        const ttl = Math.max(60, json.Answer?.[0]?.TTL ?? 300);
        cache.set(host, { ips, expires: Date.now() + ttl * 1000 });
        return ips;
      }
    } catch {
      // try next resolver
    }
  }
  return [];
}

/**
 * Install the DoH-aware global dispatcher. Idempotent and safe to call at the
 * top of any entrypoint. No-op when `AGENT_DOH=0`.
 */
let installed = false;
export function installDohResolver(): void {
  if (installed || process.env.AGENT_DOH === "0") return;
  installed = true;

  const agent = new Agent({
    connect: {
      // undici passes (hostname, options, callback) like dns.lookup.
      lookup(hostname, options, callback) {
        if (!isSuspect(hostname)) {
          return dnsLookup(hostname, options, callback as never);
        }
        dohResolve(hostname)
          .then((ips) => {
            if (ips.length === 0) {
              // Fall back to system DNS rather than hard-failing.
              return dnsLookup(hostname, options, callback as never);
            }
            if (options && (options as { all?: boolean }).all) {
              callback(
                null,
                ips.map((address) => ({ address, family: 4 })) as never,
                undefined as never,
              );
            } else {
              callback(null, ips[0] as never, 4 as never);
            }
          })
          .catch((err) => callback(err as NodeJS.ErrnoException, "" as never, 0 as never));
      },
    },
  });
  setGlobalDispatcher(agent);
}
