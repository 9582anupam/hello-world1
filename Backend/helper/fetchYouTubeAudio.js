import ytdl from '@distube/ytdl-core';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const fetchYouTubeAudio = async (videoUrl) => {
    try {
        // Validate URL first
        if (!ytdl.validateURL(videoUrl)) {
            throw new Error('Invalid YouTube URL');
        }

        const videoId = ytdl.getURLVideoID(videoUrl);
        console.log('Fetching video ID:', videoId);

        const info = await ytdl.getBasicInfo(videoUrl);
        console.log('Video title:', info.videoDetails.title);

        const title = info.videoDetails.title.replace(/[^a-zA-Z0-9]/g, "_");
        const filePath = path.resolve(__dirname, `../temp/${title}.mp3`);

        return new Promise((resolve, reject) => {
            const stream = ytdl(videoUrl, {
                filter: 'audioonly',
                quality: 'highestaudio',
                highWaterMark: 1 << 25
            });

            // Add progress logging
            stream.on('progress', (_, downloaded, total) => {
                const percent = (downloaded / total * 100).toFixed(2);
                console.log(`Downloaded: ${percent}%`);
            });

            stream.pipe(fs.createWriteStream(filePath))
                .on('finish', () => resolve(filePath))
                .on('error', (error) => {
                    console.error('Stream error:', error);
                    reject(error);
                });

            stream.on('error', (error) => {
                console.error('YTDL error:', error);
                reject(error);
            });
        });
    } catch (err) {
        console.error("Error fetching YouTube audio:", err);
        throw err;
    }
};

export default fetchYouTubeAudio;