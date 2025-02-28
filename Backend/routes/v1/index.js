import express from "express";
import usersRoutes from "./users.routes.js";
import chatbotRoutes from "./chatbot.routes.js";
import mediaRoutes from "./media.routes.js";
import assessmentGenerateRoutes from "./assessmentGenerate.routes.js";

const router = express.Router();

router.use("/users", usersRoutes);
router.use("/chatbot", chatbotRoutes);
router.use("/media", mediaRoutes);
router.use("/assessment", assessmentGenerateRoutes); // backwards compatibility
router.use("/assessmentGenerate", assessmentGenerateRoutes);

export default router;
