import express from "express";
import usersRoutes from "./users.routes.js";
import chatbotRoutes from "./chatbot.routes.js";
import mediaRoutes from "./media.routes.js";
import assessmentRoutes from "./assessment.routes.js";

const router = express.Router();

router.use("/users", usersRoutes);
router.use("/chatbot", chatbotRoutes);
router.use("/media", mediaRoutes);
router.use("/assessment", assessmentRoutes);

export default router;
