import express from "express";
import { 
  generateAssessmentFromYoutube,
  generateAssessmentFromVideo,
  videoUpload
} from "../../controllers/Assessment.controller.js";

const router = express.Router();

/**
 * @route GET /api/v1/assessment/generate-assessment
 * @desc Generate assessment from YouTube video
 */
router.get("/youtube-assessment", generateAssessmentFromYoutube);

/**
 * @route POST /api/v1/assessment/video-assessment
 * @desc Generate assessment from uploaded MP4 video file
 * @param {File} video - Video file (mp4, etc.)
 * @param {Number} numberOfQuestions - Number of questions to generate
 * @param {String} difficulty - Question difficulty (easy, medium, hard)
 * @param {String} type - Question type (MCQ, TF, etc.)
 */
router.post("/video-assessment", videoUpload.single('video'), generateAssessmentFromVideo);

export default router;