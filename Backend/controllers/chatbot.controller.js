import { generateBotResponse } from "../services/chatbot.service.js";
import { fetchYouTubeAudio } from "../helper/fetchYouTubeAudio.js";
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
    // Increased timeout for the overall process
    const abortController = new AbortController();
    const timeoutId = setTimeout(() => {
        abortController.abort();
        res.status(504).json({
            message: 'Processing timed out',
            error: 'Server response timeout. Please try again or try a different video.'
        });
    }, 45000); // 45 second max timeout

    try {
        const videoUrl = req.query.videoUrl || "https://www.youtube.com/watch?v=JC82Il2cjqA";
        console.log('Processing URL:', videoUrl);
        
        // Check if video URL is for a short video (suitable for serverless)
        if (req.query.videoUrl && !req.query.force) {
            try {
                const videoId = videoUrl.split('v=')[1].split('&')[0];
                // You could implement a quick check here to verify video length
                console.log(`Processing video ID: ${videoId}`);
            } catch (e) {
                console.error('Error parsing video URL:', e);
            }
        }
        
        // Start audio fetch
        const audioPath = await fetchYouTubeAudio(videoUrl);
        
        // Clear the timeout as we've successfully fetched the audio
        clearTimeout(timeoutId);

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
        clearTimeout(timeoutId);
        console.error('Error fetching YouTube audio:', error);
        
        // More specific error handling
        if (error.message.includes('timed out') || error.message.includes('timeout')) {
            return res.status(504).json({
                message: 'YouTube download timed out',
                error: 'The server took too long to respond. Try a shorter video.'
            });
        }
        
        if (error.message.includes('too long')) {
            return res.status(413).json({
                message: 'Video too long',
                error: 'Videos must be under 5 minutes for processing in serverless environments.'
            });
        }
        
        res.status(500).json({ 
            message: 'Error fetching audio',
            error: error.message 
        });
    }
};

