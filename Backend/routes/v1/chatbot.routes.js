import express from "express";
import { generateAssessment, getBotResponse } from "../../controllers/chatbot.controller.js";

const router = express.Router();

router.post("/bot-response", getBotResponse);
router.post("/generate-assessment", generateAssessment);


export default router;
