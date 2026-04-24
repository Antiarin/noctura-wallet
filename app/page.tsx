"use client";

import { useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { TicketPreview } from "@/components/TicketPreview";
import { AttendeeForm } from "@/components/AttendeeForm";
import { WalletButtons } from "@/components/WalletButtons";
import { AdminControls } from "@/components/AdminControls";
import { EVENT } from "@/lib/brand";
import type { TicketTier, TicketStatus } from "@/lib/brand";

type Generated = {
  apple?: { ticketId: string; walletUrl: string };
  google?: { objectId: string; saveUrl: string };
};

function UnwrapInner() {
  const searchParams = useSearchParams();
  const adminMode = searchParams.get("admin") === "1";

  const [name, setName] = useState("");
  const [tier, setTier] = useState<TicketTier>("GA");
  const [status, setStatus] = useState<TicketStatus>("Upcoming");
  const [generated, setGenerated] = useState<Generated>({});

  const ticketNumber = useMemo(
    () => generated.google?.objectId.split(".").pop()?.toUpperCase() ?? "NCT-PREVIEW",
    [generated.google?.objectId],
  );

  return (
    <main className="min-h-screen px-4 py-10 sm:py-16 flex flex-col items-center">
      <header className="text-center mb-10 max-w-xl">
        <p className="text-[10px] tracking-[0.4em] font-mono text-noctura-accent">
          {EVENT.subtitle}
        </p>
        <h1 className="text-4xl sm:text-5xl font-bold mt-3 tracking-tight text-balance">
          {EVENT.title}
        </h1>
        <p className="text-noctura-ink-muted mt-3 text-sm">
          {EVENT.dateDisplay} · {EVENT.venue}, {EVENT.city}
        </p>
        <p className="text-noctura-ink-muted/80 mt-2 text-xs font-mono tracking-wider">
          {EVENT.lineup.join(" · ")}
        </p>
      </header>

      <div className="w-full max-w-xl space-y-8">
        <TicketPreview
          name={name}
          tier={tier}
          status={status}
          ticketNumber={ticketNumber}
        />

        <div className="space-y-6">
          <AttendeeForm
            name={name}
            tier={tier}
            onNameChange={setName}
            onTierChange={setTier}
          />

          <WalletButtons
            name={name}
            tier={tier}
            onGenerated={(next) =>
              setGenerated((prev) => ({ ...prev, ...next }))
            }
          />

          {(generated.apple || generated.google) && (
            <div className="rounded-xl border border-noctura-border bg-noctura-surface/60 px-4 py-3 text-xs font-mono space-y-1">
              {generated.apple && (
                <p className="flex items-center gap-2">
                  <span className="size-1.5 rounded-full bg-green-400" />
                  <span className="text-noctura-ink-muted">Apple ticket</span>
                  <span className="truncate">{generated.apple.ticketId}</span>
                </p>
              )}
              {generated.google && (
                <p className="flex items-center gap-2">
                  <span className="size-1.5 rounded-full bg-green-400" />
                  <span className="text-noctura-ink-muted">Google object</span>
                  <span className="truncate">{generated.google.objectId}</span>
                </p>
              )}
            </div>
          )}

          {adminMode && (
            <AdminControls
              appleTicketId={generated.apple?.ticketId}
              googleObjectId={generated.google?.objectId}
              onStatusChange={setStatus}
            />
          )}
        </div>

        <footer className="text-center text-[10px] font-mono text-noctura-ink-dim tracking-widest pt-8">
          NOCTURA · {EVENT.ageRestriction} · WALLET DEMO
        </footer>
      </div>
    </main>
  );
}

export default function Page() {
  return (
    <Suspense fallback={<div className="min-h-screen" />}>
      <UnwrapInner />
    </Suspense>
  );
}
