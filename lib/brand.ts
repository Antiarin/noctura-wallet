export const BRAND = {
  issuer: "NOCTURA",
  tagline: "UNDERGROUND ELECTRONIC",
} as const;

export const EVENT = {
  title: "Midnight Signal",
  subtitle: "NOCTURA PRESENTS",
  dateISO: "2025-12-13T23:00:00-05:00",
  dateDisplay: "Sat, Dec 13 · 11:00 PM",
  doorsDisplay: "Doors 10:30 PM",
  venue: "Warehouse 42",
  address: "Bushwick, Brooklyn",
  city: "Brooklyn, NY",
  lineup: ["KEIRA NOX", "PHASELOCK", "SUBSTRATA b2b ILUM"],
  ageRestriction: "21+",
} as const;

export const TIERS = {
  GA: {
    label: "General Admission",
    priceDisplay: "$35",
    description: "Main floor, open door policy",
  },
  VIP: {
    label: "Access All Areas",
    priceDisplay: "$85",
    description: "Balcony, artist lounge, early entry",
  },
} as const;

export type TicketTier = keyof typeof TIERS;

export const TICKET_STATUS = {
  Upcoming: {
    label: "Upcoming",
    note: "See you Saturday",
    color: "#8A6F78",
  },
  "Doors Open": {
    label: "Doors Open",
    note: "Make your way in",
    color: "#FFB84D",
  },
  "Live Now": {
    label: "Live Now",
    note: "Event in progress",
    color: "#FF2B6D",
  },
  Ended: {
    label: "Ended",
    note: "Thanks for coming",
    color: "#5C4750",
  },
} as const;

export type TicketStatus = keyof typeof TICKET_STATUS;
