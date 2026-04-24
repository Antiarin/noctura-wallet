import { createHash } from "node:crypto";
import jwt from "jsonwebtoken";
import { readAppleConfig } from "./env";
import { PassKitError, ConfigError } from "./errors";
import { EVENT, TIERS, type TicketStatus } from "./brand";
import type { AttendeeInput } from "./pass-schema";

const PASSKIT_REGION = process.env.PASSKIT_API_REGION ?? "pub1";
const PASSKIT_API_BASE = `https://api.${PASSKIT_REGION}.passkit.io`;
const PASSKIT_SHORT_BASE = `https://${PASSKIT_REGION}.pskt.io`;

// The `signature` claim binds the JWT to this specific body, so tokens can't be
// replayed with a mutated payload. Docs: https://help.passkit.com/en/articles/4225662
function signAuthJwt(
  keyId: string,
  apiSecret: string,
  method: string,
  url: string,
  body: unknown,
): string {
  const now = Math.floor(Date.now() / 1000);
  const payload: Record<string, string | number> = {
    uid: keyId,
    iat: now,
    exp: now + 30,
    url,
    method: method.toUpperCase(),
  };
  if (body !== undefined) {
    payload.signature = createHash("sha256")
      .update(JSON.stringify(body))
      .digest("hex");
  }
  return jwt.sign(payload, apiSecret, { algorithm: "HS256" });
}

type PassKitRequestInit = Omit<RequestInit, "headers" | "body"> & {
  body?: unknown;
};

async function passkitFetch<T>(
  path: string,
  init: PassKitRequestInit,
): Promise<T> {
  const cfg = readAppleConfig();
  if (!cfg.ok) throw new ConfigError(cfg.missing);

  const method = init.method ?? "GET";
  const fullUrl = `${PASSKIT_API_BASE}${path}`;
  const token = signAuthJwt(
    cfg.value.PASSKIT_API_KEY,
    cfg.value.PASSKIT_API_SECRET,
    method,
    fullUrl,
    init.body,
  );

  const res = await fetch(fullUrl, {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: init.body === undefined ? undefined : JSON.stringify(init.body),
    cache: "no-store",
  });

  const text = await res.text();
  let parsed: unknown;
  try {
    parsed = text ? JSON.parse(text) : null;
  } catch {
    parsed = text;
  }

  if (!res.ok) {
    throw new PassKitError(
      `PassKit ${res.status} on ${method} ${path}`,
      res.status,
      parsed,
    );
  }

  return parsed as T;
}

type PassKitTicketResponse = {
  id?: string;
  ticketId?: string;
};

// walletUrl uses PassKit's short domain, which serves the correct wallet format
// based on User-Agent (iOS → .pkpass, Android → Google Wallet save link).
export async function createTicket(
  input: AttendeeInput,
): Promise<{ ticketId: string; walletUrl: string }> {
  const cfg = readAppleConfig();
  if (!cfg.ok) throw new ConfigError(cfg.missing);

  const tierInfo = TIERS[input.tier];

  const ticketNumber = `NCT-${Date.now().toString(36).toUpperCase()}-${Math.random()
    .toString(36)
    .slice(2, 6)
    .toUpperCase()}`;

  const body = {
    passTemplateId: cfg.value.PASSKIT_TEMPLATE_ID,
    ticketTypeId: cfg.value.PASSKIT_TICKET_TYPE_ID,
    ticketNumber,
    person: { displayName: input.name },
    event: {
      productionId: cfg.value.PASSKIT_PRODUCTION_ID,
      venueId: cfg.value.PASSKIT_VENUE_ID,
      scheduledStartDate: EVENT.dateISO,
    },
    metaData: {
      tier: input.tier,
      type: tierInfo.label,
      status: "Upcoming" satisfies TicketStatus,
    },
  };

  const res = await passkitFetch<PassKitTicketResponse>(
    "/eventTickets/ticket",
    { method: "POST", body },
  );

  const ticketId = res.id ?? res.ticketId;
  if (!ticketId) {
    throw new PassKitError("PassKit response missing ticket ID", 200, res);
  }

  return {
    ticketId,
    walletUrl: `${PASSKIT_SHORT_BASE}/${ticketId}`,
  };
}

// Relies on the "status" field being flagged push-enabled in the PassKit template,
// otherwise the update is stored but never reaches the device.
export async function updateTicketStatus(
  ticketId: string,
  status: TicketStatus,
): Promise<void> {
  await passkitFetch<unknown>("/eventTickets/ticket", {
    method: "PUT",
    body: {
      id: ticketId,
      metaData: { status },
    },
  });
}
