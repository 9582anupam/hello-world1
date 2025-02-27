import ytdl from '@distube/ytdl-core';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import https from 'https';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Use your specific working proxies
const PROXY_SERVERS = [
    'http://161.123.152.115',
    'http://23.94.138.75',
    'http://64.64.118.149',
    'http://142.147.128.93',
    'http://198.105.101.92',
    'http://154.36.110.199',
    'http://166.88.58.10',
    'http://173.0.9.70'
];

// Parse Netscape format cookies
const parseCookiesFromNetscape = (cookieString) => {
    return cookieString.split('\n')
        .filter(line => line && !line.startsWith('#'))
        .map(line => {
            const parts = line.split('\t');
            if (parts.length >= 7) {
                return {
                    domain: parts[0],
                    path: parts[2],
                    secure: parts[3] === 'TRUE',
                    expires: parts[4],
                    name: parts[5],
                    value: parts[6]
                };
            }
            return null;
        })
        .filter(cookie => cookie !== null);
};

// Load cookies from file
const loadCookies = () => {
    try {
        const cookiePath = path.resolve(__dirname, '../config/cookies.txt');
        if (fs.existsSync(cookiePath)) {
            const cookieString = fs.readFileSync(cookiePath, 'utf8');
            return parseCookiesFromNetscape(cookieString);
        }
    } catch (err) {
        console.warn('Could not load cookies file:', err.message);
    }
    return [];
};

// Helper function to verify proxy is working
const testProxy = (proxy, timeoutMs = 5000) => {
    return new Promise((resolve) => {
        const url = new URL(proxy);
        const req = https.request({
            host: url.hostname,
            port: url.port || 80,
            path: 'https://www.youtube.com',
            method: 'HEAD',
            timeout: timeoutMs
        }, () => {
            resolve(true);
        });

        req.on('error', () => {
            resolve(false);
        });

        req.on('timeout', () => {
            req.destroy();
            resolve(false);
        });

        req.end();
    });
};

// Get working proxies
const getWorkingProxies = async (limit = 3) => {
    console.log('Testing proxies for availability...');
    const results = await Promise.all(
        PROXY_SERVERS.map(async proxy => {
            const isWorking = await testProxy(proxy);
            return { proxy, isWorking };
        })
    );

    const workingProxies = results
        .filter(item => item.isWorking)
        .map(item => item.proxy);

    console.log(`Found ${workingProxies.length} working proxies out of ${PROXY_SERVERS.length}`);
    return workingProxies.slice(0, limit);
};

// Get our cookies
const cookies = loadCookies();
const hasCookies = cookies.length > 0;

// Try multiple strategies with fallbacks
export const fetchYouTubeAudio = async (videoUrl) => {
    try {
        if (!ytdl.validateURL(videoUrl)) {
            throw new Error('Invalid YouTube URL');
        }

        const videoId = ytdl.getURLVideoID(videoUrl);
        console.log('Fetching video ID:', videoId);

        let info = null;
        let usedMethod = '';
        let errors = [];
        
        // Change order: Try cookies first (since we're sure they work for you)
        if (hasCookies) {
            try {
                usedMethod = 'cookies';
                console.log('Attempting access with cookies...');
                info = await ytdl.getBasicInfo(videoUrl, { 
                    cookies,
                    requestOptions: {
                        headers: {
                            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
                        },
                        timeout: 15000
                    }
                });
                console.log('Cookie access successful!');
            } catch (cookieError) {
                errors.push(`Cookie access failed: ${cookieError.message}`);
                console.warn('Cookie access failed, trying direct...');
            }
        }
        
        // Try direct if cookies failed
        if (!info) {
            try {
                console.log('Attempting direct access...');
                usedMethod = 'direct';
                info = await ytdl.getBasicInfo(videoUrl, {
                    requestOptions: {
                        headers: {
                            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                            'Accept-Language': 'en-US,en;q=0.9'
                        },
                        timeout: 10000
                    }
                });
                console.log('Direct access successful!');
            } catch (directError) {
                errors.push(`Direct access failed: ${directError.message}`);
                console.warn('Direct access failed, trying proxies...');
                
                // Try each proxy (skip testing to save time since they should be working)
                let proxySuccess = false;
                for (const proxy of PROXY_SERVERS) {
                    try {
                        usedMethod = 'proxy';
                        console.log(`Trying proxy: ${proxy}...`);
                        info = await ytdl.getBasicInfo(videoUrl, {
                            requestOptions: {
                                proxy,
                                headers: {
                                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
                                },
                                timeout: 15000
                            }
                        });
                        console.log(`Proxy access successful with ${proxy}!`);
                        proxySuccess = true;
                        break;
                    } catch (proxyError) {
                        errors.push(`Proxy ${proxy} failed: ${proxyError.message}`);
                        console.warn(`Proxy ${proxy} failed, trying next...`);
                    }
                }
                
                if (!proxySuccess) {
                    throw new Error(`All access methods failed: ${errors.join(', ')}`);
                }
            }
        }
        
        if (!info) {
            throw new Error('Unable to fetch video information');
        }

        console.log('Video title:', info.videoDetails.title);
        console.log('Access method used:', usedMethod);

        // Create safe filename
        const title = info.videoDetails.title.replace(/[^a-zA-Z0-9]/g, "_").substring(0, 50);
        const filePath = path.resolve(__dirname, `../temp/${title}.mp3`);

        // Ensure temp directory exists
        const tempDir = path.resolve(__dirname, '../temp');
        if (!fs.existsSync(tempDir)) {
            fs.mkdirSync(tempDir, { recursive: true });
        }

        // Use same method for download that worked for info
        const downloadOptions = {
            filter: 'audioonly',
            quality: 'highestaudio', // Change to highestaudio for better quality preview
            dlChunkSize: 512 * 1024,
            requestOptions: {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
                }
            }
        };

        if (usedMethod === 'cookies') {
            downloadOptions.cookies = cookies;
        } else if (usedMethod === 'proxy') {
            downloadOptions.requestOptions.proxy = info.requestOptions?.proxy;
        }

        return new Promise((resolve, reject) => {
            console.log(`Starting download with ${usedMethod} method...`);
            const stream = ytdl(videoUrl, downloadOptions);

            const timeoutId = setTimeout(() => {
                stream.destroy();
                reject(new Error('Download timed out'));
            }, 45000);

            stream.on('progress', (_, downloaded, total) => {
                if (total) {
                    const percent = (downloaded / total * 100).toFixed(2);
                    console.log(`Downloaded: ${percent}%`);
                }
            });

            stream.pipe(fs.createWriteStream(filePath))
                .on('finish', () => {
                    clearTimeout(timeoutId);
                    console.log('Download complete!');
                    resolve(filePath);
                })
                .on('error', (error) => {
                    clearTimeout(timeoutId);
                    console.error('Write stream error:', error);
                    reject(error);
                });

            stream.on('error', (error) => {
                clearTimeout(timeoutId);
                console.error('YTDL stream error:', error);
                reject(error);
            });
        });
    } catch (err) {
        console.error("Error in YouTube fetch:", err);
        throw err;
    }
};
