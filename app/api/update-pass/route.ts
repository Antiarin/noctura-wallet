import { NextResponse } from "next/server";
import { updatePassInputSchema } from "@/lib/pass-schema";
import { updateTicketStatus } from "@/lib/passkit";
import { updateObjectStatus } from "@/lib/google-wallet";
import { errorResponse } from "@/lib/api-handler";
import { ValidationError, isKnownError } from "@/lib/errors";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type ProviderResult =
  | { status: "ok" }
  | { status: "skipped" }
  | { status: "error"; code: string; message: string };

export async function POST(request: Request) {
  try {
    const json = await request.json().catch(() => null);
    const parsed = updatePassInputSchema.safeParse(json);
    if (!parsed.success) {
      throw new ValidationError("Invalid update input", parsed.error.issues);
    }

    const { status, appleTicketId, googleObjectId } = parsed.data;

    const [appleOutcome, googleOutcome] = await Promise.all([
      runProvider(appleTicketId, () => updateTicketStatus(appleTicketId!, status)),
      runProvider(googleObjectId, () => updateObjectStatus(googleObjectId!, status)),
    ]);

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
