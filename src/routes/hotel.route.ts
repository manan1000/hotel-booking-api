import { Router } from "express";
import { authMiddleware } from "../middlewares/auth.middleware";
import { createHotel, getHotelsWithQuery, getHotelWithId, createRoom } from "../controllers/hotel.controller";

const router = Router();

router.post("/", authMiddleware, createHotel);
router.get("/", authMiddleware, getHotelsWithQuery);
router.get("/:hotelId", authMiddleware, getHotelWithId);
router.post("/:hotelId/rooms", authMiddleware, createRoom);

export default router;  