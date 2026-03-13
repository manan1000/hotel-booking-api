import { Router } from "express";
import { authMiddleware } from "../middlewares/auth.middleware";
import { createHotel, getHotel, createRoom } from "../controllers/hotel.controller";

const router = Router();

router.post("/", authMiddleware, createHotel);
router.get("/", authMiddleware, getHotel);
router.post("/:hotelId/rooms", authMiddleware, createRoom);

export default router;  