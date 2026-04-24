"use client";

import { useState } from "react";
import { TICKET_STATUS, type TicketStatus } from "@/lib/brand";

type Props = {
  appleTicketId?: string;
  googleObjectId?: string;
  onStatusChange: (status: TicketStatus) => void;
};

type Outcome = {
  apple?: { status: string; code?: string; message?: string };
  google?: { status: string; code?: string; message?: string };
};

export function AdminControls({
  appleTicketId,
  googleObjectId,
  onStatusChange,
}: Props) {
  const [pending, setPending] = useState<TicketStatus | null>(null);
  const [outcome, setOutcome] = useState<Outcome | null>(null);

  async function pushStatus(status: TicketStatus) {
    setPending(status);
    setOutcome(null);
    onStatusChange(status);
    try {
      const res = await fetch("/api/update-pass", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status, appleTicketId, googleObjectId }),
      });
      const json = (await res.json().catch(() => null)) as Outcome | null;
      setOutcome(json);
    } catch (e) {
      setOutcome({
        apple: { status: "error", message: e instanceof Error ? e.message : "failed" },
      });
    } finally {
      setPending(null);
    }
  }

  const statuses = Object.keys(TICKET_STATUS) as TicketStatus[];
  const hasAnyPass = Boolean(appleTicketId || googleObjectId);

  return (
    <div className="rounded-xl border border-dashed border-noctura-border bg-noctura-surface/50 p-4">
      <div className="flex items-center gap-2 mb-3">
        <span className="size-1.5 rounded-full bg-noctura-accent animate-pulse" />
        <p className="text-[10px] tracking-[0.3em] font-mono text-noctura-accent">
          DEMO ADMIN · STATUS PUSH
        </p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {statuses.map((s) => {
          const info = TICKET_STATUS[s];
          const isPending = pending === s;
          return (
            <button
              key={s}
              type="button"
              onClick={() => pushStatus(s)}
              disabled={pending !== null}
              className="text-left rounded-lg px-3 py-2.5 bg-noctura-surface border border-noctura-border hover:border-noctura-accent transition text-xs disabled:opacity-50"
            >
              <div className="flex items-center gap-2">
                <span
                  className="size-1.5 rounded-full"
                  style={{ backgroundColor: info.color }}
                />
                <span className="font-semibold">{info.label}</span>
              </div>
              {isPending && (
                <p className="text-[9px] text-noctura-ink-muted mt-1 font-mono">
                  PUSHING…
                </p>
              )}
            </button>
          );
        })}
      </div>

      {!hasAnyPass && (
        <p className="text-[11px] text-noctura-ink-muted mt-3">
          Generate a pass first, then push updates to it here.
        </p>
      )}

      {outcome && (
        <div className="mt-3 grid grid-cols-2 gap-2 text-[11px] font-mono">
          <ProviderOutcome label="apple" result={outcome.apple} />
          <ProviderOutcome label="google" result={outcome.google} />
        </div>
      )}
    </div>
  );
}

function ProviderOutcome({
  label,
  result,
}: {
  label: string;
  result?: { status: string; message?: string };
}) {
  if (!result) return null;
  const color =
    result.status === "ok"
      ? "text-green-400"
      : result.status === "skipped"
        ? "text-noctura-ink-muted"
        : "text-red-400";
  return (
    <div className="rounded bg-noctura-bg/50 px-2 py-1.5">
      <span className="text-noctura-ink-muted">{label}:</span>{" "}
      <span className={color}>{result.status}</span>
      {result.message && result.status === "error" && (
        <p className="text-red-400/70 mt-0.5 truncate">{result.message}</p>
      )}
    </div>
  );
}
