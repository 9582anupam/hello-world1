import axios from 'axios';
import fs from 'fs';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);

dotenv.config();

const ASSEMBLY_API_KEY = process.env.ASSEMBLY_API_KEY;

export const transcribeAudioVideo = async (filePath) => {
    try {
        if (!ASSEMBLY_API_KEY) {
            throw new Error('ASSEMBLY_API_KEY is not set in environment variables');
        }

        console.log('Reading media file from:', filePath);
        if (!fs.existsSync(filePath)) {
            throw new Error(`Media file not found at: ${filePath}`);
        }

        const file = fs.readFileSync(filePath);
        console.log('File size:', file.length, 'bytes');

        // Upload the audio/video file to AssemblyAI
        console.log('Uploading to AssemblyAI...');
        const uploadResponse = await axios.post(
            "https://api.assemblyai.com/v2/upload",
            file,
            {
                headers: {
                    authorization: ASSEMBLY_API_KEY,
                    "content-type": "application/octet-stream"
                }
            }
        );

        // Request transcription with enhanced options
        const transcriptionResponse = await axios.post(
            "https://api.assemblyai.com/v2/transcript",
            { 
                audio_url: uploadResponse.data.upload_url,
                punctuate: true,
                format_text: true,
                dual_channel: false,
                speaker_labels: true // Enables speaker detection
            },
            { headers: { authorization: ASSEMBLY_API_KEY } }
        );

        const transcriptId = transcriptionResponse.data.id;

        // Polling for transcription completion
        let isCompleted = false;
        let transcriptData = null;
        
        console.log(`Transcription job started with ID: ${transcriptId}`);
        
        while (!isCompleted) {
            const statusResponse = await axios.get(
                `https://api.assemblyai.com/v2/transcript/${transcriptId}`,
                { headers: { authorization: ASSEMBLY_API_KEY } }
            );
            
            const status = statusResponse.data.status;
            console.log(`Transcription status: ${status}`);
            
            if (status === "completed") {
                isCompleted = true;
                transcriptData = {
                    text: statusResponse.data.text,
                    confidence: statusResponse.data.confidence,
                    words: statusResponse.data.words,
                    utterances: statusResponse.data.utterances,
                    speakers: statusResponse.data.speakers
                };
            } else if (status === "failed") {
                throw new Error("Transcription failed: " + (statusResponse.data.error || "Unknown error"));
            } else {
                // Wait before checking again - using exponential backoff
                const waitTime = status === "processing" ? 5000 : 10000;
                console.log(`Waiting ${waitTime/1000} seconds before checking again...`);
                await new Promise((resolve) => setTimeout(resolve, waitTime));
            }
        }

        return transcriptData;
    } catch (err) {
        console.error("Error transcribing media:", err);
        throw new Error(`Transcription failed: ${err.message}`);
    } finally {
        // Optionally clean up the file after processing
        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
            console.log('Temporary media file removed');
        }
    }
};

export default transcribeAudioVideo;
