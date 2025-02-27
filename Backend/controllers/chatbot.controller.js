import { generateBotResponse } from "../services/chatbot.service.js";
import { fetchYouTubeAudio } from "../helper/fetchYouTubeAudio.js";
import { transcribeAudio } from "../helper/transcribeAudio.js";


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
        // const { videoUrl } = req.body;
        const videoUrl = "https://www.youtube.com/watch?v=JC82Il2cjqA";
        if (!videoUrl) {
            return res.status(400).json({
                message: 'Missing video URL'
            });
        }

        const filePath = await fetchYouTubeAudio(videoUrl);
        res.status(200).json({ filePath });
    } catch (error) {
        console.error('Error fetching YouTube audio:', error);
        res.status(500).json({
            message: 'Error fetching YouTube audio'
        });
    }
};



export const audioToTranscript = async (req, res) => {
    try {
        const { filePath } = req.body;
        console.log('filePath:', req.body);
        // const filePath = "/path/to/your/audio/file.wav";
        if (!filePath) {
            return res.status(400).json({
                message: 'Missing audio file path'
            });
        }

        const transcript = await transcribeAudio(filePath);
        res.status(200).json({ transcript });
    }
    catch (error) {
        console.error('Error transcribing audio:', error);
        res.status(500).json({
            message: 'Error transcribing audio'
        });
    }
};