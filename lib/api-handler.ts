import { NextResponse } from "next/server";
import {
  ConfigError,
  GoogleWalletError,
  PassKitError,
  ValidationError,
  isKnownError,
} from "./errors";

type ErrorBody = {
  error: string;
  code: string;
  details?: unknown;
};

export function errorResponse(err: unknown): NextResponse<ErrorBody> {
  if (err instanceof ValidationError) {
    return NextResponse.json(
      { error: err.message, code: "validation_error", details: err.details },
      { status: 400 },
    );
  }
  if (err instanceof ConfigError) {
    return NextResponse.json(
      {
        error: "Provider not configured",
        code: "not_configured",
        details: { missing: err.missing },
      },
      { status: 503 },
    );
  }
  if (err instanceof PassKitError) {
    return NextResponse.json(
      {
        error: err.message,
        code: "passkit_error",
        details: err.providerResponse,
      },
      { status: 502 },
    );
  }
  if (err instanceof GoogleWalletError) {
    return NextResponse.json(
      {
        error: err.message,
        code: "google_wallet_error",
        details: err.providerResponse,
      },
      { status: 502 },
    );
  }

  const message = err instanceof Error ? err.message : "Unexpected error";
  // eslint-disable-next-line no-console
  console.error("Unhandled route error:", err);
  return NextResponse.json(
    { error: message, code: "internal_error" },
    { status: 500 },
  );
}

export { isKnownError };
