import express from "express";
import { getBotResponse, ytToAudio, audioToTranscript } from "../../controllers/chatbot.controller.js";

const router = express.Router();

router.post("/bot-response", getBotResponse);
router.post("/yt-to-audio", ytToAudio);
router.post("/audio-to-transcript", audioToTranscript);

export default router;
