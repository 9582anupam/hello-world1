import ytdl from '@distube/ytdl-core';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

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

// Get our cookies
const cookies = loadCookies();
const hasCookies = cookies.length > 0;

// Backup proxies - only used if cookies fail
const PROXY_SERVERS = [
  'http://198.105.101.92',
  'http://142.147.128.93',
  'http://154.36.110.199',
  'http://166.88.58.10'
];

// Try multiple strategies with fallbacks
export const fetchYouTubeAudio = async (videoUrl) => {
  try {
    if (!ytdl.validateURL(videoUrl)) {
      throw new Error('Invalid YouTube URL');
    }

    const videoId = ytdl.getURLVideoID(videoUrl);
    console.log('Fetching video ID:', videoId);
    
    // First attempt: Get video info using cookies (most reliable)
    let info;
    let usedMethod = 'cookies';
    
    try {
      if (hasCookies) {
        info = await ytdl.getBasicInfo(videoUrl, { 
          cookies,
          requestOptions: {
            headers: {
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
            }
          }
        });
        console.log('Successfully got video info using cookies');
      } else {
        throw new Error('No cookies available');
      }
    } catch (cookieError) {
      console.warn('Cookie auth failed:', cookieError.message);
      
      // Second attempt: Try direct with no proxy
      try {
        usedMethod = 'direct';
        info = await ytdl.getBasicInfo(videoUrl, {
          requestOptions: {
            headers: {
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
            }
          }
        });
        console.log('Successfully got video info directly');
      } catch (directError) {
        console.warn('Direct access failed:', directError.message);
        
        // Third attempt: Try proxies
        let proxySuccess = false;
        for (const proxy of PROXY_SERVERS) {
          try {
            usedMethod = 'proxy';
            info = await ytdl.getBasicInfo(videoUrl, {
              requestOptions: {
                proxy,
                headers: {
                  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
                },
                timeout: 10000
              }
            });
            console.log(`Successfully got video info using proxy: ${proxy}`);
            proxySuccess = true;
            break;
          } catch (proxyError) {
            console.warn(`Proxy ${proxy} failed:`, proxyError.message);
          }
        }
        
        if (!proxySuccess) {
          throw new Error('All access methods failed');
        }
      }
    }
    
    console.log('Video title:', info.videoDetails.title);

    // Create safe filename
    const title = info.videoDetails.title.replace(/[^a-zA-Z0-9]/g, "_").substring(0, 50);
    const filePath = path.resolve(__dirname, `../temp/${title}.mp3`);

    // Ensure temp directory exists
    const tempDir = path.resolve(__dirname, '../temp');
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }

    // Download options based on what worked for info
    const downloadOptions = {
      filter: 'audioonly',
      quality: 'lowestaudio',
      dlChunkSize: 512 * 1024,
    };
    
    if (usedMethod === 'cookies' && hasCookies) {
      downloadOptions.cookies = cookies;
    } else if (usedMethod === 'proxy') {
      // Find working proxy
      for (const proxy of PROXY_SERVERS) {
        try {
          await ytdl.getInfo(videoUrl, {
            requestOptions: { proxy }
          });
          downloadOptions.requestOptions = { proxy };
          break;
        } catch (err) {
          console.warn(`Proxy ${proxy} failed check`);
        }
      }
    }
    
    if (downloadOptions.requestOptions) {
      downloadOptions.requestOptions.headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      };
    } else {
      downloadOptions.requestOptions = {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        }
      };
    }

    return new Promise((resolve, reject) => {
      console.log('Starting download with method:', usedMethod);
      const stream = ytdl(videoUrl, downloadOptions);
      
      // Set a generous timeout
      const timeoutId = setTimeout(() => {
        stream.destroy();
        reject(new Error('Download timed out - server timeout'));
      }, 30000);
      
      // Log progress
      stream.on('progress', (_, downloaded, total) => {
        const percent = (downloaded / total * 100).toFixed(2);
        console.log(`Downloaded: ${percent}%`);
      });
      
      // Save file
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
