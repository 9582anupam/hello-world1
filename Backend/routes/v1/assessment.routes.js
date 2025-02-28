import express from "express";
import {
    generateAssessmentFromYoutube,
    generateAssessmentFromMedia,
    generateAssessmentFromDocument,
    mediaFields,
    documentFields,
    mediaUpload,
    documentUpload
} from "../../controllers/Assessment.controller.js";

const router = express.Router();

// YouTube assessment routes
router.post("/youtube", generateAssessmentFromYoutube);

// Audio/video assessment routes
router.post("/media", mediaUpload.fields(mediaFields), generateAssessmentFromMedia);

/**
 * @route POST /api/v1/assessment/document
 * @desc Generate assessment from PDF or PowerPoint document
 * @param {File} document - Document file (PDF, PPT, PPTX)
 * @param {Number} numberOfQuestions - Number of questions to generate
 * @param {String} difficulty - Question difficulty (easy, medium, hard)
 * @param {String} type - Question type (MCQ, TF, etc.)
 */
router.post("/document", documentUpload.fields(documentFields), generateAssessmentFromDocument);



// Documentation endpoints
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

router.get("/document-help", (req, res) => {
    res.status(200).json({
        message: "Document upload guide for assessment generation",
        acceptedEndpoints: ["/document", "/pdf", "/ppt"],
        acceptedFieldNames: ["document", "file", "pdf", "ppt", "pptx"],
        acceptedFileTypes: ["PDF", "PPT", "PPTX"],
        maxFileSize: "25MB",
        example: {
            formData: `
        const formData = new FormData();
        formData.append('document', fileInput.files[0]);
        formData.append('numberOfQuestions', 5);
        formData.append('difficulty', 'medium');
        formData.append('type', 'MCQ');
      `
        }
    });
});

export default router;