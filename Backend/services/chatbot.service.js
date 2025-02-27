import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from 'dotenv';
dotenv.config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

export const generateBotResponse = async () => {
    try {
        const model = genAI.getGenerativeModel({ model: "gemini-pro" });
        
        // Create a context-aware prompt with language instruction
        const prompt = "hello world";

        const result = await model.generateContent(prompt);
        const response = await result.response;
        return response.text();
    } catch (error) {
        console.error('Error generating chatbot response:', error);
        return "I apologize, but I'm having trouble processing your question. Please try asking in a different way or contact support for assistance.";
    }
};
