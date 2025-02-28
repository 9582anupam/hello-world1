import { generateBotResponse } from "../services/chatbot.service.js";


const getBotResponse = async (req, res) => {
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


const generateAssessment = async (req, res) => {
    try {
        const assessment = await generateBotResponse();
        res.status(200).json({ assessment });
    } catch (error) {
        console.error('Error in generating assessment:', error);
        res.status(500).json({
            message: 'Error generating assessment'
        });
    }
};


export { getBotResponse, generateAssessment };


