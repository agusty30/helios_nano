export interface TaskCommand {
  type: string;
  params: Record<string, string>;
  raw: string;
}

const PATTERNS: Array<{ regex: RegExp; type: string; extract: (m: RegExpMatchArray) => Record<string, string> }> = [
  {
    regex: /^(?:insert|record|log)\s+(?:today'?s?\s+)?(.+?)\s+(?:api\s+)?(?:cost|usage|spend)\s*[:=]?\s*\$?([\d.]+)/i,
    type: "record_api_cost",
    extract: (m) => ({ provider: m[1].trim(), cost: m[2] }),
  },
  {
    regex: /^(?:create|add)\s+vendor\s+(.+)/i,
    type: "create_vendor",
    extract: (m) => ({ name: m[1].trim() }),
  },
  {
    regex: /^(?:create|add)\s+(?:api\s+)?service\s+(.+?)\s+(?:on|from|for|provider)\s+(.+)/i,
    type: "create_api_service",
    extract: (m) => ({ name: m[1].trim(), provider: m[2].trim() }),
  },
  {
    regex: /^(?:show|list|get)\s+(?:api\s+)?(?:costs?|spend|usage)(?:\s+(?:for|last)\s+(\d+)\s*d(?:ays?)?)?$/i,
    type: "show_api_costs",
    extract: (m) => ({ days: m[1] || "30" }),
  },
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
    regex: /^(?:show|list|get)\s+agents?(?:\s+status)?$/i,
    type: "list_agents",
    extract: () => ({}),
  },
  {
    regex: /^(?:show|list|get)\s+(?:all\s+)?vendors?$/i,
    type: "list_vendors",
    extract: () => ({}),
  },
  {
    regex: /^(?:show|list|get)\s+(?:all\s+)?(?:api\s+)?services?$/i,
    type: "list_services",
    extract: () => ({}),
  },
  {
    regex: /^(?:show|list|get)\s+(?:all\s+)?wallets?$/i,
    type: "list_wallets",
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
  {
    regex: /^(?:generate|create|run)\s+report\s*(?:for\s+)?(.*)$/i,
    type: "generate_report",
    extract: (m) => ({ type: m[1].trim() || "summary" }),
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
