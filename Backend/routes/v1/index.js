import express from "express";
import usersRoutes from "./users.routes.js";
import chatbotRoutes from "./chatbot.routes.js";

const router = express.Router();

router.use("/users", usersRoutes);
router.use("/chatbot", chatbotRoutes);
router.use("/", (req, res) => {
    res.send("API V1 Running");
});

export default router;
