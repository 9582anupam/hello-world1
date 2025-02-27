import express from "express";
import { getBotResponse, ytToAudio, audioVideoToTranscript } from "../../controllers/chatbot.controller.js";
import { processPdf, upload, processDocument } from "../../controllers/document.controller.js";

const router = express.Router();

router.post("/bot-response", getBotResponse);
router.post("/yt-to-audio", ytToAudio);
router.post("/audio-video-to-transcript", audioVideoToTranscript);
router.post('/process-pdf', upload.single('pdfFile'), processPdf);
router.post('/process', upload.single('documentFile'), processDocument);


export default router;
