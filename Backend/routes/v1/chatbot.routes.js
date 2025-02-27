import express from "express";
import { getBotResponse, fetchSubtitles } from "../../controllers/chatbot.controller.js";

const router = express.Router();

router.post("/bot-response", getBotResponse);
router.post("/subtitles", fetchSubtitles);

export default router;
