import express from "express";
import { getBotResponse, ytToAudio, audioVideoToTranscript } from "../../controllers/chatbot.controller.js";

const router = express.Router();

router.post("/bot-response", getBotResponse);
router.post("/yt-to-audio", ytToAudio);
router.post("/audio-video-to-transcript", audioVideoToTranscript);

export default router;
