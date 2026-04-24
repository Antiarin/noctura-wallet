import jwt from "jsonwebtoken";
import { GoogleAuth } from "google-auth-library";
import { appOrigin, readGoogleConfig } from "./env";
import { ConfigError, GoogleWalletError } from "./errors";
import { EVENT, TIERS, TICKET_STATUS, type TicketStatus } from "./brand";
import type { AttendeeInput } from "./pass-schema";

const SCOPES = ["https://www.googleapis.com/auth/wallet_object.issuer"];
const API_BASE = "https://walletobjects.googleapis.com/walletobjects/v1";

type EventTicketObject = {
  id: string;
  classId: string;
  state: "ACTIVE" | "EXPIRED" | "COMPLETED" | "INACTIVE";
  heroImage?: { sourceUri: { uri: string } };
  ticketHolderName: string;
  ticketNumber: string;
  ticketType: { defaultValue: { language: string; value: string } };
  barcode: { type: "QR_CODE"; value: string; alternateText: string };
  textModulesData?: Array<{
    id: string;
    header: string;
    body: string;
  }>;
};

function slugify(s: string): string {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 40);
}

async function authedClient() {
  const cfg = readGoogleConfig();
  if (!cfg.ok) throw new ConfigError(cfg.missing);

  const auth = new GoogleAuth({
    credentials: {
      client_email: cfg.value.serviceAccount.client_email,
      private_key: cfg.value.serviceAccount.private_key,
    },
    scopes: SCOPES,
  });

  return { auth, cfg: cfg.value };
}

async function walletFetch<T>(
  path: string,
  init: { method: string; body?: unknown },
): Promise<T> {
  const { auth } = await authedClient();
  const client = await auth.getClient();
  const tokenInfo = await client.getAccessToken();
  const token = tokenInfo.token;
  if (!token) throw new GoogleWalletError("Failed to acquire access token");

  const res = await fetch(`${API_BASE}${path}`, {
    method: init.method,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
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
    throw new GoogleWalletError(
      `Google Wallet ${res.status} on ${init.method} ${path}`,
      res.status,
      parsed,
    );
  }
  return parsed as T;
}

/**
 * Creates (or upserts) an EventTicketObject on the Google Wallet side with the
 * user's name baked in, then signs a small JWT that references it by ID.
 * The small reference-only JWT stays well under Google's 1800-char safe limit.
 */
export async function createSaveUrl(
  input: AttendeeInput,
): Promise<{ saveUrl: string; objectId: string }> {
  const cfg = readGoogleConfig();
  if (!cfg.ok) throw new ConfigError(cfg.missing);

  const { serviceAccount, GOOGLE_WALLET_ISSUER_ID, GOOGLE_WALLET_CLASS_ID } =
    cfg.value;

  const tier = TIERS[input.tier];
  const ticketNumber = `NCT-${Date.now().toString(36).toUpperCase()}-${Math.random()
    .toString(36)
    .slice(2, 6)
    .toUpperCase()}`;

  const objectSuffix = `${slugify(input.name)}-${ticketNumber.toLowerCase()}`;
  const objectId = `${GOOGLE_WALLET_ISSUER_ID}.${objectSuffix}`;

  const eventTicketObject: EventTicketObject = {
    id: objectId,
    classId: GOOGLE_WALLET_CLASS_ID,
    state: "ACTIVE",
    ticketHolderName: input.name,
    ticketNumber,
    ticketType: {
      defaultValue: { language: "en-US", value: tier.label },
    },
    barcode: {
      type: "QR_CODE",
      value: ticketNumber,
      alternateText: ticketNumber,
    },
    textModulesData: [
      {
        id: "status",
        header: "Status",
        body: TICKET_STATUS.Upcoming.label,
      },
      {
        id: "doors",
        header: "Doors",
        body: EVENT.doorsDisplay,
      },
    ],
  };

  // Upsert — create, ignore 409 (already exists).
  try {
    await walletFetch("/eventTicketObject", {
      method: "POST",
      body: eventTicketObject,
    });
  } catch (err) {
    if (!(err instanceof GoogleWalletError) || err.statusCode !== 409) {
      throw err;
    }
    // Already exists, proceed.
  }

  const claims = {
    iss: serviceAccount.client_email,
    aud: "google",
    typ: "savetowallet",
    iat: Math.floor(Date.now() / 1000),
    origins: [appOrigin()],
    payload: {
      eventTicketObjects: [{ id: objectId }],
    },
  };

  const signed = jwt.sign(claims, serviceAccount.private_key, {
    algorithm: "RS256",
  });

  return {
    saveUrl: `https://pay.google.com/gp/v/save/${signed}`,
    objectId,
  };
}

/**
 * Pushes a live update to a Google Wallet object. Google propagates the change
 * to the user's device automatically.
 */
export async function updateObjectStatus(
  objectId: string,
  status: TicketStatus,
): Promise<void> {
  const statusInfo = TICKET_STATUS[status];

  const patch = {
    textModulesData: [
      {
        id: "status",
        header: "Status",
        body: statusInfo.label,
      },
    ],
    state: status === "Ended" ? "EXPIRED" : "ACTIVE",
  };

  await walletFetch(`/eventTicketObject/${encodeURIComponent(objectId)}`, {
    method: "PATCH",
    body: patch,
  });
}

/**
 * One-time bootstrap: creates the Noctura event class on Google's side.
 * Intended to be called from scripts/bootstrap-google-class.ts, not from runtime.
 */
export async function bootstrapClass(classSuffix = "noctura-midnight-signal"): Promise<string> {
  const cfg = readGoogleConfig();
  if (!cfg.ok) throw new ConfigError(cfg.missing);

  const classId = `${cfg.value.GOOGLE_WALLET_ISSUER_ID}.${classSuffix}`;

  const body = {
    id: classId,
    issuerName: "Noctura",
    reviewStatus: "UNDER_REVIEW",
    eventName: {
      defaultValue: { language: "en-US", value: EVENT.title },
    },
    venue: {
      name: {
        defaultValue: { language: "en-US", value: EVENT.venue },
      },
      address: {
        defaultValue: { language: "en-US", value: EVENT.address },
      },
    },
    dateTime: { start: EVENT.dateISO },
    hexBackgroundColor: "#0A0306",
  };

  try {
    await walletFetch("/eventTicketClass", { method: "POST", body });
  } catch (err) {
    if (!(err instanceof GoogleWalletError) || err.statusCode !== 409) {
      throw err;
    }
    // Already exists, ok.
  }

  return classId;
}
