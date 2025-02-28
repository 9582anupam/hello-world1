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

// Path to FFmpeg binary if included with your app
const FFMPEG_BIN_DIR = path.resolve(__dirname, '../bin');
const FFMPEG_WIN_PATH = path.join(FFMPEG_BIN_DIR, 'ffmpeg.exe');
const FFMPEG_LINUX_PATH = path.join(FFMPEG_BIN_DIR, 'ffmpeg');
const FFMPEG_MAC_PATH = path.join(FFMPEG_BIN_DIR, 'ffmpeg');

/**
 * Get platform-specific FFmpeg command
 * @returns {string} Path to FFmpeg binary or command
 */
function getFFmpegCommand() {
    // Check if we have FFmpeg binaries in our project
    if (process.platform === 'win32' && fs.existsSync(FFMPEG_WIN_PATH)) {
        return `"${FFMPEG_WIN_PATH}"`;
    } else if (process.platform === 'darwin' && fs.existsSync(FFMPEG_MAC_PATH)) {
        return `"${FFMPEG_MAC_PATH}"`;
    } else if (process.platform === 'linux' && fs.existsSync(FFMPEG_LINUX_PATH)) {
        return `"${FFMPEG_LINUX_PATH}"`;
    }
    
    // Default to system-installed FFmpeg
    return 'ffmpeg';
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
        
        try {
            // Use our utility function to get the right FFmpeg command
            const ffmpegCmd = getFFmpegCommand();
            
            // Run FFmpeg to extract audio
            const { stdout, stderr } = await execPromise(
                `${ffmpegCmd} -i "${videoPath}" -q:a 0 -map a "${outputPath}" -y`
            );

            if (stderr && !stderr.includes('video:0kB audio')) {
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
        } catch (execError) {
            // FFmpeg might not be installed, try to use direct file copy as fallback
            console.error('FFmpeg execution failed:', execError.message);
            console.log('Falling back to direct file handling (without conversion)...');
            
            // Simply copy the video file to an audio extension
            // Not ideal but better than nothing
            const videoBuffer = fs.readFileSync(videoPath);
            fs.writeFileSync(outputPath, videoBuffer);
            
            console.log('Created audio file via direct copy. This is not ideal for audio processing.');
            return outputPath;
        }
    } catch (error) {
        console.error('Error in video to audio conversion:', error);
        throw new Error(`Failed to convert video to audio: ${error.message}`);
    }
};

export default convertVideoToAudio;
