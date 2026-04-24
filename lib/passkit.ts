import { createHash } from "node:crypto";
import jwt from "jsonwebtoken";
import { readAppleConfig } from "./env";
import { PassKitError, ConfigError } from "./errors";
import { EVENT, TIERS, type TicketStatus } from "./brand";
import type { AttendeeInput } from "./pass-schema";

const PASSKIT_API_BASE = "https://api.pub1.passkit.io";
const PASSKIT_SHORT_BASE = "https://pub1.pskt.io";

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
    key: keyId,
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
      Authorization: `PKAuth ${token}`,
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

  const body = {
    passTemplate: { id: cfg.value.PASSKIT_TEMPLATE_ID },
    person: { displayName: input.name },
    ticketType: {
      uid: input.tier.toLowerCase(),
      name: tierInfo.label,
    },
    event: {
      scheduledStartDate: EVENT.dateISO,
      venue: { name: EVENT.venue, address: EVENT.address },
    },
    metaData: {
      tier: input.tier,
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
  await passkitFetch<unknown>(`/eventTickets/ticket/${ticketId}`, {
    method: "PUT",
    body: {
      metaData: { status },
    },
  });
}
