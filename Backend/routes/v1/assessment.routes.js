import express from "express";
import {
    generateAssessmentFromYoutube,
    generateAssessmentFromMedia,
    generateAssessmentFromDocument,
    mediaFields,
    documentFields,
    mediaUpload,
    documentUpload
} from "../../controllers/assessment.controller.js";

const router = express.Router();

/**
 * @route POST /api/v1/assessment/youtube
 * @desc Generate assessment from YouTube video URL
 * @access Public
 * 
 * @bodyParam {string} videoUrl - Required. YouTube video URL to generate assessment from
 * @bodyParam {number} numberOfQuestions - Optional. Number of questions to generate (default: 5)
 * @bodyParam {string} difficulty - Optional. Difficulty level: 'easy', 'medium', or 'hard' (default: 'medium')
 * @bodyParam {string} type - Optional. Question type: 'MCQ', 'TF', 'SHORT_ANSWER', 'ESSAY', etc. (default: 'MCQ')
 * 
 * @response {Object} Response object containing assessment questions and metadata
 */
router.post("/youtube", generateAssessmentFromYoutube);

/**
 * @route POST /api/v1/assessment/media
 * @desc Generate assessment from uploaded audio or video file
 * @access Public
 * 
 * @fileParam {File} media/file/audio/video/audioFile/videoFile - Required. Audio or video file to process
 * @bodyParam {number} numberOfQuestions - Optional. Number of questions to generate (default: 5)
 * @bodyParam {string} difficulty - Optional. Difficulty level: 'easy', 'medium', or 'hard' (default: 'medium')
 * @bodyParam {string} type - Optional. Question type: 'MCQ', 'TF', 'SHORT_ANSWER', 'ESSAY', etc. (default: 'MCQ')
 *
 * @response {Object} Response object containing assessment questions and metadata
 */
router.post("/media", mediaUpload.fields(mediaFields), generateAssessmentFromMedia);

/**
 * @route POST /api/v1/assessment/document
 * @desc Generate assessment from PDF or PowerPoint document
 * @access Public
 * 
 * @fileParam {File} document/file/pdf/ppt/pptx - Required. Document file (PDF, PPT, PPTX)
 * @bodyParam {number} numberOfQuestions - Optional. Number of questions to generate (default: 5)
 * @bodyParam {string} difficulty - Optional. Difficulty level: 'easy', 'medium', or 'hard' (default: 'medium')
 * @bodyParam {string} type - Optional. Question type: 'MCQ', 'TF', 'SHORT_ANSWER', 'ESSAY', etc. (default: 'MCQ')
 *
 * @response {Object} Response object containing assessment questions and metadata
 */
router.post("/document", documentUpload.fields(documentFields), generateAssessmentFromDocument);


/**
 * @route GET /api/v1/assessment/upload-help
 * @desc Get help information for media upload endpoints
 */
router.get("/upload-help", (req, res) => {
    res.status(200).json({
        message: "Media upload guide",
        endpoints: {
            youtube: {
                url: "/api/v1/assessment/youtube",
                method: "POST",
                bodyParams: {
                    videoUrl: "Required. YouTube video URL",
                    numberOfQuestions: "Optional. Integer (default: 5)",
                    difficulty: "Optional. 'easy', 'medium', or 'hard' (default: 'medium')",
                    type: "Optional. 'MCQ', 'TF', 'SHORT_ANSWER', etc. (default: 'MCQ')"
                },
                example: {
                    request: {
                        videoUrl: "https://www.youtube.com/watch?v=example",
                        numberOfQuestions: 8,
                        difficulty: "hard",
                        type: "MCQ"
                    }
                }
            },
            media: {
                url: "/api/v1/assessment/media",
                method: "POST",
                formDataParams: {
                    "media/file/audio/video": "Required. Audio or video file",
                    numberOfQuestions: "Optional. Integer (default: 5)",
                    difficulty: "Optional. 'easy', 'medium', or 'hard' (default: 'medium')",
                    type: "Optional. 'MCQ', 'TF', 'SHORT_ANSWER', etc. (default: 'MCQ')"
                }
            },
            document: {
                url: "/api/v1/assessment/document",
                method: "POST",
                formDataParams: {
                    "document/file/pdf/ppt": "Required. PDF or PowerPoint file",
                    numberOfQuestions: "Optional. Integer (default: 5)",
                    difficulty: "Optional. 'easy', 'medium', or 'hard' (default: 'medium')",
                    type: "Optional. 'MCQ', 'TF', 'SHORT_ANSWER', etc. (default: 'MCQ')"
                }
            }
        },
        questionTypes: {
            MCQ: "Multiple Choice Questions (default)",
            TF: "True/False Questions",
            SHORT_ANSWER: "Short Answer Questions",
            ESSAY: "Essay Questions",
            FILL_IN_BLANK: "Fill in the Blank Questions",
            MATCHING: "Matching Questions"
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