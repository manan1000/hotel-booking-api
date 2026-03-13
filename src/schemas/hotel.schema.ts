import { z } from "zod";

export const createHotelSchema = z.object({
    name: z.string().min(1, "Hotel name cannot be empty."),
    description: z.string().min(1, "Hotel description cannot be empty."),
    city: z.string().min(1, "City name cannot be empty."),
    country: z.string().min(1, "Country name cannot be empty."),
    amenities: z.array(z.string())
});


export const createRoomSchema = z.object({
    roomNumber: z.string(),
    roomType: z.string(),
    pricePerNight: z.number().positive(),
    maxOccupancy: z.number().int().positive(),
});