import { Router } from "express";
import { authMiddleware } from "../middlewares/auth.middleware";
import { createBooking, getBookings ,cancelBookingWithBookingId} from "../controllers/booking.controller";

const router = Router();

router.post("/", authMiddleware,createBooking);
router.post("/", authMiddleware,getBookings);
router.put("/:bookingId/cancel", authMiddleware,cancelBookingWithBookingId);

export default router;  