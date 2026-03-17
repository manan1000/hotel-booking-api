import { z } from "zod";

export const createBookingSchema = z.object({
    roomId: z.string(),
    checkInDate: z.date(),
    checkOutDate: z.date(),
    guests: z.number()
})