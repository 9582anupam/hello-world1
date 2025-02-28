import axios from 'axios';
import transcribeAudioVideo from '../helper/transcribeAudioVideo.js';
import fetchYouTubeAudio from '../helper/fetchYouTubeAudio.js';
import generateAssessmentPromptCall from '../helper/generateAssessmentPromptCall.js';
import ytdl from '@distube/ytdl-core';

/**
 * Generate assessment questions from YouTube video content
 * @route POST /api/assessment/youtube
 * @param {Object} req.body.videoUrl - YouTube video URL
 * @param {Object} req.body.numberOfQuestions - Number of questions to generate (default: 5)
 * @param {Object} req.body.difficulty - Difficulty level (easy, medium, hard)
 * @param {Object} req.body.type - Question type (MCQ, TF, SHORT_ANSWER, etc.)
 * @returns {Object} Generated assessment questions
 */
const generateAssessmentFromYoutube = async (req, res) => {
    // Start timeout to prevent long-running requests
    const timeoutId = setTimeout(() => {
        res.status(504).json({
            success: false,
            message: 'Request timed out',
            error: 'Processing took too long. Try with a shorter video.'
        });
    }, 180000); // 3 minute timeout

    try {
        // Validate request parameters
        const { videoUrl } = req.body;

        if (!videoUrl) {
            clearTimeout(timeoutId);
            return res.status(400).json({
                success: false,
                message: 'Missing required parameters',
                error: 'Video URL is required'
            });
        }

        // Extract optional parameters with defaults
        const numberOfQuestions = parseInt(req.body.numberOfQuestions) || 5;
        const difficulty = req.body.difficulty || 'medium';
        const type = req.body.type || 'MCQ';

        // Validate YouTube URL format
        if (!videoUrl.includes('youtube.com/') && !videoUrl.includes('youtu.be/')) {
            clearTimeout(timeoutId);
            return res.status(400).json({
                success: false,
                message: 'Invalid YouTube URL',
                error: 'Please provide a valid YouTube URL'
            });
        }

        console.log(`Generating ${numberOfQuestions} ${difficulty} ${type} questions from: ${videoUrl}`);

        // Extract video ID from URL
        let videoId = ytdl.getURLVideoID(videoUrl);

        if (!videoId) {
            clearTimeout(timeoutId);
            return res.status(400).json({
                success: false,
                message: 'Invalid YouTube URL format',
                error: 'Could not extract video ID from URL'
            });
        }

        // First try to get transcript from Python service
        console.log(`Fetching transcript from Python service for video ID: ${videoId}`);
        let transcript;
        try {
            const pythonServiceResponse = await axios.get(
                `https://product-answer.vercel.app/api/transcript/${videoId}`,
                { timeout: 20000 }
            );

            if (pythonServiceResponse.data?.transcript) {
                console.log('Obtained transcript from Python service');
                transcript = pythonServiceResponse.data.transcript;
            }
        } catch (pythonServiceError) {
            console.log('Python service failed, will try manual extraction:', pythonServiceError.message);
        }

        // If Python service failed, extract audio and transcribe it manually
        if (!transcript) {
            console.log('Starting manual audio extraction and transcription...');
            try {
                const audioPath = await fetchYouTubeAudio(videoUrl);
                console.log(`Audio downloaded to: ${audioPath}`);

                const transcriptionResult = await transcribeAudioVideo(audioPath);
                transcript = transcriptionResult.text || '';

                console.log(`Manual transcription complete: ${transcript.substring(0, 50)}...`);
            } catch (manualExtractionError) {
                clearTimeout(timeoutId);
                return res.status(500).json({
                    success: false,
                    message: 'Failed to extract transcript',
                    error: manualExtractionError.message
                });
            }
        }

        if (!transcript) {
            clearTimeout(timeoutId);
            return res.status(400).json({
                success: false,
                message: 'No audio available',
                error: 'No audio available'
            });
        }

        // Generate assessment from transcript
        console.log(`Generating assessment with ${numberOfQuestions} questions...`);
        const assessmentJson = await generateAssessmentPromptCall(transcript, type, numberOfQuestions, difficulty);

        // Try to parse the JSON from the AI response
        let parsedAssessment;
        try {
            // Look for JSON array in the response
            const jsonMatch = assessmentJson.match(/\[[\s\S]*\]/);
            if (jsonMatch) {
                parsedAssessment = JSON.parse(jsonMatch[0]);
            } else {
                // Fallback to parsing the entire response
                parsedAssessment = JSON.parse(assessmentJson);
            }
        } catch (parseError) {
            console.error('Failed to parse assessment JSON:', parseError);
            parsedAssessment = { rawResponse: assessmentJson };
        }

        // Clear timeout and return successful response
        clearTimeout(timeoutId);

        res.status(200).json({
            success: true,
            message: 'Assessment generated successfully',
            videoId,
            videoUrl,
            metadata: {
                type,
                difficulty,
                questionCount: numberOfQuestions,
                transcriptLength: transcript.length
            },
            assessment: parsedAssessment,
            status: 200
        });

    } catch (error) {
        clearTimeout(timeoutId);
        console.error('Error generating assessment from YouTube:', error);

        res.status(500).json({
            success: false,
            message: 'Error generating assessment',
            error: error.message
        });
    }
};






export { generateAssessmentFromYoutube };