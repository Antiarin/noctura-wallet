import { NextResponse } from "next/server";
import { attendeeInputSchema } from "@/lib/pass-schema";
import { createTicket } from "@/lib/passkit";
import { createSaveUrl } from "@/lib/google-wallet";
import { readGoogleConfig } from "@/lib/env";
import { errorResponse } from "@/lib/api-handler";
import { ValidationError } from "@/lib/errors";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 15;

export async function POST(request: Request) {
  try {
    const json = await request.json().catch(() => null);
    const parsed = attendeeInputSchema.safeParse(json);
    if (!parsed.success) {
      throw new ValidationError("Invalid attendee input", parsed.error.issues);
    }

    // Prefer direct Google Wallet API if configured, else fall back to PassKit's
    // short URL which serves the correct Google Wallet save link on Android UAs.
    if (readGoogleConfig().ok) {
      return NextResponse.json(await createSaveUrl(parsed.data));
    }

    const { ticketId, walletUrl } = await createTicket(parsed.data);
    return NextResponse.json({ saveUrl: walletUrl, objectId: ticketId });
  } catch (err) {
    return errorResponse(err);
  }
}
