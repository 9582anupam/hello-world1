import express from "express";
import { ytToAudio, audioVideoToTranscript } from "../../controllers/media.controller.js";


const router = express.Router();

router.post("/yt-to-audio", ytToAudio);
router.post("/audio-video-to-transcript", audioVideoToTranscript);

export default router;