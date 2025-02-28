import axios from 'axios';
import fs from 'fs';
import path from 'path';
import multer from 'multer';
import { v4 as uuidv4 } from 'uuid';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import ytdl from '@distube/ytdl-core';
import transcribeAudioVideo from '../helper/transcribeAudioVideo.js';
import fetchYouTubeAudio from '../helper/fetchYouTubeAudio.js';
import generateAssessmentPromptCall from '../helper/generateAssessmentPromptCall.js';
import convertVideoToAudio from '../helper/convertVideoToAudio.js';

// Setup paths
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const UPLOAD_DIR = path.resolve(__dirname, '../uploads');

// Ensure upload directory exists
if (!fs.existsSync(UPLOAD_DIR)) {
    fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

// Configure multer storage
const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, UPLOAD_DIR),
    filename: (req, file, cb) => cb(null, `${uuidv4()}${path.extname(file.originalname)}`)
});

// Video file filter
const videoFilter = (req, file, cb) => {
    const allowedTypes = ['video/mp4', 'video/mpeg', 'video/quicktime', 'video/x-msvideo'];
    allowedTypes.includes(file.mimetype) ? cb(null, true) : cb(new Error('Only video files allowed'), false);
};

// Export multer middleware
export const videoUpload = multer({
    storage,
    fileFilter: videoFilter,
    limits: { fileSize: 100 * 1024 * 1024 } // 100MB
});

/**
 * Generate assessment from YouTube video
 */
export const generateAssessmentFromYoutube = async (req, res) => {
    try {
        const { videoUrl, numberOfQuestions = 5, difficulty = 'medium', type = 'MCQ' } = req.body;

        if (!videoUrl) {
            return res.status(400).json({
                success: false,
                message: 'YouTube URL is required'
            });
        }

        // Extract video ID
        const videoId = ytdl.getURLVideoID(videoUrl);
        let transcript;

        // Try Python service first
        try {
            const pythonResponse = await axios.get(`https://product-answer.vercel.app/api/transcript/${videoId}`, { timeout: 15000 });
            transcript = pythonResponse.data.transcript;
        } catch (error) {
            console.log('Python service failed, falling back to manual extraction');
        }

        // If Python service failed, extract manually
        if (!transcript) {
            const audioPath = await fetchYouTubeAudio(videoUrl);
            const transcriptionResult = await transcribeAudioVideo(audioPath);
            transcript = transcriptionResult.text;
        }

        if (!transcript) {
            return res.status(400).json({
                success: false,
                message: 'Failed to extract transcript'
            });
        }

        // Generate assessment
        const assessmentJson = await generateAssessmentPromptCall(transcript, type, numberOfQuestions, difficulty);
        let assessment;

        try {
            // Try to extract JSON from the response
            const match = assessmentJson.match(/\[[\s\S]*\]/);
            assessment = match ? JSON.parse(match[0]) : JSON.parse(assessmentJson);
        } catch (error) {
            assessment = { rawResponse: assessmentJson };
        }

        res.status(200).json({
            success: true,
            videoId,
            assessment,
            metadata: { type, difficulty, questionCount: numberOfQuestions }
        });

    } catch (error) {
        console.error('Error generating YouTube assessment:', error);
        res.status(500).json({
            success: false,
            message: 'Error generating assessment',
            error: error.message
        });
    }
};

/**
 * Generate assessment from video file
 */
export const generateAssessmentFromVideo = async (req, res) => {
    const timeoutId = setTimeout(() => {
        res.status(504).json({ success: false, message: 'Request timed out' });
    }, 300000); // 5 minutes

    try {
        if (!req.file) {
            clearTimeout(timeoutId);
            return res.status(400).json({ success: false, message: 'No video file uploaded' });
        }

        const videoPath = req.file.path;
        const { numberOfQuestions = 5, difficulty = 'medium', type = 'MCQ' } = req.body;

        // Extract audio from video
        const audioPath = await convertVideoToAudio(videoPath);

        // Transcribe audio
        const transcriptionResult = await transcribeAudioVideo(audioPath);
        const transcript = transcriptionResult.text;

        if (!transcript || transcript.length < 50) {
            // Clean up files
            fs.unlinkSync(videoPath);
            fs.unlinkSync(audioPath);

            clearTimeout(timeoutId);
            return res.status(400).json({
                success: false,
                message: 'Insufficient speech content in video'
            });
        }

        // Generate assessment
        const assessmentJson = await generateAssessmentPromptCall(transcript, type, numberOfQuestions, difficulty);

        // Parse result
        let assessment;
        try {
            const match = assessmentJson.match(/\[[\s\S]*\]/);
            assessment = match ? JSON.parse(match[0]) : JSON.parse(assessmentJson);
        } catch (error) {
            assessment = { rawResponse: assessmentJson };
        }

        // Clean up files
        fs.unlinkSync(videoPath);
        fs.unlinkSync(audioPath);

        clearTimeout(timeoutId);
        res.status(200).json({
            success: true,
            assessment,
            metadata: { type, difficulty, questionCount: numberOfQuestions }
        });

    } catch (error) {
        clearTimeout(timeoutId);

        // Clean up files if they exist
        if (req.file?.path && fs.existsSync(req.file.path)) {
            fs.unlinkSync(req.file.path);
        }

        console.error('Error generating video assessment:', error);
        res.status(500).json({
            success: false,
            message: 'Error generating assessment',
            error: error.message
        });
    }
};