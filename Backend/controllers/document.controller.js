import fs from 'fs';
import path from 'path';
import { extractTextFromPdfFile } from '../helper/pdfToText.js';
import { v4 as uuidv4 } from 'uuid';
import multer from 'multer';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

// Set up file paths
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const UPLOAD_DIR = path.resolve(__dirname, '../uploads');

// Ensure uploads directory exists
if (!fs.existsSync(UPLOAD_DIR)) {
    fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

// Configure multer storage
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, UPLOAD_DIR);
    },
    filename: function (req, file, cb) {
        const uniqueFilename = `${uuidv4()}_${file.originalname}`;
        cb(null, uniqueFilename);
    }
});

const fileFilter = (req, file, cb) => {
    // Accept only PDFs
    if (file.mimetype === 'application/pdf') {
        cb(null, true);
    } else {
        cb(new Error('Only PDF files are allowed'), false);
    }
};

export const upload = multer({
    storage,
    fileFilter,
    limits: {
        fileSize: 10 * 1024 * 1024 // 10 MB file size limit
    }
});

/**
 * Controller function to handle PDF upload and text extraction
 */
export const processPdf = async (req, res) => {
    const timeoutId = setTimeout(() => {
        res.status(504).json({
            success: false,
            message: 'Processing timed out',
            error: 'The request took too long to process. Please try with a smaller file.'
        });
    }, 120000); // 2 minute timeout for large files

    try {
        // Check if file was uploaded
        if (!req.file) {
            clearTimeout(timeoutId);
            return res.status(400).json({
                success: false,
                message: 'No PDF file provided',
                error: 'Please upload a PDF file'
            });
        }

        const filePath = req.file.path;
        const useOcr = req.body.useOcr === 'true' || req.body.useOcr === true;

        console.log(`Processing PDF: ${filePath}, Force OCR: ${useOcr}`);

        // Extract text from PDF
        const extractedText = await extractTextFromPdfFile(filePath, useOcr);

        clearTimeout(timeoutId);

        // Optional: Delete the uploaded file after processing
        try {
            fs.unlinkSync(filePath);
        } catch (err) {
            console.error('Error deleting uploaded file:', err);
            // Continue even if deletion fails
        }

        // Send response with extracted text
        res.status(200).json({
            success: true,
            text: extractedText,
            length: extractedText.length,
            message: 'PDF processed successfully'
        });

    } catch (error) {
        clearTimeout(timeoutId);
        console.error('Error processing PDF:', error);

        res.status(500).json({
            success: false,
            message: 'Error processing PDF',
            error: error.message
        });
    }
};

/**
 * Controller function to get processing status (in case we implement async processing)
 */
export const getProcessingStatus = async (req, res) => {
    try {
        const { jobId } = req.params;

        // For now, this is a placeholder for future async processing
        res.status(200).json({
            success: true,
            jobId,
            status: 'completed',
            message: 'PDF processing is complete'
        });

    } catch (error) {
        console.error('Error getting processing status:', error);

        res.status(500).json({
            success: false,
            message: 'Error getting processing status',
            error: error.message
        });
    }
};
