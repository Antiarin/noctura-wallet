#!/usr/bin/env tsx
// Usage: yarn bootstrap:google
// Creates the Noctura event ticket class once, prints its ID for .env.local.
// Requires GOOGLE_WALLET_SERVICE_ACCOUNT_KEY and GOOGLE_WALLET_ISSUER_ID.

import { config } from "dotenv";
import { bootstrapClass } from "../lib/google-wallet";

config({ path: ".env.local" });
config({ path: ".env" });

async function main() {
  // Satisfy env validation — we're creating the class this script will produce.
  if (!process.env.GOOGLE_WALLET_CLASS_ID) {
    process.env.GOOGLE_WALLET_CLASS_ID = "bootstrap-pending";
  }

  const classId = await bootstrapClass();
  console.log("\n✓ Event ticket class ready.");
  console.log(`\n  GOOGLE_WALLET_CLASS_ID=${classId}\n`);
  console.log("Paste that into .env.local (and into Vercel env).");
}

main().catch((err) => {
  console.error("Bootstrap failed:", err);
  process.exit(1);
});
