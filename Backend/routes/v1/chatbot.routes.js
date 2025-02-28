import express from "express";
import { getBotResponse } from "../../controllers/chatbot.controller.js";

const router = express.Router();

router.post("/bot-response", getBotResponse);


export default router;
