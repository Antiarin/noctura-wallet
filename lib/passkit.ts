import { createHash } from "node:crypto";
import jwt from "jsonwebtoken";
import { readAppleConfig } from "./env";
import { PassKitError, ConfigError } from "./errors";
import { EVENT, TIERS, type TicketStatus } from "./brand";
import type { AttendeeInput } from "./pass-schema";

const PASSKIT_API_BASE = "https://api.pub1.passkit.io";
const PASSKIT_SHORT_BASE = "https://pub1.pskt.io";

/**
 * Signs a per-request JWT for PassKit's REST API.
 * Docs: https://help.passkit.com/en/articles/4225662-authenticate-rest-requests-using-jwt
 * HS256 shared-secret with a body-bound signature claim so tokens can't be replayed
 * against a different endpoint or with a mutated body.
 */
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
      `PassKit ${res.status} on ${init.method ?? "GET"} ${path}`,
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

/**
 * Issues a new event ticket against the template configured in env.
 * Returns the PassKit short URL, which user-agent-detects and serves the correct wallet.
 */
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

/**
 * Updates a ticket's status field. PassKit pushes an APNs update automatically
 * when the template's relevant fields are marked for push.
 */
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
