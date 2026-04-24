"use client";

import Image from "next/image";
import { useState } from "react";
import type { TicketTier } from "@/lib/brand";

type GeneratedPass = {
  apple?: { ticketId: string; walletUrl: string };
  google?: { objectId: string; saveUrl: string };
};

type Props = {
  name: string;
  tier: TicketTier;
  onGenerated: (next: GeneratedPass) => void;
};

type LoadingState = "idle" | "apple" | "google";

type ErrorInfo = {
  provider: "apple" | "google";
  code: string;
  message: string;
};

export function WalletButtons({ name, tier, onGenerated }: Props) {
  const [loading, setLoading] = useState<LoadingState>("idle");
  const [error, setError] = useState<ErrorInfo | null>(null);

  const disabled = !name.trim() || loading !== "idle";

  async function handle(provider: "apple" | "google") {
    setError(null);
    setLoading(provider);
    try {
      const res = await fetch(
        provider === "apple"
          ? "/api/generate-apple-pass"
          : "/api/generate-google-pass",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: name.trim(), tier }),
        },
      );

      const json = (await res.json().catch(() => null)) as {
        error?: string;
        code?: string;
        ticketId?: string;
        walletUrl?: string;
        objectId?: string;
        saveUrl?: string;
      } | null;

      if (!res.ok || !json) {
        setError({
          provider,
          code: json?.code ?? "unknown",
          message:
            json?.error ??
            (json?.code === "not_configured"
              ? `${provider === "apple" ? "Apple Wallet" : "Google Wallet"} isn't configured yet.`
              : "Something went wrong."),
        });
        return;
      }

      if (provider === "apple" && json.ticketId && json.walletUrl) {
        onGenerated({
          apple: { ticketId: json.ticketId, walletUrl: json.walletUrl },
        });
        window.open(json.walletUrl, "_blank", "noopener");
      } else if (provider === "google" && json.objectId && json.saveUrl) {
        onGenerated({
          google: { objectId: json.objectId, saveUrl: json.saveUrl },
        });
        window.open(json.saveUrl, "_blank", "noopener");
      }
    } catch (e) {
      setError({
        provider,
        code: "network_error",
        message: e instanceof Error ? e.message : "Network error",
      });
    } finally {
      setLoading("idle");
    }
  }

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <WalletBadgeButton
          provider="apple"
          src="/apple-wallet-badge.svg"
          alt="Add to Apple Wallet"
          width={165}
          height={51}
          loading={loading === "apple"}
          disabled={disabled}
          onClick={() => handle("apple")}
        />
        <WalletBadgeButton
          provider="google"
          src="/google-wallet-badge.svg"
          alt="Save to Google Wallet"
          width={272}
          height={48}
          loading={loading === "google"}
          disabled={disabled}
          onClick={() => handle("google")}
        />
      </div>

      {error && (
        <div className="rounded-lg border border-red-900/60 bg-red-950/30 px-4 py-3 text-sm">
          <p className="text-red-300">
            <span className="font-semibold capitalize">{error.provider}:</span>{" "}
            {error.message}
          </p>
          {error.code === "not_configured" && (
            <p className="mt-1 text-xs text-red-300/70">
              Add the provider&apos;s env vars in{" "}
              <code className="font-mono">.env.local</code> or Vercel and retry.
            </p>
          )}
        </div>
      )}
    </div>
  );
}

type BadgeButtonProps = {
  provider: "apple" | "google";
  src: string;
  alt: string;
  width: number;
  height: number;
  loading: boolean;
  disabled: boolean;
  onClick: () => void;
};

function WalletBadgeButton({
  src,
  alt,
  width,
  height,
  loading,
  disabled,
  onClick,
}: BadgeButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={alt}
      aria-busy={loading}
      className={[
        "relative flex h-14 items-center justify-center rounded-xl",
        "border-noctura-border-strong border bg-black px-4",
        "hover:border-noctura-accent transition",
        "disabled:cursor-not-allowed disabled:opacity-40",
        "focus-visible:ring-noctura-accent focus-visible:ring-2 focus-visible:outline-none",
      ].join(" ")}
    >
      <Image
        src={src}
        alt={alt}
        width={width}
        height={height}
        priority
        className="max-h-10 w-auto select-none"
      />
      {loading && (
        <span
          aria-hidden="true"
          className="text-noctura-ink absolute inset-0 flex items-center justify-center rounded-xl bg-black/70 font-mono text-[10px] tracking-[0.3em]"
        >
          GENERATING…
        </span>
      )}
    </button>
  );
}
