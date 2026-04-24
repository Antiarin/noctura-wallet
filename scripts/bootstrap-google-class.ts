#!/usr/bin/env tsx
/**
 * One-time bootstrap: creates the Noctura Midnight Signal event class in Google Wallet.
 *
 * Prereqs:
 *   - GOOGLE_WALLET_SERVICE_ACCOUNT_KEY set in .env.local (stringified JSON)
 *   - GOOGLE_WALLET_ISSUER_ID set in .env.local
 *
 * Usage:
 *   yarn bootstrap:google
 *
 * Prints the resulting class ID. Paste it into GOOGLE_WALLET_CLASS_ID.
 */

import { config } from "dotenv";
import { bootstrapClass } from "../lib/google-wallet";

config({ path: ".env.local" });
config({ path: ".env" });

async function main() {
  // We pass a dummy value for GOOGLE_WALLET_CLASS_ID so env validation passes —
  // we're creating the class here, so of course it doesn't exist yet.
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
