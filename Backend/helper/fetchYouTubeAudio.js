import ytdl from '@distube/ytdl-core';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import axios from 'axios';
import { getYouTubeAudioStream } from './enhancedExtraction.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Alternative method to get audio streams if ytdl fails
const getDirectStreamURLs = async (videoId, cookies) => {
  try {
    // Construct cookies string for headers
    let cookieString = '';
    if (cookies && cookies.length) {
      cookieString = cookies
        .map(c => `${c.name}=${c.value}`)
        .join('; ');
    }

    // Make a direct request to YouTube's player API
    const response = await axios({
      method: 'GET',
      url: `https://www.youtube.com/watch?v=${videoId}`,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
        'Accept-Language': 'en-US,en;q=0.9',
        'Cookie': cookieString
      },
      timeout: 15000
    });

    const html = response.data;

    // Extract video info from the response
    const playerResponse = html.match(/"playerResponse":(\{.*?\}\}\})\s*,\s*"playbackTracking"/)?.[1];
    
    if (!playerResponse) {
      throw new Error("Could not extract player response from YouTube");
    }

    const data = JSON.parse(playerResponse);
    const formats = data?.streamingData?.adaptiveFormats || [];

    // Get audio formats
    const audioFormats = formats.filter(f => f.mimeType.includes('audio'));
    
    if (!audioFormats.length) {
      throw new Error("No audio formats found");
    }
    
    // Return stream URL and video title
    return {
      url: audioFormats[0].url,
      title: data?.videoDetails?.title || `video_${videoId}`
    };
  } catch (err) {
    console.error("Direct stream URL extraction failed:", err);
    throw err;
  }
};

// Parse Netscape format cookies - improved version for YouTube
const parseCookiesFromNetscape = (cookieString) => {
  try {
    const cookies = [];
    const lines = cookieString.split('\n')
      .filter(line => line && !line.startsWith('#'));
    
    console.log(`Found ${lines.length} cookie lines to parse`);
    
    for (const line of lines) {
      try {
        const parts = line.trim().split('\t');
        if (parts.length >= 7) {
          // Fix domain if it has HttpOnly prefix
          let domain = parts[0].replace('#HttpOnly_', '');
          
          cookies.push({
            domain: domain,
            path: parts[2],
            secure: parts[3].toLowerCase() === 'true',
            expires: parseInt(parts[4], 10),
            name: parts[5],
            value: parts[6]
          });
        }
      } catch (e) {
        console.warn('Failed to parse cookie line:', e);
      }
    }
    
    console.log(`Successfully parsed ${cookies.length} cookies`);
    return cookies;
  } catch (e) {
    console.error('Cookie parsing error:', e);
    return [];
  }
};

// Load cookies directly from file
const loadCookies = () => {
  try {
    const cookiePath = path.resolve(__dirname, '../config/cookies.txt');
    console.log('Looking for cookies at:', cookiePath);
    
    if (!fs.existsSync(cookiePath)) {
      console.warn('Cookies file does not exist');
      return [];
    }
    
    const cookieString = fs.readFileSync(cookiePath, 'utf8');
    console.log('Cookie file loaded, length:', cookieString.length);
    
    if (cookieString.length < 100) {
      console.warn('Cookie file appears to be too small');
      return [];
    }
    
    const cookies = parseCookiesFromNetscape(cookieString);
    
    // Verify we have essential YouTube cookies
    const essentialCookies = ['SID', 'HSID', 'SSID', 'APISID', 'SAPISID', 'LOGIN_INFO'];
    const foundEssential = essentialCookies.filter(name => 
      cookies.some(cookie => cookie.name === name)
    );
    
    console.log(`Found ${foundEssential.length}/${essentialCookies.length} essential YouTube cookies`);
    
    return cookies;
  } catch (err) {
    console.error('Error loading cookies:', err);
    return [];
  }
};

// Get our cookies
const cookies = loadCookies();
const hasCookies = cookies && cookies.length > 5; // Need multiple cookies for YouTube auth

console.log(`Cookie status: Has ${cookies.length} cookies, sufficient: ${hasCookies}`);

// Determine if we're in production environment - force to true for testing
const isProduction = true; // Force production mode to test the robuster methods
// const isProduction = process.env.NODE_ENV === 'production' || 
//                     process.env.VERCEL || 
//                     process.env.AWS_LAMBDA_FUNCTION_NAME;

// Set shorter timeouts for production environments
const TIMEOUT_PRODUCTION = 25000;
const TIMEOUT_DEVELOPMENT = 60000;
const timeout = isProduction ? TIMEOUT_PRODUCTION : TIMEOUT_DEVELOPMENT;

// Main function to fetch YouTube audio
export const fetchYouTubeAudio = async (videoUrl) => {
  try {
    if (!ytdl.validateURL(videoUrl)) {
      throw new Error('Invalid YouTube URL');
    }

    const videoId = ytdl.getURLVideoID(videoUrl);
    console.log(`Fetching video ID: ${videoId}, environment: ${isProduction ? 'production' : 'development'}`);

    // Always try the enhanced method first for reliability
    try {
      console.log('Using enhanced extraction method...');
      
      // Get the audio stream info using our enhanced methods
      const { url: streamUrl, title } = await getYouTubeAudioStream(videoId, cookies);
      
      console.log('Stream URL obtained, title:', title);
      
      // Create safe filename and prepare path
      const safeTitle = title.replace(/[^a-zA-Z0-9]/g, "_").substring(0, 50);
      const filePath = path.resolve(__dirname, `../temp/${safeTitle}.mp3`);
      
      // Ensure temp directory exists
      const tempDir = path.resolve(__dirname, '../temp');
      if (!fs.existsSync(tempDir)) {
        fs.mkdirSync(tempDir, { recursive: true });
      }
      
      // Download the file
      await new Promise((resolve, reject) => {
        console.log('Starting enhanced download...');
        
        // Set a timeout for the entire operation
        const timeoutId = setTimeout(() => {
          reject(new Error('Download timed out after ' + timeout + 'ms'));
        }, timeout);
        
        axios({
          method: 'GET',
          url: streamUrl,
          responseType: 'stream',
          timeout: timeout - 5000, // Give a little buffer for cleanup
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
            'Accept': '*/*',
            'Origin': 'https://www.youtube.com',
            'Referer': 'https://www.youtube.com/'
          }
        })
        .then(response => {
          const writer = fs.createWriteStream(filePath);
          
          let downloaded = 0;
          const totalSize = parseInt(response.headers['content-length'] || 0);
          
          response.data.on('data', (chunk) => {
            downloaded += chunk.length;
            if (totalSize) {
              const percent = (downloaded / totalSize * 100).toFixed(2);
              console.log(`Enhanced download: ${percent}%`);
            }
          });
          
          response.data.pipe(writer);
          
          writer.on('finish', () => {
            clearTimeout(timeoutId);
            console.log('Enhanced download complete!');
            resolve(filePath);
          });
          
          writer.on('error', (err) => {
            clearTimeout(timeoutId);
            console.error('Writer error:', err);
            reject(err);
          });
        })
        .catch(err => {
          clearTimeout(timeoutId);
          console.error('Axios download error:', err);
          reject(err);
        });
      });
      
      return filePath;
      
    } catch (enhancedError) {
      console.error('Enhanced method failed:', enhancedError.message);
      console.log('Falling back to standard methods...');
      
      // Fall back to the existing methods
      try {
        console.log('Using standard ytdl method...');
        
        const info = await ytdl.getBasicInfo(videoUrl, { 
          cookies,
          requestOptions: {
            headers: {
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
            }
          },
        });
        
        console.log('Successfully retrieved video info:', info.videoDetails.title);
        
        // Create safe filename and prepare path
        const title = info.videoDetails.title.replace(/[^a-zA-Z0-9]/g, "_").substring(0, 50);
        const filePath = path.resolve(__dirname, `../temp/${title}.mp3`);
        
        // Ensure temp directory exists
        const tempDir = path.resolve(__dirname, '../temp');
        if (!fs.existsSync(tempDir)) {
          fs.mkdirSync(tempDir, { recursive: true });
        }
        
        return new Promise((resolve, reject) => {
          console.log('Starting ytdl download...');
          
          const stream = ytdl(videoUrl, {
            filter: 'audioonly',
            quality: 'highestaudio',
            cookies: cookies,
            dlChunkSize: 1024 * 1024,
            requestOptions: {
              headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
              }
            }
          });
          
          const timeoutId = setTimeout(() => {
            stream.destroy();
            reject(new Error('Download timed out'));
          }, 60000);
          
          // Log progress
          stream.on('progress', (_, downloaded, total) => {
            if (total) {
              const percent = (downloaded / total * 100).toFixed(2);
              console.log(`Downloaded: ${percent}%`);
            }
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
        
      } catch (ytdlError) {
        console.error('Standard ytdl method failed:', ytdlError.message);
        console.log('Trying direct extraction fallback...');
        
        // Second attempt: Try direct stream URL extraction
        const { url: streamUrl, title } = await getDirectStreamURLs(videoId, cookies);
        
        console.log('Direct stream URL obtained, downloading...');
        
        // Create safe filename and prepare path
        const safeTitle = title.replace(/[^a-zA-Z0-9]/g, "_").substring(0, 50);
        const filePath = path.resolve(__dirname, `../temp/${safeTitle}.mp3`);
        
        // Ensure temp directory exists
        const tempDir = path.resolve(__dirname, '../temp');
        if (!fs.existsSync(tempDir)) {
          fs.mkdirSync(tempDir, { recursive: true });
        }
        
        return new Promise((resolve, reject) => {
          console.log('Starting direct download...');
          
          // Download using axios
          axios({
            method: 'GET',
            url: streamUrl,
            responseType: 'stream',
            timeout: 60000,
            headers: {
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
              'Accept-Language': 'en-US,en;q=0.9',
            }
          })
          .then(response => {
            const writer = fs.createWriteStream(filePath);
            
            let downloaded = 0;
            const totalSize = parseInt(response.headers['content-length'] || 0);
            
            response.data.on('data', (chunk) => {
              downloaded += chunk.length;
              if (totalSize) {
                const percent = (downloaded / totalSize * 100).toFixed(2);
                console.log(`Direct download: ${percent}%`);
              } else {
                console.log(`Downloaded bytes: ${downloaded}`);
              }
            });
            
            response.data.pipe(writer);
            
            writer.on('finish', () => {
              console.log('Direct download complete!');
              resolve(filePath);
            });
            
            writer.on('error', (err) => {
              console.error('Writer error:', err);
              reject(err);
            });
          })
          .catch(err => {
            console.error('Axios download error:', err);
            reject(err);
          });
        });
      }
    }
    
  } catch (err) {
    console.error("Error in YouTube fetch:", err);
    throw err;
  }
};
