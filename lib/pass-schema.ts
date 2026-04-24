import { z } from "zod";

export const attendeeInputSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Name is required")
    .max(80, "Name is too long"),
  tier: z.enum(["GA", "VIP"]),
});

export type AttendeeInput = z.infer<typeof attendeeInputSchema>;

export const ticketStatusSchema = z.enum([
  "Upcoming",
  "Doors Open",
  "Live Now",
  "Ended",
]);

export type TicketStatus = z.infer<typeof ticketStatusSchema>;

export const updatePassInputSchema = z
  .object({
    status: ticketStatusSchema,
    appleTicketId: z.string().optional(),
    googleObjectId: z.string().optional(),
  })
  .refine(
    (v) => Boolean(v.appleTicketId) || Boolean(v.googleObjectId),
    "At least one of appleTicketId or googleObjectId is required",
  );

export type UpdatePassInput = z.infer<typeof updatePassInputSchema>;
