import { NextResponse } from "next/server";
import { updatePassInputSchema } from "@/lib/pass-schema";
import { updateTicketStatus } from "@/lib/passkit";
import { updateObjectStatus } from "@/lib/google-wallet";
import { readAppleConfig, readGoogleConfig } from "@/lib/env";
import { errorResponse } from "@/lib/api-handler";
import { ValidationError, isKnownError } from "@/lib/errors";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 15;

type ProviderResult =
  | { status: "ok"; via?: "passkit" | "google_wallet_api" }
  | { status: "skipped"; reason?: string }
  | { status: "error"; code: string; message: string };

export async function POST(request: Request) {
  try {
    const json = await request.json().catch(() => null);
    const parsed = updatePassInputSchema.safeParse(json);
    if (!parsed.success) {
      throw new ValidationError("Invalid update input", parsed.error.issues);
    }

    const { status, appleTicketId, googleObjectId } = parsed.data;
    const googleApiConfigured = readGoogleConfig().ok;
    const passkitConfigured = readAppleConfig().ok;

    const appleOutcome = await runProvider(appleTicketId, () =>
      updateTicketStatus(appleTicketId!, status),
    );

    let googleOutcome: ProviderResult;
    if (!googleObjectId) {
      googleOutcome = { status: "skipped" };
    } else if (googleApiConfigured) {
      googleOutcome = await runProvider(googleObjectId, () =>
        updateObjectStatus(googleObjectId, status),
      );
      if (googleOutcome.status === "ok") {
        googleOutcome = { status: "ok", via: "google_wallet_api" };
      }
    } else if (passkitConfigured) {
      // PassKit's update on the same ticket ID propagates to the Google Wallet
      // object too, so the Apple-side update above already handled Google.
      googleOutcome = { status: "ok", via: "passkit" };
    } else {
      googleOutcome = { status: "skipped", reason: "not_configured" };
    }

    return NextResponse.json({
      apple: appleOutcome,
      google: googleOutcome,
    });
  } catch (err) {
    return errorResponse(err);
  }
}

async function runProvider(
  id: string | undefined,
  fn: () => Promise<void>,
): Promise<ProviderResult> {
  if (!id) return { status: "skipped" };
  try {
    await fn();
    return { status: "ok" };
  } catch (err) {
    if (isKnownError(err)) {
      return {
        status: "error",
        code: err.kind,
        message: err.message,
      };
    }
    return {
      status: "error",
      code: "unknown",
      message: err instanceof Error ? err.message : "Unknown error",
    };
  }
}
