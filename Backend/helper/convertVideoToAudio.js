import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { exec } from 'child_process';
import { v4 as uuidv4 } from 'uuid';
import util from 'util';

const execPromise = util.promisify(exec);

// Setup paths
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const TEMP_DIR = path.resolve(__dirname, '../temp');

// Ensure temp directory exists
if (!fs.existsSync(TEMP_DIR)) {
    fs.mkdirSync(TEMP_DIR, { recursive: true });
}

/**
 * Convert a video file to audio using ffmpeg
 * @param {string} videoPath - Path to the video file
 * @param {string} [outputPath] - Optional custom output path
 * @returns {Promise<string>} Path to the extracted audio file
 */
const convertVideoToAudio = async (videoPath, outputPath = null) => {
    try {
        // Validate that video file exists
        if (!fs.existsSync(videoPath)) {
            throw new Error(`Video file not found at: ${videoPath}`);
        }

        // Generate output path if not provided
        if (!outputPath) {
            const videoFileName = path.basename(videoPath, path.extname(videoPath));
            outputPath = path.join(TEMP_DIR, `${videoFileName}_${uuidv4()}.mp3`);
        }

        console.log(`Converting video: ${videoPath}`);
        console.log(`Output audio: ${outputPath}`);

        // Run ffmpeg to extract audio
        const { stdout, stderr } = await execPromise(
            `ffmpeg -i "${videoPath}" -q:a 0 -map a "${outputPath}" -y`
        );

        if (stderr) {
            console.warn('FFmpeg warnings/info:', stderr);
        }

        // Verify that the audio file was created
        if (!fs.existsSync(outputPath)) {
            throw new Error('Audio extraction failed - output file not created');
        }

        // Check if file is not empty
        const stats = fs.statSync(outputPath);
        if (stats.size === 0) {
            throw new Error('Audio extraction failed - output file is empty');
        }

        console.log(`Audio extraction complete. Audio file size: ${stats.size} bytes`);
        return outputPath;
    } catch (error) {
        console.error('Error in video to audio conversion:', error);
        throw new Error(`Failed to convert video to audio: ${error.message}`);
    }
};

export default convertVideoToAudio;
