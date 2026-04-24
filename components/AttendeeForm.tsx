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
          className="block text-[10px] tracking-[0.3em] font-mono text-noctura-ink-muted mb-2"
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
          className="w-full bg-noctura-surface border border-noctura-border rounded-lg px-4 py-3 text-noctura-ink placeholder:text-noctura-ink-dim focus:outline-none focus:border-noctura-accent focus:ring-1 focus:ring-noctura-accent transition disabled:opacity-50"
        />
      </div>

      <div>
        <p className="block text-[10px] tracking-[0.3em] font-mono text-noctura-ink-muted mb-2">
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
                  "text-left rounded-lg px-4 py-3 border transition",
                  active
                    ? "bg-noctura-accent/10 border-noctura-accent text-noctura-ink"
                    : "bg-noctura-surface border-noctura-border text-noctura-ink-muted hover:border-noctura-border-strong hover:text-noctura-ink",
                  disabled ? "opacity-50 cursor-not-allowed" : "",
                ].join(" ")}
              >
                <div className="flex items-baseline justify-between">
                  <span className="font-semibold text-sm">{t}</span>
                  <span className="text-xs font-mono">{info.priceDisplay}</span>
                </div>
                <p className="text-[11px] mt-1 leading-tight opacity-80">
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
