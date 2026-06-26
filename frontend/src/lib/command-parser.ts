export interface TaskCommand {
  type: string;
  params: Record<string, string>;
  raw: string;
}

const PATTERNS: Array<{ regex: RegExp; type: string; extract: (m: RegExpMatchArray) => Record<string, string> }> = [
  {
    regex: /^(?:add|configure|setup?)\s+(\w[\w\s]*?)\s*(?:api|key)$/i,
    type: "add_api",
    extract: (m) => ({ name: m[1].trim() }),
  },
  {
    regex: /^(?:store|save|set)\s+(?:api\s+)?key\s+(?:for\s+)?(\w+)\s*[:=]?\s*(.+)$/i,
    type: "store_key",
    extract: (m) => ({ provider: m[1], key: m[2].trim() }),
  },
  {
    regex: /^(?:allocate|set)\s+budget\s+(?:to\s+)?\$?([\d.]+)/i,
    type: "allocate_budget",
    extract: (m) => ({ amount: m[1] }),
  },
  {
    regex: /^(?:optimize|rebalance)\s+(?:costs?|budget|spending)/i,
    type: "optimize_costs",
    extract: () => ({}),
  },
  {
    regex: /^(?:run|execute)\s+tests?$/i,
    type: "run_test",
    extract: () => ({}),
  },
  {
    regex: /^(?:check|show|get)\s+(?:system\s+)?status$/i,
    type: "check_status",
    extract: () => ({}),
  },
  {
    regex: /^(?:add|create)\s+wallet\s+(.+)$/i,
    type: "add_wallet",
    extract: (m) => ({ label: m[1].trim() }),
  },
  {
    regex: /^(?:add|invite)\s+(?:team\s+)?member\s+(.+)$/i,
    type: "add_member",
    extract: (m) => ({ info: m[1].trim() }),
  },
];

export function parseCommand(input: string): TaskCommand {
  const trimmed = input.trim();

  for (const pattern of PATTERNS) {
    const match = trimmed.match(pattern.regex);
    if (match) {
      return { type: pattern.type, params: pattern.extract(match), raw: trimmed };
    }
  }

  return { type: "general", params: {}, raw: trimmed };
}
