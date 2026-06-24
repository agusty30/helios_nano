/**
 * CLI for the autonomous Circle x402 agent.
 *
 * Commands:
 *   wallet               Print the agent's wallet address (creates one on first run).
 *   balances             Show wallet + Gateway USDC balances.
 *   discover <url>       Probe a URL for an x402 paywall (no payment).
 *   pay <url>            Discover price → guardrail check → pay via Gateway.
 *   search <keyword>     Search the Circle services marketplace.
 *   skills               List registered agent skills.
 *   skill <name> <json>  Run a skill with a JSON input argument.
 *   audit                Dump the audit ledger.
 *
 * Wallet key is persisted to AGENT_KEY_PATH (default ./agent/.agent-key).
 * Guardrails can be overridden with AGENT_MAX_PER_PAYMENT / _PER_HOUR / _PER_DAY.
 */
import { installDohResolver } from "./net.ts";
import { CircleAgent } from "./agent.ts";
import { runDoctor, formatDoctor } from "./doctor.ts";
import { buildConfigFromEnv } from "./env.ts";

installDohResolver();

const buildConfig = buildConfigFromEnv;

function buildAgent(): CircleAgent {
  return new CircleAgent(buildConfig());
}

function printJson(x: unknown) {
  console.log(JSON.stringify(x, null, 2));
}

async function main() {
  const [cmd, ...args] = process.argv.slice(2);
  const agent = buildAgent();

  switch (cmd) {
    case "doctor": {
      const result = await runDoctor(buildConfig());
      console.log(formatDoctor(result));
      if (!result.ready) process.exitCode = 1;
      break;
    }

    case "wallet":
      console.log(`agent address: ${agent.address}`);
      console.log(`fund it with testnet USDC: https://faucet.circle.com/`);
      break;

    case "balances": {
      const b = await agent.getBalances();
      console.log(`wallet USDC:           ${b.wallet.formatted}`);
      console.log(`gateway available:     ${b.gateway.formattedAvailable}`);
      console.log(`gateway total:         ${b.gateway.formattedTotal}`);
      break;
    }

    case "discover": {
      if (!args[0]) return fail("usage: discover <url>");
      printJson(await agent.discover(args[0]));
      break;
    }

    case "pay": {
      if (!args[0]) return fail("usage: pay <url> [category]");
      const outcome = await agent.pay(args[0], { category: args[1] });
      if (outcome.ok) {
        console.log(
          `✓ settled $${outcome.amountUsdc} on ${outcome.chain} in ${outcome.latencyMs}ms`,
        );
        console.log(`  settlement: ${outcome.settlementId}`);
        console.log(`  data:`, outcome.data);
      } else {
        console.log(`✗ not paid: ${outcome.reason}`);
      }
      break;
    }

    case "search": {
      if (!args[0]) return fail("usage: search <keyword>");
      printJson(agent.search(args[0]));
      break;
    }

    case "skills":
      printJson(agent.listSkills());
      break;

    case "skill": {
      if (!args[0]) return fail("usage: skill <name> <json-input>");
      const input = args[1] ? JSON.parse(args[1]) : {};
      printJson(await agent.runSkill(args[0], input));
      break;
    }

    case "audit":
      printJson(agent.auditLog());
      break;

    default:
      console.log(
        [
          "circle-agent — autonomous x402 payment agent",
          "",
          "commands:",
          "  doctor                 readiness check — is the agent ready to go live?",
          "  wallet                 show the agent's wallet address",
          "  balances               wallet + Gateway USDC balances",
          "  discover <url>         probe a URL for an x402 paywall",
          "  pay <url> [category]   discover → guardrail → pay via Gateway",
          "  search <keyword>       search the Circle services marketplace",
          "  skills                 list agent skills",
          "  skill <name> <json>    run a skill",
          "  audit                  dump the audit ledger",
        ].join("\n"),
      );
  }
}

function fail(msg: string) {
  console.error(msg);
  process.exitCode = 1;
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
