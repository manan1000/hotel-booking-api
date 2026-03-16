import type { Request, Response } from "express";
import { createHotelSchema, createRoomSchema } from "../schemas/hotel.schema";
import { errorResponse, successResponse } from "../lib/response";
import { prisma } from "../lib/prisma";

export const createHotel = async (req: Request, res: Response) => {
    try {
        if (req.role !== "owner") {
            return errorResponse(res, 403, "FORBIDDEN");
        }

        const parsedData = createHotelSchema.safeParse(req.body);
        if (!parsedData.success) {
            return errorResponse(res, 400, "INVALID_REQUEST");
        }

        const { name, description, city, country, amenities } = parsedData.data;

        const hotel = await prisma.hotel.create({
            data: {
                ownerId: req.userId,
                name,
                description,
                city,
                country,
                amenities,
            }
        });

        const data = {
            id: hotel.id,
            ownerId: hotel.ownerId,
            name: hotel.name,
            description: hotel.description,
            city: hotel.city,
            country: hotel.country,
            amenities: hotel.amenities,
            rating: hotel.rating,
            totalReviews: hotel.totalReviews
        };

        return successResponse(res, 201, data);
    } catch (error) {
        return errorResponse(res, 500, "INTERNAL_ERROR");
    }
}

export const getHotelsWithQuery = async (req: Request, res: Response) => {
    try {
        const { city, country, minPrice, maxPrice, minRating } = req.query;
        const where: any = {
            rooms: {
                some: {}
            }
        };

        if (city) {
            where.city = {
                equals: city as string,
                mode: "insensitive"
            };
        }

        if (country) {
            where.country = {
                equals: country as string,
                mode: "insensitive"
            };
        }

        if (minRating) {
            where.rating = {
                gte: Number(minRating)
            };
        }

        if (minPrice || maxPrice) {
            where.rooms = {
                some: {
                    pricePerNight: {
                        ...(minPrice && { gte: Number(minPrice) }),
                        ...(maxPrice && { lte: Number(maxPrice) })
                    }
                }
            };
        }

        const hotels = await prisma.hotel.findMany({
            where,
            include: {
                rooms: true
            }
        });

        const data = hotels.map((hotel) => {
            const minPricePerNight = Math.min(
                ...hotel.rooms.map((room) => Number(room.pricePerNight))
            );

            return {
                id: hotel.id,
                name: hotel.name,
                description: hotel.description,
                city: hotel.city,
                country: hotel.country,
                amenities: hotel.amenities,
                rating: Number(hotel.rating),
                totalReviews: hotel.totalReviews,
                minPricePerNight
            };
        });

        return successResponse(res, 200, data);
    } catch (error) {
        return errorResponse(res, 500, "INTERNAL_ERROR");
    }

}

export const getHotelWithId = async (req: Request, res: Response) => {
    try {
        const hotelId = req.params.hotelId as string;

        const hotel = await prisma.hotel.findUnique({
            where: { id: hotelId },
            include: {
                rooms: true
            }
        });

        if (!hotel) {
            return errorResponse(res, 404, "HOTEL_NOT_FOUND");
        }

        const data = {
            id: hotel.id,
            ownerId: hotel.ownerId,
            name: hotel.name,
            description: hotel.description,
            city: hotel.city,
            country: hotel.country,
            amenities: hotel.amenities,
            rating: Number(hotel.rating),
            totalReviews: hotel.totalReviews,
            rooms: hotel.rooms.map((room)=>{
                return {
                    id: room.id,
                    roomNumber: room.roomNumber,
                    roomType: room.roomType,
                    pricePerNight: Number(room.pricePerNight),
                    maxOccupancy: room.maxOccupancy
                }
            })
        };

        return successResponse(res, 200, data);

    } catch (error) {
        return errorResponse(res, 500, "INTERNAL_ERROR");
    }
}

export const createRoom = async (req: Request, res: Response) => {
    try {
        if (req.role !== "owner") {
            return errorResponse(res, 403, "FORBIDDEN");
        }

        const parsedData = createRoomSchema.safeParse(req.body);
        if (!parsedData.success) {
            return errorResponse(res, 400, "INVALID_REQUEST");
        }

        const { roomNumber, roomType, pricePerNight, maxOccupancy } = parsedData.data;
        const hotelId = req.params.hotelId as string;

        const hotel = await prisma.hotel.findUnique({
            where: { id: hotelId }
        });

        if (!hotel) {
            return errorResponse(res, 404, "HOTEL_NOT_FOUND");
        }

        if (hotel.ownerId !== req.userId) {
            return errorResponse(res, 403, "FORBIDDEN");
        }

        const roomAlreadyExists = await prisma.room.findFirst({
            where: {
                hotelId,
                roomNumber
            }
        });

        if (roomAlreadyExists) {
            return errorResponse(res, 400, "ROOM_ALREADY_EXISTS");
        }

        const room = await prisma.room.create({
            data: {
                hotelId,
                roomNumber,
                roomType,
                pricePerNight,
                maxOccupancy
            }
        })
        const data = {
            id: room.id,
            hotelId: room.hotelId,
            roomNumber: room.roomNumber,
            roomType: room.roomType,
            pricePerNight: room.pricePerNight,
            maxOccupancy: room.maxOccupancy
        };

        return successResponse(res, 201, data);
    } catch (error) {
        return errorResponse(res, 500, "INTERNAL_ERROR");
    }
}