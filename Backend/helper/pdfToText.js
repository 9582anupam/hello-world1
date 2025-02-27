import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import axios from 'axios';
import pdf from 'pdf-parse/lib/pdf-parse.js'
import FormData from 'form-data';
import { v4 as uuidv4 } from 'uuid';
import dotenv from 'dotenv';

// Initialize environment variables and paths
dotenv.config();
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const TEMP_DIR = path.resolve(__dirname, '../temp');

// Ensure temp directory exists
if (!fs.existsSync(TEMP_DIR)) {
  fs.mkdirSync(TEMP_DIR, { recursive: true });
}

// OCR Space API key
const OCR_API_KEY = process.env.OCR_API_KEY || 'K89659528088957';

/**
 * Extract text directly from PDF using pdf-parse (no OCR)
 * @param {Buffer} pdfBuffer - PDF file buffer
 * @returns {Promise<string>} Extracted text
 */
const extractTextFromPDF = async (pdfBuffer) => {
    try {
        console.log('Extracting text directly from PDF...');
        const data = await pdf(pdfBuffer);
        return data.text;
    } catch (error) {
        console.error('Error in direct PDF text extraction:', error);
        throw new Error(`Failed to extract text from PDF: ${error.message}`);
    }
};

/**
 * Process PDF with OCR using OCR.space API
 * @param {string} pdfPath - Path to PDF file
 * @returns {Promise<string>} Extracted text
 */
const processPDFWithOCR = async (pdfPath) => {
    try {
        console.log('Processing PDF with OCR...');

        const formData = new FormData();
        formData.append('file', fs.createReadStream(pdfPath));
        formData.append('apikey', OCR_API_KEY);
        formData.append('language', 'eng');
        formData.append('isCreateSearchablePdf', 'false');
        formData.append('isSearchablePdfHideTextLayer', 'false');
        formData.append('scale', 'true');
        formData.append('detectOrientation', 'true');
        formData.append('OCREngine', '2'); // More accurate OCR engine

        const response = await axios.post('https://api.ocr.space/parse/image', formData, {
            headers: {
                ...formData.getHeaders(),
            },
            maxContentLength: Infinity,
            maxBodyLength: Infinity,
            timeout: 120000 // 2 minutes timeout
        });

        if (response.data.IsErroredOnProcessing) {
            throw new Error(`OCR processing error: ${response.data.ErrorMessage}`);
        }

        // Concatenate text from all pages
        let fullText = '';
        if (response.data.ParsedResults && response.data.ParsedResults.length > 0) {
            response.data.ParsedResults.forEach(result => {
                fullText += result.ParsedText + '\n';
            });
        }

        return fullText;
    } catch (error) {
        console.error('Error in OCR processing:', error);
        throw new Error(`OCR processing failed: ${error.message}`);
    }
};

/**
 * Main function to extract text from PDF
 * Tries direct extraction first, falls back to OCR if needed
 * @param {Buffer|string} pdfInput - PDF file buffer or path
 * @param {boolean} forceOCR - Force OCR even if direct extraction works
 * @returns {Promise<string>} Extracted text
 */
export const extractTextFromPdfFile = async (pdfInput, forceOCR = false) => {
    let pdfPath = '';
    let shouldDeleteTempFile = false;

    try {
        // Determine if input is a buffer or a path
        if (Buffer.isBuffer(pdfInput)) {
            // Save buffer to temp file
            const tempFileName = `pdf_${uuidv4()}.pdf`;
            pdfPath = path.join(TEMP_DIR, tempFileName);
            fs.writeFileSync(pdfPath, pdfInput);
            shouldDeleteTempFile = true;
        } else if (typeof pdfInput === 'string') {
            // Input is already a path
            pdfPath = pdfInput;
        } else {
            throw new Error('Invalid input: must be a buffer or file path');
        }

        // Read the PDF file
        const pdfBuffer = fs.readFileSync(pdfPath);

        let extractedText = '';

        if (!forceOCR) {
            try {
                // Try direct text extraction first
                extractedText = await extractTextFromPDF(pdfBuffer);

                // Check if text extraction yielded sufficient content
                // If there's very little text, it might be a scanned document
                if (extractedText.trim().length < 100) {
                    console.log('Direct extraction yielded limited text, trying OCR...');
                    extractedText = await processPDFWithOCR(pdfPath);
                }
            } catch (directError) {
                console.warn('Direct text extraction failed, falling back to OCR:', directError.message);
                extractedText = await processPDFWithOCR(pdfPath);
            }
        } else {
            // Skip direct extraction if OCR is forced
            extractedText = await processPDFWithOCR(pdfPath);
        }

        return extractedText.trim();
    } catch (error) {
        console.error('Error in PDF text extraction:', error);
        throw new Error(`Failed to extract text from PDF: ${error.message}`);
    } finally {
        // Clean up temp file if we created one
        if (shouldDeleteTempFile && fs.existsSync(pdfPath)) {
            try {
                fs.unlinkSync(pdfPath);
                console.log('Temporary PDF file deleted');
            } catch (err) {
                console.error('Error deleting temporary PDF file:', err);
            }
        }
    }
};

export default extractTextFromPdfFile;
