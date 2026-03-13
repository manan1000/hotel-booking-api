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

export const getHotel = async (req: Request, res: Response) => {
    
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
};