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
import { extractTextFromPdfFile } from '../helper/pdfToText.js';
import { extractTextFromPptFile } from '../helper/pptToText.js';

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

// Create a more flexible file filter
const mediaFileFilter = (req, file, cb) => {
    // List of acceptable file types
    const videoTypes = ['video/mp4', 'video/mpeg', 'video/quicktime', 'video/x-msvideo'];
    const audioTypes = ['audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/m4a', 'audio/ogg', 'audio/x-m4a', 'audio/webm'];

    // Accept any video or audio file
    if ([...videoTypes, ...audioTypes].includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error('Only video or audio files are allowed'), false);
    }
};

// Add document file filter for PDFs and PPTs
const documentFileFilter = (req, file, cb) => {
    // List of acceptable document types
    const documentTypes = [
        'application/pdf',                     // PDF
        'application/vnd.ms-powerpoint',       // PPT
        'application/vnd.openxmlformats-officedocument.presentationml.presentation' // PPTX
    ];
    
    if (documentTypes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error('Only PDF and PowerPoint files are allowed'), false);
    }
};

// Export a single multer middleware that accepts both video and audio
export const mediaUpload = multer({
    storage,
    fileFilter: mediaFileFilter,
    limits: { fileSize: 100 * 1024 * 1024 } // 100MB max for all media
});

// Create document upload middleware
export const documentUpload = multer({
    storage,
    fileFilter: documentFileFilter,
    limits: { fileSize: 25 * 1024 * 1024 } // 25MB max for documents
});

// Create a fields array for multiple possible field names
export const mediaFields = [
    { name: 'media', maxCount: 1 },
    { name: 'file', maxCount: 1 },
    { name: 'audio', maxCount: 1 },
    { name: 'video', maxCount: 1 },
    { name: 'audioFile', maxCount: 1 },
    { name: 'videoFile', maxCount: 1 }
];

// Create fields array for document upload
export const documentFields = [
    { name: 'document', maxCount: 1 },
    { name: 'file', maxCount: 1 },
    { name: 'pdf', maxCount: 1 },
    { name: 'ppt', maxCount: 1 },
    { name: 'pptx', maxCount: 1 }
];

// Remove individual video and audio upload middleware
// (Keeping the code here for reference, but will not use them)
/*
export const videoUpload = multer({
    storage,
    fileFilter: videoFilter,
    limits: { fileSize: 100 * 1024 * 1024 } 
});

export const audioUpload = multer({
    storage,
    fileFilter: audioFilter,
    limits: { fileSize: 50 * 1024 * 1024 } 
});
*/

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
 * Modified to handle both video and audio files
 */
export const generateAssessmentFromMedia = async (req, res) => {
    const timeoutId = setTimeout(() => {
        res.status(504).json({ success: false, message: 'Request timed out' });
    }, 300000); // 5 minutes timeout

    try {
        console.log("Files received:", req.files ? Object.keys(req.files) : "none");
        console.log("Single file:", req.file ? req.file.fieldname : "none");
        
        // Find the uploaded file (regardless of field name)
        let uploadedFile = null;
        
        // First check for req.files (for fields)
        if (req.files) {
          // Look through each field name we accept
          for (const fieldName of ['media', 'file', 'audio', 'video', 'audioFile', 'videoFile']) {
            if (req.files[fieldName] && req.files[fieldName].length > 0) {
              uploadedFile = req.files[fieldName][0];
              break;
            }
          }
        } 
        // Then check for req.file (for single uploads)
        else if (req.file) {
          uploadedFile = req.file;
        }
        
        if (!uploadedFile) {
          clearTimeout(timeoutId);
          return res.status(400).json({
            success: false,
            message: 'No media file uploaded. Please use one of these field names: media, file, audio, video, audioFile, videoFile'
          });
        }
        
        const filePath = uploadedFile.path;
        const fileName = uploadedFile.originalname;
        const fileType = uploadedFile.mimetype;
        const { numberOfQuestions = 5, difficulty = 'medium', type = 'MCQ' } = req.body;
        
        console.log(`Processing media file: ${fileName} (${fileType}) from field ${uploadedFile.fieldname}`);
        
        // Track paths for cleanup
        const pathsToCleanup = [];
        let audioPath = filePath;
        let tempAudioCreated = false;
        
        // Determine if this is a video or audio file
        const isVideo = fileType.startsWith('video/');
        
        try {
            // If it's a video, extract the audio or try to use as-is if extraction fails
            if (isVideo) {
                try {
                    console.log('Converting video to audio...');
                    audioPath = await convertVideoToAudio(filePath);
                    console.log(`Audio extracted to: ${audioPath}`);
                    tempAudioCreated = true;
                } catch (conversionError) {
                    console.error('Video conversion failed, trying to use video file directly:', conversionError.message);
                    // Keep using the original file path
                    // Some audio APIs might be able to extract audio from video files directly
                }
            }
            
            // Transcribe the audio/video
            console.log('Transcribing media...');
            
            // Create a copy of the file to avoid deletion conflicts
            const tempFileName = `trans_${uuidv4()}${path.extname(audioPath)}`;
            const tempFilePath = path.join(path.dirname(audioPath), tempFileName);
            
            try {
                const audioFile = fs.readFileSync(audioPath);
                fs.writeFileSync(tempFilePath, audioFile);
                pathsToCleanup.push(tempFilePath);
            } catch (copyError) {
                console.error('Error creating file copy:', copyError);
                // Fall back to using the original file with deleteFile: false option
                tempAudioCreated = false;
            }
            
            // Use tempFilePath if successful, otherwise use original with delete:false
            const transcriptionResult = await transcribeAudioVideo(
                pathsToCleanup.includes(tempFilePath) ? tempFilePath : audioPath,
                { deleteFile: !pathsToCleanup.includes(tempFilePath) }
            );
            
            const transcript = transcriptionResult.text;
            console.log(transcript);
            if (!transcript) {
                clearTimeout(timeoutId);
                throw new Error('Insufficient speech content in media');
            }
            
            // Generate assessment
            console.log(`Generating ${numberOfQuestions} ${difficulty} ${type} questions...`);
            const assessmentJson = await generateAssessmentPromptCall(transcript, type, numberOfQuestions, difficulty);
            
            // Parse result
            let assessment;
            try {
                const match = assessmentJson.match(/\[[\s\S]*\]/);
                assessment = match ? JSON.parse(match[0]) : JSON.parse(assessmentJson);
            } catch (error) {
                assessment = { rawResponse: assessmentJson };
            }
            
            clearTimeout(timeoutId);
            res.status(200).json({
                success: true,
                fileName,
                mediaType: isVideo ? 'video' : 'audio',
                assessment,
                metadata: { 
                    type, 
                    difficulty, 
                    questionCount: numberOfQuestions,
                    transcriptLength: transcript.length
                }
            });
        } finally {
            // Clean up files safely
            try {
                // Clean up original file if it still exists
                if (fs.existsSync(filePath)) {
                    fs.unlinkSync(filePath);
                    console.log(`Cleaned up original file: ${filePath}`);
                }
                
                // Clean up extracted audio if it was created and still exists
                if (tempAudioCreated && audioPath !== filePath && fs.existsSync(audioPath)) {
                    fs.unlinkSync(audioPath);
                    console.log(`Cleaned up extracted audio: ${audioPath}`);
                }
                
                // Clean up any other temp files
                pathsToCleanup.forEach(p => {
                    if (fs.existsSync(p)) {
                        fs.unlinkSync(p);
                        console.log(`Cleaned up temp file: ${p}`);
                    }
                });
            } catch (cleanupError) {
                console.error('Error during file cleanup:', cleanupError);
                // Continue even if cleanup fails
            }
        }
    } catch (error) {
        clearTimeout(timeoutId);
        console.error('Error generating assessment from media:', error);
        
        res.status(500).json({
            success: false,
            message: 'Error generating assessment',
            error: error.message
        });
    }
};

/**
 * Generate assessment from uploaded document (PDF/PowerPoint)
 */
export const generateAssessmentFromDocument = async (req, res) => {
    const timeoutId = setTimeout(() => {
        res.status(504).json({ success: false, message: 'Request timed out' });
    }, 180000); // 3 minutes timeout
    
    try {
        console.log("Document files received:", req.files ? Object.keys(req.files) : "none");
        console.log("Single document:", req.file ? req.file.fieldname : "none");
        
        // Find the uploaded file (similar to media handler)
        let uploadedFile = null;
        
        if (req.files) {
            for (const fieldName of ['document', 'file', 'pdf', 'ppt', 'pptx']) {
                if (req.files[fieldName] && req.files[fieldName].length > 0) {
                    uploadedFile = req.files[fieldName][0];
                    break;
                }
            }
        } else if (req.file) {
            uploadedFile = req.file;
        }
        
        if (!uploadedFile) {
            clearTimeout(timeoutId);
            return res.status(400).json({
                success: false,
                message: 'No document file uploaded. Please use one of these field names: document, file, pdf, ppt, pptx'
            });
        }
        
        const filePath = uploadedFile.path;
        const fileName = uploadedFile.originalname;
        const fileType = uploadedFile.mimetype;
        const { numberOfQuestions = 5, difficulty = 'medium', type = 'MCQ' } = req.body;
        
        console.log(`Processing document: ${fileName} (${fileType})`);
        
        try {
            // Extract text based on file type
            let documentText;
            let documentMetadata = {};
            
            if (fileType === 'application/pdf') {
                console.log('Processing PDF document...');
                const pdfResult = await extractTextFromPdfFile(filePath, false);
                documentText = pdfResult.allText;
                documentMetadata = {
                    pageCount: pdfResult.pageCount,
                    documentType: 'PDF'
                };
            } 
            else if (fileType === 'application/vnd.ms-powerpoint' || 
                    fileType === 'application/vnd.openxmlformats-officedocument.presentationml.presentation') {
                console.log('Processing PowerPoint document...');
                const pptResult = await extractTextFromPptFile(filePath);
                documentText = pptResult.allText;
                documentMetadata = {
                    slideCount: pptResult.slideCount,
                    title: pptResult.title,
                    documentType: fileType === 'application/vnd.ms-powerpoint' ? 'PPT' : 'PPTX'
                };
            } else {
                throw new Error(`Unsupported document type: ${fileType}`);
            }

            // Validate that we have enough text to work with
            if (!documentText || documentText.length < 100) {
                clearTimeout(timeoutId);
                return res.status(400).json({
                    success: false,
                    message: 'Document contains insufficient text for assessment generation',
                    error: 'The document has too little text content (minimum 100 characters required)'
                });
            }
            
            console.log(`Document text extracted, length: ${documentText.length} characters`);
            console.log(`Generating ${numberOfQuestions} ${difficulty} ${type} questions...`);
            
            // Generate assessment
            const assessmentJson = await generateAssessmentPromptCall(documentText, type, numberOfQuestions, difficulty);
            
            // Parse result
            let assessment;
            try {
                const match = assessmentJson.match(/\[[\s\S]*\]/);
                assessment = match ? JSON.parse(match[0]) : JSON.parse(assessmentJson);
            } catch (error) {
                console.error('Failed to parse assessment JSON:', error);
                assessment = { rawResponse: assessmentJson };
            }
            
            // Clean up the file
            try {
                fs.unlinkSync(filePath);
                console.log(`Cleaned up document file: ${filePath}`);
            } catch (cleanupError) {
                console.error('Error cleaning up document file:', cleanupError);
            }
            
            clearTimeout(timeoutId);
            res.status(200).json({
                success: true,
                fileName,
                documentType: documentMetadata.documentType,
                assessment,
                metadata: { 
                    ...documentMetadata,
                    type, 
                    difficulty, 
                    questionCount: numberOfQuestions,
                    textLength: documentText.length
                }
            });
            
        } catch (processingError) {
            // Clean up on processing error
            try {
                if (fs.existsSync(filePath)) {
                    fs.unlinkSync(filePath);
                }
            } catch (cleanupError) {
                console.error('Error cleaning up file after processing error:', cleanupError);
            }
            
            throw processingError; // Re-throw to be caught by outer catch
        }
        
    } catch (error) {
        clearTimeout(timeoutId);
        console.error('Error generating assessment from document:', error);
        
        res.status(500).json({
            success: false,
            message: 'Error generating assessment from document',
            error: error.message
        });
    }
};