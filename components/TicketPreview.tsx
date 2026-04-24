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
    <div className="relative w-full max-w-[380px] mx-auto">
      <div
        className="relative rounded-[var(--radius-ticket)] overflow-hidden ticket-glow"
        style={{ aspectRatio: "1 / 1.586" }}
      >
        {/* top half — event info */}
        <div
          className="absolute inset-x-0 top-0 h-[58%] p-6 flex flex-col justify-between"
          style={{
            background:
              "linear-gradient(165deg, #22101a 0%, #1a0a10 50%, #0a0306 100%)",
          }}
        >
          <div className="flex items-start justify-between">
            <div>
              <p className="text-[10px] tracking-[0.3em] text-noctura-accent font-mono">
                {EVENT.subtitle}
              </p>
              <h2 className="text-3xl font-bold mt-2 leading-none text-balance">
                {EVENT.title}
              </h2>
            </div>
            <div
              className="size-10 rounded-full flex items-center justify-center"
              style={{
                background: "radial-gradient(circle, #ff2b6d 0%, #c41855 100%)",
              }}
            >
              <span className="text-xs font-bold tracking-widest">NCT</span>
            </div>
          </div>

          <div className="space-y-3">
            <div>
              <p className="text-[10px] tracking-[0.25em] text-noctura-ink-muted font-mono">
                ATTENDEE
              </p>
              <p className="text-xl font-semibold uppercase tracking-tight mt-0.5 truncate">
                {displayName}
              </p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-[10px] tracking-[0.25em] text-noctura-ink-muted font-mono">
                  DATE
                </p>
                <p className="text-sm font-medium mt-0.5">
                  {EVENT.dateDisplay}
                </p>
              </div>
              <div>
                <p className="text-[10px] tracking-[0.25em] text-noctura-ink-muted font-mono">
                  VENUE
                </p>
                <p className="text-sm font-medium mt-0.5">{EVENT.venue}</p>
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
          className="absolute size-6 rounded-full bg-noctura-bg -left-3"
          style={{ top: "calc(58% - 12px)" }}
        />
        <div
          className="absolute size-6 rounded-full bg-noctura-bg -right-3"
          style={{ top: "calc(58% - 12px)" }}
        />

        {/* bottom half — QR + tier + status */}
        <div
          className="absolute inset-x-0 bottom-0 h-[42%] p-6 flex flex-col justify-between"
          style={{
            background:
              "linear-gradient(165deg, #1a0a10 0%, #0a0306 80%)",
          }}
        >
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0 space-y-2">
              <div>
                <p className="text-[10px] tracking-[0.25em] text-noctura-ink-muted font-mono">
                  TIER
                </p>
                <p className="text-sm font-semibold mt-0.5">{tierInfo.label}</p>
              </div>
              <div>
                <p className="text-[10px] tracking-[0.25em] text-noctura-ink-muted font-mono">
                  TICKET
                </p>
                <p className="text-[11px] font-mono mt-0.5 tracking-wider truncate">
                  {ticketNumber}
                </p>
              </div>
            </div>
            <TicketQr value={ticketNumber} />
          </div>

          <div className="flex items-center justify-between pt-3 border-t border-noctura-border">
            <div className="flex items-center gap-2">
              <span
                className="size-2 rounded-full"
                style={{
                  backgroundColor: statusInfo.color,
                  boxShadow: `0 0 8px ${statusInfo.color}`,
                }}
              />
              <span className="text-xs font-mono tracking-wider uppercase">
                {statusInfo.label}
              </span>
            </div>
            <p className="text-[10px] text-noctura-ink-muted font-mono">
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
    <div className="size-24 bg-noctura-ink p-1.5 rounded-md shrink-0">
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
