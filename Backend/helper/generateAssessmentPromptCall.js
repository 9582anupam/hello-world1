import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from 'dotenv';
dotenv.config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const generateAssessmentPromptCall = async (reference, type = "MCQ", numberOfQuestions = 5, difficulty = "medium") => {
    try {
        const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" }); // Fixed model name: changed from gemini-1.0-pro to gemini-pro

        // Create assessment generation prompt based on parameters
        const prompt = `
            You are an expert assessment creator. Create a ${difficulty} difficulty assessment with ${numberOfQuestions} ${type} questions based on the following content:

            ${reference}

            ${getQuestionFormatInstructions(type)}

            Format your response as a structured JSON array without any additional explanation. Each question should have the following properties:
            {
            "id": "unique_number",
            "question": "the_question_text",
            "options": ["option_a", "option_b", "option_c", "option_d"],
            "correctAnswer": "correct_option", 
            "explanation": "brief_explanation_of_answer"
            }

            Ensure questions are directly relevant to the content, varied in topic coverage, and appropriate for ${difficulty} difficulty level.`;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        return response.text();
    } catch (error) {
        console.error('Error generating assessment:', error);
        throw new Error('Failed to generate assessment. Please try again later.');
    }
};

// Helper function to get format instructions based on question type
function getQuestionFormatInstructions(type) {
    switch (type.toUpperCase()) {
        case "MCQ":
            return "Create multiple choice questions with 4 options per question. Ensure only one option is correct.";

        case "TF":
            return "Create true/false questions where the answer is either true or false.";

        case "SHORT_ANSWER":
            return "Create questions that require a short (1-2 sentence) response. Include model answers.";

        case "ESSAY":
            return "Create open-ended questions that require detailed responses. Include key points that should be covered in a good response.";

        case "FILL_IN_BLANK":
            return "Create fill-in-the-blank questions where students need to provide the missing word or phrase.";

        case "MATCHING":
            return "Create matching questions where students need to match items from two different columns.";

        default:
            return "Create multiple choice questions with 4 options per question. Ensure only one option is correct.";
    }
}

export default generateAssessmentPromptCall;
