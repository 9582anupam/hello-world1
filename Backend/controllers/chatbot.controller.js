import { generateBotResponse } from "../services/chatbot.service.js";


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



