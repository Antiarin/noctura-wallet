"use client";

import { TIERS, type TicketTier } from "@/lib/brand";

type Props = {
  name: string;
  tier: TicketTier;
  onNameChange: (name: string) => void;
  onTierChange: (tier: TicketTier) => void;
  disabled?: boolean;
};

export function AttendeeForm({
  name,
  tier,
  onNameChange,
  onTierChange,
  disabled,
}: Props) {
  return (
    <div className="space-y-4">
      <div>
        <label
          htmlFor="name"
          className="text-noctura-ink-muted mb-2 block font-mono text-[10px] tracking-[0.3em]"
        >
          YOUR NAME
        </label>
        <input
          id="name"
          type="text"
          value={name}
          onChange={(e) => onNameChange(e.target.value)}
          placeholder="Type your name as it should appear on the ticket"
          maxLength={80}
          disabled={disabled}
          className="bg-noctura-surface border-noctura-border text-noctura-ink placeholder:text-noctura-ink-dim focus:border-noctura-accent focus:ring-noctura-accent w-full rounded-lg border px-4 py-3 transition focus:ring-1 focus:outline-none disabled:opacity-50"
        />
      </div>

      <div>
        <p className="text-noctura-ink-muted mb-2 block font-mono text-[10px] tracking-[0.3em]">
          TIER
        </p>
        <div className="grid grid-cols-2 gap-2">
          {(Object.keys(TIERS) as TicketTier[]).map((t) => {
            const info = TIERS[t];
            const active = t === tier;
            return (
              <button
                key={t}
                type="button"
                disabled={disabled}
                onClick={() => onTierChange(t)}
                className={[
                  "rounded-lg border px-4 py-3 text-left transition",
                  active
                    ? "bg-noctura-accent/10 border-noctura-accent text-noctura-ink"
                    : "bg-noctura-surface border-noctura-border text-noctura-ink-muted hover:border-noctura-border-strong hover:text-noctura-ink",
                  disabled ? "cursor-not-allowed opacity-50" : "",
                ].join(" ")}
              >
                <div className="flex items-baseline justify-between">
                  <span className="text-sm font-semibold">{t}</span>
                  <span className="font-mono text-xs">{info.priceDisplay}</span>
                </div>
                <p className="mt-1 text-[11px] leading-tight opacity-80">
                  {info.description}
                </p>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
