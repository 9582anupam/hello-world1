import express from "express";
import { getBotResponse, ytToAudio } from "../../controllers/chatbot.controller.js";

const router = express.Router();

router.post("/bot-response", getBotResponse);
router.post("/yt-to-audio", ytToAudio);

export default router;
