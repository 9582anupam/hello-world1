import { generateBotResponse } from "../services/chatbot.service.js";
import { getSubtitles } from 'youtube-captions-scraper';


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

export const fetchSubtitles = async (req, res) => {
    const { videoID = "JC82Il2cjqA", lang = 'en' } = req.query;
    try {
        const subtitles = await getSubtitles({ videoID, lang });
        res.status(200).json({ subtitles });
    } catch (error) {
        console.error('Error fetching subtitles:', error);
        res.status(500).json({ 
            message: 'Error fetching subtitles' 
        });
    }
};

