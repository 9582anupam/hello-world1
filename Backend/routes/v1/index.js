import express from "express";
import usersRoutes from "./users.routes.js";
import chatbotRoutes from "./chatbot.routes.js";
import mediaRoutes from "./media.routes.js";

const router = express.Router();

router.use("/users", usersRoutes);
router.use("/chatbot", chatbotRoutes);
router.use("/media", mediaRoutes);

export default router;
