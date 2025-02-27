import ytdl from '@distube/ytdl-core';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// List of proxy servers to try
const PROXY_SERVERS = [
    'http://198.105.101.92',
    'http://45.77.111.135:80',
    'http://82.119.96.254:80',
    'http://176.113.73.96:3128',

    // Add more proxy servers as backup
];

// Helper for retry logic
const retry = async (fn, retries = 3, delay = 1000, finalError = null) => {
    try {
        return await fn();
    } catch (error) {
        if (retries <= 0) throw finalError || error;
        console.log(`Retrying after error: ${error.message}. Attempts left: ${retries}`);
        await new Promise(resolve => setTimeout(resolve, delay));
        return retry(fn, retries - 1, delay * 2, error);
    }
};

export const fetchYouTubeAudio = async (videoUrl) => {
    try {
        if (!ytdl.validateURL(videoUrl)) {
            throw new Error('Invalid YouTube URL');
        }

        const videoId = ytdl.getURLVideoID(videoUrl);
        console.log('Fetching video ID:', videoId);

        // Try each proxy server until one works
        let info;
        let currentProxyIndex = 0;

        const getInfo = async () => {
            const proxy = PROXY_SERVERS[currentProxyIndex % PROXY_SERVERS.length];
            currentProxyIndex++;
            console.log(`Trying proxy: ${proxy}`);

            const requestOptions = {
                proxy,
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
                    'Accept-Language': 'en-US,en;q=0.5',
                    'Origin': 'https://www.youtube.com',
                    'Referer': 'https://www.youtube.com/'
                },
                timeout: 15000,
                rejectUnauthorized: false
            };

            return await ytdl.getBasicInfo(videoUrl, { requestOptions });
        };

        info = await retry(getInfo, PROXY_SERVERS.length);
        console.log('Video title:', info.videoDetails.title);

        const title = info.videoDetails.title.replace(/[^a-zA-Z0-9]/g, "_");
        const filePath = path.resolve(__dirname, `../temp/${title}.mp3`);

        // Ensure temp directory exists
        const tempDir = path.resolve(__dirname, '../temp');
        if (!fs.existsSync(tempDir)) {
            fs.mkdirSync(tempDir, { recursive: true });
        }

        return new Promise((resolve, reject) => {
            const currentProxy = PROXY_SERVERS[currentProxyIndex % PROXY_SERVERS.length];

            const requestOptions = {
                proxy: currentProxy,
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                },
                timeout: 15000,
                rejectUnauthorized: false
            };

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
            }, 120000); // 120 second timeout for entire download

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
