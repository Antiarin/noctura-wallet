import { z } from "zod";

const appleSchema = z.object({
  PASSKIT_API_KEY: z.string().min(1),
  PASSKIT_API_SECRET: z.string().min(1),
  PASSKIT_TEMPLATE_ID: z.string().min(1),
});

const googleSchema = z.object({
  GOOGLE_WALLET_SERVICE_ACCOUNT_KEY: z.string().min(1),
  GOOGLE_WALLET_ISSUER_ID: z.string().min(1),
  GOOGLE_WALLET_CLASS_ID: z.string().min(1),
});

export type AppleConfig = z.infer<typeof appleSchema>;
export type GoogleConfig = z.infer<typeof googleSchema> & {
  serviceAccount: {
    client_email: string;
    private_key: string;
  };
};

type Result<T> =
  | { ok: true; value: T }
  | { ok: false; missing: string[]; reason?: string };

export function readAppleConfig(): Result<AppleConfig> {
  const parsed = appleSchema.safeParse({
    PASSKIT_API_KEY: process.env.PASSKIT_API_KEY,
    PASSKIT_API_SECRET: process.env.PASSKIT_API_SECRET,
    PASSKIT_TEMPLATE_ID: process.env.PASSKIT_TEMPLATE_ID,
  });

  if (!parsed.success) {
    const missing = parsed.error.issues.map((issue) => String(issue.path[0]));
    return { ok: false, missing };
  }

  return { ok: true, value: parsed.data };
}

export function readGoogleConfig(): Result<GoogleConfig> {
  const parsed = googleSchema.safeParse({
    GOOGLE_WALLET_SERVICE_ACCOUNT_KEY:
      process.env.GOOGLE_WALLET_SERVICE_ACCOUNT_KEY,
    GOOGLE_WALLET_ISSUER_ID: process.env.GOOGLE_WALLET_ISSUER_ID,
    GOOGLE_WALLET_CLASS_ID: process.env.GOOGLE_WALLET_CLASS_ID,
  });

  if (!parsed.success) {
    const missing = parsed.error.issues.map((issue) => String(issue.path[0]));
    return { ok: false, missing };
  }

  let serviceAccount: GoogleConfig["serviceAccount"];
  try {
    const raw = JSON.parse(parsed.data.GOOGLE_WALLET_SERVICE_ACCOUNT_KEY);
    if (!raw.client_email || !raw.private_key) {
      return {
        ok: false,
        missing: ["GOOGLE_WALLET_SERVICE_ACCOUNT_KEY"],
        reason: "JSON is missing client_email or private_key",
      };
    }
    serviceAccount = {
      client_email: raw.client_email,
      private_key: String(raw.private_key).replace(/\\n/g, "\n"),
    };
  } catch {
    return {
      ok: false,
      missing: ["GOOGLE_WALLET_SERVICE_ACCOUNT_KEY"],
      reason: "not valid JSON",
    };
  }

  return { ok: true, value: { ...parsed.data, serviceAccount } };
}

export function appOrigin(): string {
  return process.env.NEXT_PUBLIC_APP_ORIGIN ?? "http://localhost:3000";
}
