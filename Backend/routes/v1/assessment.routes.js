import express from "express";
import { generateAssessmentFromYoutube } from "../../controllers/Assessment.controller.js";


const router = express.Router();

router.get("/generate-assessment", generateAssessmentFromYoutube);


export default router;