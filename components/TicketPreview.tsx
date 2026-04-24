"use client";

import { QRCodeSVG } from "qrcode.react";
import { EVENT, TIERS, TICKET_STATUS, type TicketStatus } from "@/lib/brand";
import type { TicketTier } from "@/lib/brand";

type Props = {
  name: string;
  tier: TicketTier;
  status: TicketStatus;
  ticketNumber?: string;
};

export function TicketPreview({
  name,
  tier,
  status,
  ticketNumber = "NCT-XXXXXXXX",
}: Props) {
  const tierInfo = TIERS[tier];
  const statusInfo = TICKET_STATUS[status];

  const displayName = name.trim() || "YOUR NAME";

  return (
    <div className="relative mx-auto w-full max-w-[380px]">
      <div
        className="ticket-glow relative overflow-hidden rounded-[var(--radius-ticket)]"
        style={{ aspectRatio: "1 / 1.586" }}
      >
        {/* top half — event info */}
        <div
          className="absolute inset-x-0 top-0 flex h-[58%] flex-col justify-between p-6"
          style={{
            background:
              "linear-gradient(165deg, #22101a 0%, #1a0a10 50%, #0a0306 100%)",
          }}
        >
          <div className="flex items-start justify-between">
            <div>
              <p className="text-noctura-accent font-mono text-[10px] tracking-[0.3em]">
                {EVENT.subtitle}
              </p>
              <h2 className="mt-2 text-3xl leading-none font-bold text-balance">
                {EVENT.title}
              </h2>
            </div>
            <div
              className="flex size-10 items-center justify-center rounded-full"
              style={{
                background: "radial-gradient(circle, #ff2b6d 0%, #c41855 100%)",
              }}
            >
              <span className="text-xs font-bold tracking-widest">NCT</span>
            </div>
          </div>

          <div className="space-y-3">
            <div>
              <p className="text-noctura-ink-muted font-mono text-[10px] tracking-[0.25em]">
                ATTENDEE
              </p>
              <p className="mt-0.5 truncate text-xl font-semibold tracking-tight uppercase">
                {displayName}
              </p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-noctura-ink-muted font-mono text-[10px] tracking-[0.25em]">
                  DATE
                </p>
                <p className="mt-0.5 text-sm font-medium">
                  {EVENT.dateDisplay}
                </p>
              </div>
              <div>
                <p className="text-noctura-ink-muted font-mono text-[10px] tracking-[0.25em]">
                  VENUE
                </p>
                <p className="mt-0.5 text-sm font-medium">{EVENT.venue}</p>
              </div>
            </div>
          </div>
        </div>

        {/* perforation */}
        <div
          className="absolute inset-x-0 h-[1px]"
          style={{
            top: "58%",
            background:
              "repeating-linear-gradient(to right, #3d1220 0 8px, transparent 8px 14px)",
          }}
        />
        <div
          className="bg-noctura-bg absolute -left-3 size-6 rounded-full"
          style={{ top: "calc(58% - 12px)" }}
        />
        <div
          className="bg-noctura-bg absolute -right-3 size-6 rounded-full"
          style={{ top: "calc(58% - 12px)" }}
        />

        {/* bottom half — QR + tier + status */}
        <div
          className="absolute inset-x-0 bottom-0 flex h-[42%] flex-col justify-between p-6"
          style={{
            background: "linear-gradient(165deg, #1a0a10 0%, #0a0306 80%)",
          }}
        >
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0 flex-1 space-y-2">
              <div>
                <p className="text-noctura-ink-muted font-mono text-[10px] tracking-[0.25em]">
                  TIER
                </p>
                <p className="mt-0.5 text-sm font-semibold">{tierInfo.label}</p>
              </div>
              <div>
                <p className="text-noctura-ink-muted font-mono text-[10px] tracking-[0.25em]">
                  TICKET
                </p>
                <p className="mt-0.5 truncate font-mono text-[11px] tracking-wider">
                  {ticketNumber}
                </p>
              </div>
            </div>
            <TicketQr value={ticketNumber} />
          </div>

          <div className="border-noctura-border flex items-center justify-between border-t pt-3">
            <div className="flex items-center gap-2">
              <span
                className="size-2 rounded-full"
                style={{
                  backgroundColor: statusInfo.color,
                  boxShadow: `0 0 8px ${statusInfo.color}`,
                }}
              />
              <span className="font-mono text-xs tracking-wider uppercase">
                {statusInfo.label}
              </span>
            </div>
            <p className="text-noctura-ink-muted font-mono text-[10px]">
              {EVENT.ageRestriction} · {EVENT.doorsDisplay}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function TicketQr({ value }: { value: string }) {
  return (
    <div className="bg-noctura-ink size-24 shrink-0 rounded-md p-1.5">
      <QRCodeSVG
        value={value}
        level="M"
        marginSize={0}
        bgColor="#F4E9EC"
        fgColor="#0A0306"
        className="size-full"
      />
    </div>
  );
}
