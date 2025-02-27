import { generateBotResponse } from "../services/chatbot.service.js";
import { fetchYouTubeAudio } from "../helper/fetchYouTubeAudio.js";
import fs from 'fs';
import path from 'path';

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
    // Set an early timeout to avoid gateway timeouts
    const abortController = new AbortController();
    const timeoutId = setTimeout(() => {
        abortController.abort();
        res.status(504).json({
            message: 'Processing timed out',
            error: 'Server response timeout. Please try again or try a different video.'
        });
    }, 45000);

    try {
        const videoUrl = req.query.videoUrl || "https://www.youtube.com/watch?v=JC82Il2cjqA";
        console.log('Processing URL:', videoUrl);
        
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
        
        // Handle range requests for better streaming
        const range = req.headers.range;
        
        if (range) {
            const parts = range.replace(/bytes=/, "").split("-");
            const start = parseInt(parts[0], 10);
            const end = parts[1] ? parseInt(parts[1], 10) : stat.size - 1;
            const chunkSize = (end - start) + 1;
            
            console.log(`Range request: ${start}-${end}/${stat.size}`);
            
            res.writeHead(206, {
                'Content-Range': `bytes ${start}-${end}/${stat.size}`,
                'Accept-Ranges': 'bytes',
                'Content-Length': chunkSize,
                'Content-Type': 'audio/mpeg'
            });
            
            const stream = fs.createReadStream(audioPath, { start, end });
            stream.pipe(res);
        } else {
            // Set headers for full file download/preview
            res.writeHead(200, {
                'Content-Length': stat.size,
                'Content-Type': 'audio/mpeg',
                'Accept-Ranges': 'bytes',
                'Cache-Control': 'no-cache',
                'X-Content-Type-Options': 'nosniff',
                // Use inline for preview in browser, attachment for download
                'Content-Disposition': req.query.download 
                    ? 'attachment; filename="audio.mp3"' 
                    : 'inline'
            });
            
            // Stream the file
            fs.createReadStream(audioPath).pipe(res);
        }

        // Optional: Clean up temp file after sending
        res.on('close', () => {
            // Wait slightly before deleting to ensure transfer completes
            setTimeout(() => {
                fs.unlink(audioPath, (err) => {
                    if (err) console.error('Error deleting temp file:', err);
                });
            }, 1000);
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

