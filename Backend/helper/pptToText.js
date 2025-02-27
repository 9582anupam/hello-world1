import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { v4 as uuidv4 } from 'uuid';
import dotenv from 'dotenv';
import { exec } from 'child_process';
import JSZip from 'jszip';
import xml2js from 'xml2js';

// Initialize environment variables and paths
dotenv.config();
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const TEMP_DIR = path.resolve(__dirname, '../temp');

// Ensure temp directory exists
if (!fs.existsSync(TEMP_DIR)) {
  fs.mkdirSync(TEMP_DIR, { recursive: true });
}

/**
 * Extract text from PPT/PPTX file
 * @param {Buffer|string} pptInput - PowerPoint file buffer or path
 * @returns {Promise<object>} Object containing extracted text and metadata
 */
export const extractTextFromPptFile = async (pptInput) => {
  let pptPath = '';
  let shouldDeleteTempFile = false;
  
  try {
    // Determine if input is a buffer or a path
    if (Buffer.isBuffer(pptInput)) {
      // Save buffer to temp file
      const tempFileName = `ppt_${uuidv4()}.${determineExtension(pptInput)}`;
      pptPath = path.join(TEMP_DIR, tempFileName);
      fs.writeFileSync(pptPath, pptInput);
      shouldDeleteTempFile = true;
    } else if (typeof pptInput === 'string') {
      // Input is already a path
      pptPath = pptInput;
      if (!fs.existsSync(pptPath)) {
        throw new Error(`PowerPoint file not found at: ${pptPath}`);
      }
    } else {
      throw new Error('Invalid input: must be a buffer or file path');
    }
    
    // Check file extension to use appropriate extraction method
    const extension = path.extname(pptPath).toLowerCase();
    
    // Process based on file type
    let result;
    if (extension === '.pptx') {
      result = await extractFromPptx(pptPath);
    } else if (extension === '.ppt') {
      result = await extractFromPpt(pptPath);
    } else {
      throw new Error('Unsupported file format. Only .ppt and .pptx are supported.');
    }
    
    return result;
  } catch (error) {
    console.error('Error extracting text from PowerPoint:', error);
    throw new Error(`Failed to extract text from PowerPoint: ${error.message}`);
  } finally {
    // Clean up temp file if we created one
    if (shouldDeleteTempFile && fs.existsSync(pptPath)) {
      try {
        fs.unlinkSync(pptPath);
        console.log('Temporary PowerPoint file deleted');
      } catch (err) {
        console.error('Error deleting temporary PowerPoint file:', err);
      }
    }
  }
};

/**
 * Try to determine file extension from buffer content
 * @param {Buffer} buffer - File buffer
 * @returns {string} File extension (pptx or ppt)
 */
function determineExtension(buffer) {
  // Check for PPTX signature (ZIP file)
  if (buffer[0] === 0x50 && buffer[1] === 0x4B) {
    return 'pptx';
  }
  // Default to PPT
  return 'ppt';
}

/**
 * Extract text from PPTX file format (newer XML-based format)
 * @param {string} filePath - Path to PPTX file
 * @returns {Promise<object>} Extracted text by slide
 */
async function extractFromPptx(filePath) {
  try {
    console.log(`Reading PPTX file: ${filePath}`);
    
    // Read the file as a ZIP archive
    const content = fs.readFileSync(filePath);
    const zip = await JSZip.loadAsync(content);
    
    // Parse presentation data
    const slideCount = countSlides(zip);
    console.log(`Found ${slideCount} slides`);
    
    // Extract text from slides
    const slideTexts = [];
    const parser = new xml2js.Parser({ explicitArray: false });
    const parseXml = (data) => new Promise((resolve, reject) => {
      parser.parseString(data, (err, result) => {
        if (err) reject(err);
        else resolve(result);
      });
    });
    
    // Process each slide
    for (let i = 1; i <= slideCount; i++) {
      try {
        // Extract slide content
        const slideKey = `ppt/slides/slide${i}.xml`;
        if (!zip.files[slideKey]) continue;
        
        const slideXml = await zip.file(slideKey).async('string');
        const slideObj = await parseXml(slideXml);
        
        // Extract text from this slide
        let slideText = extractTextFromSlideXml(slideObj);
        
        slideTexts.push({
          slideNumber: i,
          text: slideText
        });
      } catch (slideError) {
        console.error(`Error processing slide ${i}:`, slideError);
        slideTexts.push({
          slideNumber: i,
          text: `[Error extracting text from slide ${i}: ${slideError.message}]`
        });
      }
    }
    
    // Extract any notes if available
    const noteTexts = [];
    for (let i = 1; i <= slideCount; i++) {
      try {
        const noteKey = `ppt/notesSlides/notesSlide${i}.xml`;
        if (zip.files[noteKey]) {
          const noteXml = await zip.file(noteKey).async('string');
          const noteObj = await parseXml(noteXml);
          const noteText = extractTextFromSlideXml(noteObj);
          
          if (noteText.trim()) {
            noteTexts.push({
              slideNumber: i,
              text: noteText
            });
          }
        }
      } catch (noteError) {
        console.warn(`Error processing note ${i}:`, noteError);
      }
    }
    
    // Extract presentation metadata
    let title = '';
    let description = '';
    try {
      if (zip.files['docProps/core.xml']) {
        const coreXml = await zip.file('docProps/core.xml').async('string');
        const coreObj = await parseXml(coreXml);
        
        if (coreObj['cp:coreProperties']) {
          const props = coreObj['cp:coreProperties'];
          title = props['dc:title'] || '';
          description = props['dc:description'] || '';
        }
      }
    } catch (metaError) {
      console.warn('Error extracting metadata:', metaError);
    }
    
    // Combine all text
    const allText = slideTexts.map(slide => slide.text).join('\n\n');
    
    return {
      title,
      description,
      slideCount,
      allText,
      slides: slideTexts,
      notes: noteTexts
    };
  } catch (error) {
    console.error('Error extracting text from PPTX:', error);
    throw error;
  }
}

/**
 * Extract text from PPT file format (older binary format)
 * @param {string} filePath - Path to PPT file
 * @returns {Promise<object>} Extracted text by slide
 */
async function extractFromPpt(filePath) {
  try {
    console.log(`Processing PPT file: ${filePath}`);
    
    // Since binary PPT is harder to parse, we'll use text extraction tool or conversion
    // Option 1: Use Apache Tika (if available)
    try {
      return await extractWithTika(filePath);
    } catch (tikaError) {
      console.log('Tika extraction failed, falling back to conversion method:', tikaError.message);
    }
    
    // Option 2: Convert to PPTX and then extract
    try {
      const pptxPath = await convertPptToPptx(filePath);
      const result = await extractFromPptx(pptxPath);
      
      // Clean up converted file
      try {
        fs.unlinkSync(pptxPath);
      } catch (cleanupError) {
        console.warn('Failed to delete temporary PPTX:', cleanupError);
      }
      
      return result;
    } catch (conversionError) {
      console.error('Conversion to PPTX failed:', conversionError);
      
      // Option 3: Extract text using simpler method
      return await extractPptTextBasic(filePath);
    }
  } catch (error) {
    console.error('Error extracting text from PPT:', error);
    throw error;
  }
}

/**
 * Count slides in a PPTX file
 * @param {JSZip} zip - Loaded PPTX as ZIP
 * @returns {number} Number of slides
 */
function countSlides(zip) {
  let max = 0;
  for (const key in zip.files) {
    const match = key.match(/ppt\/slides\/slide(\d+)\.xml/);
    if (match && match[1]) {
      const num = parseInt(match[1], 10);
      if (num > max) max = num;
    }
  }
  return max;
}

/**
 * Extract text from slide XML
 * @param {object} slideObj - Parsed slide XML
 * @returns {string} Extracted text
 */
function extractTextFromSlideXml(slideObj) {
  try {
    let result = '';
    
    // Navigate through the slide object to find text
    if (slideObj && slideObj['p:sld'] && slideObj['p:sld']['p:cSld']) {
      const content = slideObj['p:sld']['p:cSld'];
      
      if (content['p:spTree']) {
        const shapes = content['p:spTree'];
        
        // Process shape tree
        if (shapes['p:sp']) {
          const textShapes = Array.isArray(shapes['p:sp']) ? shapes['p:sp'] : [shapes['p:sp']];
          
          for (const shape of textShapes) {
            if (shape['p:txBody']) {
              result += extractTextFromTextBody(shape['p:txBody']) + '\n';
            }
          }
        }
        
        // Process group shapes
        if (shapes['p:grpSp']) {
          const groupShapes = Array.isArray(shapes['p:grpSp']) ? shapes['p:grpSp'] : [shapes['p:grpSp']];
          
          for (const group of groupShapes) {
            if (group['p:sp']) {
              const subShapes = Array.isArray(group['p:sp']) ? group['p:sp'] : [group['p:sp']];
              
              for (const shape of subShapes) {
                if (shape['p:txBody']) {
                  result += extractTextFromTextBody(shape['p:txBody']) + '\n';
                }
              }
            }
          }
        }
      }
    }
    
    return result.trim();
  } catch (error) {
    console.error('Error extracting text from slide XML:', error);
    return '';
  }
}

/**
 * Extract text from text body XML
 * @param {object} txBody - Text body XML object
 * @returns {string} Extracted text
 */
function extractTextFromTextBody(txBody) {
  try {
    let result = '';
    
    if (txBody['a:p']) {
      const paragraphs = Array.isArray(txBody['a:p']) ? txBody['a:p'] : [txBody['a:p']];
      
      for (const paragraph of paragraphs) {
        if (paragraph['a:r']) {
          const runs = Array.isArray(paragraph['a:r']) ? paragraph['a:r'] : [paragraph['a:r']];
          
          for (const run of runs) {
            if (run['a:t']) {
              result += run['a:t'] + ' ';
            }
          }
        } else if (paragraph['a:fld'] && paragraph['a:fld']['a:t']) {
          result += paragraph['a:fld']['a:t'] + ' ';
        } else if (paragraph['a:t']) {
          // Direct text in paragraph
          result += paragraph['a:t'] + ' ';
        } else if (typeof paragraph === 'string') {
          // Sometimes text is directly in the paragraph
          result += paragraph + ' ';
        }
        
        result += '\n';
      }
    }
    
    return result.trim();
  } catch (error) {
    console.error('Error extracting text from text body:', error);
    return '';
  }
}

/**
 * Extract text using Apache Tika (if available)
 * @param {string} filePath - Path to PPT file
 * @returns {Promise<object>} Extracted text
 */
async function extractWithTika(filePath) {
  return new Promise((resolve, reject) => {
    // This would use Tika server if available
    // For now, we'll reject to use the fallback methods
    reject(new Error('Tika extraction not implemented'));
  });
}

/**
 * Convert PPT to PPTX format (requires LibreOffice or similar)
 * @param {string} pptPath - Path to PPT file
 * @returns {Promise<string>} Path to converted PPTX file
 */
async function convertPptToPptx(pptPath) {
  return new Promise((resolve, reject) => {
    const outputDir = TEMP_DIR;
    const pptxPath = path.join(outputDir, `${path.basename(pptPath, '.ppt')}_${uuidv4()}.pptx`);
    
    // Try to use LibreOffice for conversion
    exec(`soffice --headless --convert-to pptx --outdir "${outputDir}" "${pptPath}"`, (error, stdout, stderr) => {
      if (error) {
        console.warn(`LibreOffice conversion failed: ${error.message}`);
        reject(new Error(`Failed to convert PPT to PPTX: ${error.message}`));
        return;
      }
      
      resolve(pptxPath);
    });
  });
}

/**
 * Basic text extraction for PPT when other methods fail
 * @param {string} filePath - Path to PPT file
 * @returns {Promise<object>} Extracted text
 */
async function extractPptTextBasic(filePath) {
  // Basic binary search for text in PPT file
  return new Promise((resolve, reject) => {
    fs.readFile(filePath, (err, data) => {
      if (err) {
        reject(err);
        return;
      }
      
      try {
        // Convert to string
        const str = data.toString('binary');
        
        // Extract text using regex - very basic and limited
        const textChunks = [];
        let regex = /[\u0020-\u007E\u00A0-\u00FF]{4,}/g;
        let match;
        
        while ((match = regex.exec(str)) !== null) {
          if (match[0].length > 10 && !match[0].includes('PPTX')) {
            textChunks.push(match[0]);
          }
        }
        
        const extractedText = textChunks.join('\n');
        
        resolve({
          title: path.basename(filePath, '.ppt'),
          description: '',
          slideCount: 1,
          allText: extractedText,
          slides: [{ slideNumber: 1, text: extractedText }],
          notes: []
        });
      } catch (error) {
        reject(error);
      }
    });
  });
}

export default extractTextFromPptFile;
