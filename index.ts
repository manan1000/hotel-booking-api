import express from "express";

import authRoutes from "./src/routes/auth.route";
const app = express();
const PORT = Bun.env.PORT || 3000;
app.use(express.json());

app.use("/api/auth",authRoutes);

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});