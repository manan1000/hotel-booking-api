import type { Request, Response } from "express";
import { errorResponse, successResponse } from "../lib/response";
import { prisma } from "../lib/prisma";
import { createBookingSchema } from "../schemas/booking.schema";


export const createBooking = async (req: Request, res: Response) => {
    try {
        if (req.role !== "customer") {
            return errorResponse(res, 403, "FORBIDDEN");
        }
        const parsedData = createBookingSchema.safeParse(req.body);
        if (!parsedData.success) {
            return errorResponse(res, 400, "INVALID_REQUEST");
        }

        const { roomId, checkInDate, checkOutDate, guests } = parsedData.data;


        // invalid dates check
        const room = await prisma.room.findUnique({
            where: { id: roomId },
            include: {
                hotel: true
            }
        });

        // room not found
        if (!room) {
            return errorResponse(res, 404, "ROOM_NOT_FOUND");
        }

        // room capacity error
        if (room.maxOccupancy < guests) {
            return errorResponse(res, 400, "INVALID_CAPACITY");
        }
        const hotelId = room.hotelId;
        if (req.userId === room.hotel.ownerId) {
            return errorResponse(res, 403, "FORBIDDEN");
        }

        const today = new Date();
        today.setHours(0, 0, 0, 0); // Reset to start of day

        const checkIn = new Date(checkInDate); // e.g., "2026-02-15"
        checkIn.setHours(0, 0, 0, 0);
        const checkOut = new Date(checkOutDate); // e.g., "2026-02-16"
        checkOut.setHours(0, 0, 0, 0);

        if (checkIn <= today || checkOut <= checkIn) {
            return errorResponse(res, 400, "INVALID_DATES");
        }


        const booking = await prisma.$transaction(async (tx) => {

            // already booked
            const alreadyBooked = await tx.booking.findFirst({
                where: {
                    roomId,
                    status: "confirmed",
                    checkInDate: {
                        lt: checkOut
                    },
                    checkOutDate: {
                        gt: checkIn
                    }
                }
            });

            if (alreadyBooked) {
                throw new Error("ROOM_NOT_AVAILABLE");
            }

            const pricePerNight = Number(room.pricePerNight);
            const nights = (checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24);
            const totalPrice = nights * pricePerNight;

            const booking = await tx.booking.create({
                data: {
                    userId: req.userId,
                    roomId,
                    hotelId,
                    checkInDate: checkIn,
                    checkOutDate: checkOut,
                    guests,
                    totalPrice,
                    status: "confirmed",
                    bookingDate: new Date()
                }
            });

            return booking;
        });

        const data = {
            id: booking.id,
            userId: booking.userId,
            roomId: booking.roomId,
            hotelId: booking.hotelId,
            checkInDate: booking.checkInDate,
            checkOutDate: booking.checkOutDate,
            guests: booking.guests,
            totalPrice: Number(booking.totalPrice),
            status: booking.status,
            bookingDate: booking.bookingDate
        };

        return successResponse(res, 201, data);

    } catch (error) {
        if (error instanceof Error && error.message === "ROOM_NOT_AVAILABLE") {
            return errorResponse(res, 400, "ROOM_NOT_AVAILABLE");
        }
        return errorResponse(res, 500, "INTERNAL_ERROR");
    }
}


export const getBookings = async (req: Request, res: Response) => {
    try {
        if (req.role !== "customer") {
            return errorResponse(res, 403, "FORBIDDEN");
        }

        const { status } = req.query;
        const where: any = {
            userId: req.userId
        }
        if (status === "confirmed" || status === "cancelled") {
            where.status = {
                equals: status as string
            };
        }

        const bookings = await prisma.booking.findMany({
            where,
            include: {
                hotel: { select: { name: true } },
                room: { select: { roomNumber: true, roomType: true } }
            }
        });

        const data = bookings.map((booking) => {
            return {
                id: booking.id,
                roomId: booking.roomId,
                hotelId: booking.hotelId,
                hotelName: booking.hotel.name,
                roomNumber: booking.room.roomNumber,
                roomType: booking.room.roomType,
                checkInDate: booking.checkInDate,
                checkOutDate: booking.checkOutDate,
                guests: booking.guests,
                totalPrice: Number(booking.totalPrice),
                status: booking.status,
                bookingDate: booking.bookingDate
            }
        });

        return successResponse(res, 200, data);
    } catch (error) {
        return errorResponse(res, 500, "INTERNAL_ERROR");
    }
}

export const cancelBookingWithBookingId = async (req: Request, res: Response) => {
    if (req.role !== "customer") {
        return errorResponse(res, 403, "FORBIDDEN");
    }

    try {
        const bookingId = req.params.bookingId as string;
        const booking = await prisma.booking.findUnique({
            where: { id: bookingId }
        });

        if (!booking) {
            return errorResponse(res, 404, "BOOKING_NOT_FOUND");
        }

        if (req.userId !== booking.userId) {
            return errorResponse(res, 403, "FORBIDDEN")
        }

        if (booking.status === "cancelled") {
            return errorResponse(res, 400, "ALREADY_CANCELLED");
        }

        const now = new Date();
        const checkIn = new Date(booking.checkInDate);

        const hoursUntilCheckIn = (checkIn.getTime() - now.getTime()) / (1000 * 60 * 60);

        if (hoursUntilCheckIn < 24) {
            // Return error: CANCELLATION_DEADLINE_PASSED
            return errorResponse(res, 400, "CANCELLATION_DEADLINE_PASSED");
        }

        const cancelledBooking = await prisma.booking.update({
            where: { id: bookingId },
            data: {
                status: "cancelled",
                cancelledAt: new Date()
            }
        });

        const data = {
            id: cancelledBooking.id,
            status: cancelledBooking.status,
            cancelledAt: cancelledBooking.cancelledAt
        };

        return successResponse(res, 200, data);
    } catch (error) {
        return errorResponse(res, 500, "INTERNAL_ERROR");
    }
}