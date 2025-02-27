import ytdl from '@distube/ytdl-core';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Configure request options with proxy and SSL settings
const requestOptions = {
    proxy: 'http://45.77.111.135:80',
    timeout: 30000, // 30 second timeout
    headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    },
    rejectUnauthorized: false // Allow self-signed certificates
};

export const fetchYouTubeAudio = async (videoUrl) => {
    try {
        if (!ytdl.validateURL(videoUrl)) {
            throw new Error('Invalid YouTube URL');
        }

        const videoId = ytdl.getURLVideoID(videoUrl);
        console.log('Fetching video ID:', videoId);

        const info = await ytdl.getBasicInfo(videoUrl, { requestOptions });
        console.log('Video title:', info.videoDetails.title);

        const title = info.videoDetails.title.replace(/[^a-zA-Z0-9]/g, "_");
        const filePath = path.resolve(__dirname, `../temp/${title}.mp3`);

        return new Promise((resolve, reject) => {
            const stream = ytdl(videoUrl, {
                filter: 'audioonly',
                quality: 'highestaudio',
                highWaterMark: 1 << 25,
                requestOptions
            });

            // Add progress logging
            stream.on('progress', (_, downloaded, total) => {
                const percent = (downloaded / total * 100).toFixed(2);
                console.log(`Downloaded: ${percent}%`);
            });

            // Add timeout handler
            const timeout = setTimeout(() => {
                stream.destroy();
                reject(new Error('Request timed out'));
            }, 60000); // 60 second timeout for entire download

            stream.pipe(fs.createWriteStream(filePath))
                .on('finish', () => {
                    clearTimeout(timeout);
                    resolve(filePath);
                })
                .on('error', (error) => {
                    clearTimeout(timeout);
                    console.error('Stream error:', error);
                    reject(error);
                });

            stream.on('error', (error) => {
                clearTimeout(timeout);
                console.error('YTDL error:', error);
                reject(error);
            });

            stream.on('end', () => {
                clearTimeout(timeout);
            });
        });
    } catch (err) {
        console.error("Error fetching YouTube audio:", err);
        throw err;
    }
};
