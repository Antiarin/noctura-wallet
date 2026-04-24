import { NextResponse } from "next/server";
import { readAppleConfig, readGoogleConfig } from "@/lib/env";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type ProviderStatus =
  | { status: "ready"; via?: "passkit" | "google_wallet_api" }
  | { status: "not_configured"; missing: string[]; reason?: string };

export async function GET() {
  const apple = readAppleConfig();
  const google = readGoogleConfig();

  const appleStatus: ProviderStatus = apple.ok
    ? { status: "ready", via: "passkit" }
    : { status: "not_configured", missing: apple.missing };

  let googleStatus: ProviderStatus;
  if (google.ok) {
    googleStatus = { status: "ready", via: "google_wallet_api" };
  } else if (apple.ok) {
    googleStatus = { status: "ready", via: "passkit" };
  } else {
    googleStatus = {
      status: "not_configured",
      missing: google.missing,
      ...(google.reason ? { reason: google.reason } : {}),
    };
  }

  return NextResponse.json({
    name: "noctura-wallet",
    version: "0.1.0",
    providers: {
      apple: appleStatus,
      google: googleStatus,
    },
    timestamp: new Date().toISOString(),
  });
}
