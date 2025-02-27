import { generateBotResponse } from "../services/chatbot.service.js";
import { fetchYouTubeAudio } from "../helper/fetchYouTubeAudio.js";
import { loadCookies } from "../helper/loadCookies.js";
import fs from 'fs';

export const getBotResponse = async (req, res) => {
    try {
        const response = await generateBotResponse();
        res.status(200).json({ response });
    } catch (error) {
        console.error('Error in chatbot response:', error);
        res.status(500).json({ 
            message: 'Error generating response' 
        });
    }
};

export const ytToAudio = async (req, res) => {
    try {
        const videoUrl = req.query.videoUrl || "https://www.youtube.com/watch?v=eEWa7cpiyD8";
        const cookieString = loadCookies();
        const audioPath = await fetchYouTubeAudio(videoUrl, cookieString);

        // Check if file exists
        if (!fs.existsSync(audioPath)) {
            throw new Error('Audio file not found');
        }

        // Get file stats for content-length
        const stat = fs.statSync(audioPath);
        
        // Set headers
        res.writeHead(200, {
            'Content-Type': 'audio/mpeg',
            'Content-Length': stat.size,
            'Content-Disposition': 'attachment; filename="audio.mp3"'
        });

        // Stream the file
        const readStream = fs.createReadStream(audioPath);
        readStream.pipe(res);

        // Optional: Clean up temp file after sending
        readStream.on('end', () => {
            fs.unlink(audioPath, (err) => {
                if (err) console.error('Error deleting temp file:', err);
            });
        });
    } catch (error) {
        console.error('Error fetching YouTube audio:', error);
        res.status(500).json({ 
            message: 'Error fetching audio',
            error: error.message 
        });
    }
};

