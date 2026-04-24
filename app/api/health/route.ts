import { NextResponse } from "next/server";
import { readAppleConfig, readGoogleConfig } from "@/lib/env";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type ProviderStatus =
  | { status: "ready" }
  | { status: "not_configured"; missing: string[]; reason?: string };

export async function GET() {
  const apple = readAppleConfig();
  const google = readGoogleConfig();

  const appleStatus: ProviderStatus = apple.ok
    ? { status: "ready" }
    : { status: "not_configured", missing: apple.missing };

  const googleStatus: ProviderStatus = google.ok
    ? { status: "ready" }
    : {
        status: "not_configured",
        missing: google.missing,
        ...(google.reason ? { reason: google.reason } : {}),
      };

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
