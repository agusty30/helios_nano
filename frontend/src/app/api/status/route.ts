import { NextResponse } from "next/server";

const SELLER = "0x933a2405f84c224be1ef373ba16e992e1f459682";
const ARC_TESTNET_RPC =
  "https://rpc.testnet.arc-node.thecanteenapp.com/v1/swrm_3aa8a9334770e6eddb5cc05f2e3dbfe555eca270d4eb78fbb4b6056a4a04e2b0";

export async function GET() {
  return NextResponse.json({
    seller: SELLER,
    network: "eip155:5042002",
    chainId: 5042002,
    chainName: "Arc Testnet",
    rpc: ARC_TESTNET_RPC,
    prices: { nano: "$0.000001", helloWorld: "$0.01" },
    endpoints: ["/nano", "/hello-world"],
    explorer: "https://testnet.arcscan.app",
    time: new Date().toISOString(),
  });
}
