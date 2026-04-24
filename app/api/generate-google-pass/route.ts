import { NextResponse } from "next/server";
import { attendeeInputSchema } from "@/lib/pass-schema";
import { createSaveUrl } from "@/lib/google-wallet";
import { errorResponse } from "@/lib/api-handler";
import { ValidationError } from "@/lib/errors";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const json = await request.json().catch(() => null);
    const parsed = attendeeInputSchema.safeParse(json);
    if (!parsed.success) {
      throw new ValidationError("Invalid attendee input", parsed.error.issues);
    }

    const result = await createSaveUrl(parsed.data);
    return NextResponse.json(result);
  } catch (err) {
    return errorResponse(err);
  }
}
