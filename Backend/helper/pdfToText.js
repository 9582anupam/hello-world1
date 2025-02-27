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
const OCR_API_KEY = process.env.OCR_API_KEY;

/**
 * Extract text directly from PDF using pdf-parse (no OCR)
 * Split content by pages
 * @param {Buffer} pdfBuffer - PDF file buffer
 * @returns {Promise<Object>} Object with text by pages and full text
 */
const extractTextFromPDF = async (pdfBuffer) => {
    try {
        console.log('Extracting text directly from PDF...');
        
        // Configure render options to track page breaks
        const renderOptions = {
            pagerender: function(pageData) {
                // Return text content from this page
                return pageData.getTextContent()
                    .then(function(textContent) {
                        let lastY = null;
                        let text = '';
                        
                        // Process each text item
                        for (const item of textContent.items) {
                            // Add newlines for vertical position changes
                            if (lastY !== null && lastY !== item.transform[5]) {
                                text += '\n';
                            }
                            text += item.str;
                            lastY = item.transform[5];
                        }
                        
                        return text;
                    });
            }
        };
        
        // Parse PDF with custom renderer
        const data = await pdf(pdfBuffer, renderOptions);
        
        // Extract text from each page
        const pages = [];
        for (let i = 0; i < data.numpages; i++) {
            const pageNum = i + 1;
            const pageText = data.text.split(/\f/)[i] || '';
            
            pages.push({
                pageNumber: pageNum,
                text: pageText.trim()
            });
        }
        
        return {
            allText: data.text,
            pageCount: data.numpages,
            pages: pages
        };
    } catch (error) {
        console.error('Error in direct PDF text extraction:', error);
        throw new Error(`Failed to extract text from PDF: ${error.message}`);
    }
};

/**
 * Process PDF with OCR using OCR.space API
 * Returns text by page
 * @param {string} pdfPath - Path to PDF file
 * @returns {Promise<Object>} Object with text by pages and full text
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
        formData.append('isTable', 'true'); // Better table detection

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

        // Process pages
        let allText = '';
        const pages = [];
        
        if (response.data.ParsedResults && response.data.ParsedResults.length > 0) {
            response.data.ParsedResults.forEach((result, index) => {
                const pageText = result.ParsedText;
                allText += pageText + '\n';
                
                pages.push({
                    pageNumber: index + 1,
                    text: pageText.trim(),
                    exitCode: result.FileParseExitCode,
                    confidence: result.TextOverlay?.Lines ? 
                        Math.round(result.TextOverlay.Lines.reduce((sum, line) => 
                            sum + line.Words.reduce((wSum, word) => wSum + word.Confidence, 0), 0) / 
                            result.TextOverlay.Lines.reduce((sum, line) => sum + line.Words.length, 0)) : 
                        null
                });
            });
        }

        return {
            allText: allText.trim(),
            pageCount: pages.length,
            pages: pages
        };
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
 * @returns {Promise<Object>} Object with text by pages and full text
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
            
            if (!fs.existsSync(pdfPath)) {
                throw new Error(`PDF file not found at: ${pdfPath}`);
            }
        } else {
            throw new Error('Invalid input: must be a buffer or file path');
        }

        // Read the PDF file
        const pdfBuffer = fs.readFileSync(pdfPath);

        let extractionResult;

        if (!forceOCR) {
            try {
                // Try direct text extraction first
                extractionResult = await extractTextFromPDF(pdfBuffer);

                // Check if text extraction yielded sufficient content
                // If there's very little text, it might be a scanned document
                const totalTextLength = extractionResult.allText.trim().length;
                if (totalTextLength < 100) {
                    console.log('Direct extraction yielded limited text, trying OCR...');
                    extractionResult = await processPDFWithOCR(pdfPath);
                }
            } catch (directError) {
                console.warn('Direct text extraction failed, falling back to OCR:', directError.message);
                extractionResult = await processPDFWithOCR(pdfPath);
            }
        } else {
            // Skip direct extraction if OCR is forced
            extractionResult = await processPDFWithOCR(pdfPath);
        }

        // Get metadata about the file
        const fileStats = fs.statSync(pdfPath);
        
        // Add file metadata
        return {
            ...extractionResult,
            metadata: {
                filename: path.basename(pdfPath),
                size: fileStats.size,
                created: fileStats.birthtime,
                modified: fileStats.mtime,
                ocrUsed: forceOCR || extractionResult.pages.some(page => page.exitCode !== undefined)
            }
        };
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
