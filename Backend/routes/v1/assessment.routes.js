import express from "express";
import {
  generateAssessmentFromYoutube,
  generateAssessmentFromMedia,
  mediaUpload,
  mediaFields
} from "../../controllers/Assessment.controller.js";

const router = express.Router();

/**
 * @route POST /api/v1/assessment/youtube
 * @desc Generate assessment from YouTube video
 */
router.post("/youtube", generateAssessmentFromYoutube);

/**
 * @route GET /api/v1/assessment/youtube-assessment
 * @desc Legacy endpoint for YouTube assessment (compatibility)
 */
router.get("/youtube-assessment", generateAssessmentFromYoutube);

/**
 * @route POST /api/v1/assessment/media
 * @desc Generate assessment from uploaded media file (accepts multiple field names)
 */
router.post("/media", mediaUpload.fields(mediaFields), generateAssessmentFromMedia);

/**
 * @route POST /api/v1/assessment/video-assessment
 * @desc Legacy endpoint for video assessment (compatibility)
 */
router.post("/video-assessment", mediaUpload.fields(mediaFields), generateAssessmentFromMedia);

/**
 * @route POST /api/v1/assessment/audio-assessment
 * @desc Legacy endpoint for audio assessment (compatibility)
 */
router.post("/audio-assessment", mediaUpload.fields(mediaFields), generateAssessmentFromMedia);

/**
 * Documentation endpoint for troubleshooting
 */
router.get("/upload-help", (req, res) => {
  res.status(200).json({
    message: "Media upload guide",
    acceptedEndpoints: ["/media", "/video-assessment", "/audio-assessment"],
    acceptedFieldNames: ["media", "file", "audio", "video", "audioFile", "videoFile"],
    acceptedFileTypes: ["MP3", "WAV", "MP4", "MOV", "AVI", "M4A", "OGG", "WEBM"],
    maxFileSize: "100MB",
    example: {
      formData: `
        const formData = new FormData();
        formData.append('media', fileInput.files[0]);
        formData.append('numberOfQuestions', 5);
        formData.append('difficulty', 'medium');
        formData.append('type', 'MCQ');
      `
    }
  });
});

export default router;