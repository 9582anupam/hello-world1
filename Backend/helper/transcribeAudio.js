import axios from 'axios';
import fs from 'fs';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);

dotenv.config();

const ASSEMBLY_API_KEY = process.env.ASSEMBLY_API_KEY;

export const transcribeAudio = async (audioFilePath) => {
    try {
        if (!ASSEMBLY_API_KEY) {
            throw new Error('ASSEMBLY_API_KEY is not set in environment variables');
        }

        console.log('Reading audio file from:', audioFilePath);
        if (!fs.existsSync(audioFilePath)) {
            throw new Error(`Audio file not found at: ${audioFilePath}`);
        }

        const file = fs.readFileSync(audioFilePath);
        console.log('File size:', file.length, 'bytes');

        // Upload the audio file to AssemblyAI
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

        // Request transcription
        const transcriptionResponse = await axios.post(
            "https://api.assemblyai.com/v2/transcript",
            { audio_url: uploadResponse.data.upload_url },
            { headers: { authorization: ASSEMBLY_API_KEY } }
        );

        const transcriptId = transcriptionResponse.data.id;

        // Polling for transcription completion
        let isCompleted = false;
        let transcriptText = "";
        while (!isCompleted) {
            const statusResponse = await axios.get(
                `https://api.assemblyai.com/v2/transcript/${transcriptId}`,
                { headers: { authorization: ASSEMBLY_API_KEY } }
            );
            const status = statusResponse.data.status;
            if (status === "completed") {
                isCompleted = true;
                transcriptText = statusResponse.data.text;
            } else if (status === "failed") {
                throw new Error("Transcription failed");
            } else {
                await new Promise((resolve) => setTimeout(resolve, 5000)); // Wait 5 seconds
            }
        }

        return transcriptText;
    } catch (err) {
        console.error("Error transcribing audio:", err);
        throw new Error(`Transcription failed: ${err.message}`);
    } finally {
        if (fs.existsSync(audioFilePath)) {
            fs.unlinkSync(audioFilePath);
            console.log('Temporary audio file removed');
        }
    }
};