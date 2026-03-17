import express from "express";
import cors from "cors";
import authRoutes from "./src/routes/auth.route";
import hotelRoutes from "./src/routes/hotel.route";
import bookingRoutes from "./src/routes/hotel.route";

const app = express();
const PORT = Bun.env.PORT || 5000;
app.use(express.json());
app.use(cors());

app.use("/api/auth",authRoutes);
app.use("/api/hotels",hotelRoutes);
app.use("/api/bookings",bookingRoutes);

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});