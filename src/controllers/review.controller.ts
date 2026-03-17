import type { Request, Response } from "express";
import { submitReviewSchema } from "../schemas/review.schema";
import { errorResponse, successResponse } from "../lib/response";
import { prisma } from "../lib/prisma";

export const submitReview = async (req: Request, res: Response) => {
    try {

        if (req.role !== "customer") {
            return errorResponse(res, 403, "FORBIDDEN");
        }

        const parsedData = submitReviewSchema.safeParse(req.body);
        if (!parsedData.success) {
            return errorResponse(res, 400, "INVALID_REQUEST");
        }

        const { bookingId, rating, comment } = parsedData.data;

        const booking = await prisma.booking.findUnique({
            where: { id: bookingId },
            include: {
                reviews: { take: 1 }
            }
        });

        if (!booking) {
            return errorResponse(res, 404, "BOOKING_NOT_FOUND");
        }

        if (booking.userId !== req.userId) {
            return errorResponse(res, 403, "FORBIDDEN");
        }

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const checkOut = new Date(booking.checkOutDate);
        checkOut.setHours(0, 0, 0, 0);

        const canReview = checkOut < today && booking.status === "confirmed";

        if (!canReview) {
            return errorResponse(res, 400, "REVIEW_NOT_ELIGIBLE");
        }

        if (booking.reviews.length > 0) {
            return errorResponse(res, 400, "ALREADY_REVIEWED");
        }

        const review = await prisma.$transaction(async (tx) => {
            
            const review = await tx.review.create({
                data: {
                    userId: req.userId,
                    hotelId: booking.hotelId,
                    bookingId: booking.id,
                    rating,
                    comment
                }
            });

            const hotel = await tx.hotel.findUnique({
                where: { id: booking.hotelId }
            });


            const totalReviews = Number(hotel?.totalReviews);
            const newRating = (((Number(hotel?.rating) * Number(hotel?.totalReviews)) + rating) / (Number(hotel?.totalReviews) + 1)).toFixed(1);

            await tx.hotel.update({
                where: { id: booking.hotelId },
                data: {
                    rating: newRating,
                    totalReviews: totalReviews + 1
                }
            });


            return review;
        })

        const data = {
            id: review.id,
            userId: review.userId,
            hotelId: review.hotelId,
            bookingId: review.bookingId,
            rating: Number(review.rating),
            comment: review.comment,
            createdAt: review.createdAt
        };

        return successResponse(res, 201, data);

    } catch (error) {
        return errorResponse(res, 500, "INTERNAL_ERROR");
    }
}