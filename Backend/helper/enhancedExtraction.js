import axios from 'axios';
import querystring from 'querystring';

// Helper function to safely extract JSON from messy HTML/JS
const safeJSONParse = (str, errorMessage = 'Invalid JSON') => {
  try {
    // Clean up the string - handle JS expressions that aren't valid JSON
    let jsonStr = str;
    
    // Remove trailing semicolons and commas
    jsonStr = jsonStr.replace(/;$/, '').replace(/,$/, '');
    
    // Try to parse it
    return JSON.parse(jsonStr);
  } catch (e) {
    console.warn(`JSON parse error: ${e.message}`);
    throw new Error(`${errorMessage}: ${e.message}`);
  }
};

// Extract data using raw HTML methods with multiple patterns
const extractFromHTML = async (html, videoId) => {
  console.log('Trying to extract from raw HTML...');
  
  // Method 1: Standard playerResponse pattern
  try {
    const standardMatch = html.match(/"playerResponse"\s*:\s*({.+?})\s*,\s*"/);
    if (standardMatch && standardMatch[1]) {
      const data = safeJSONParse(standardMatch[1], 'Standard pattern parse error');
      if (data.streamingData) {
        console.log('Standard pattern extraction successful');
        return data;
      }
    }
  } catch (e) {
    console.warn('Standard pattern extraction failed:', e.message);
  }
  
  // Method 2: ytInitialPlayerResponse variable pattern
  try {
    const initMatch = html.match(/var\s+ytInitialPlayerResponse\s*=\s*({.+?});\s*var/);
    if (initMatch && initMatch[1]) {
      const data = safeJSONParse(initMatch[1], 'ytInitialPlayerResponse parse error');
      if (data.streamingData) {
        console.log('ytInitialPlayerResponse extraction successful');
        return data;
      }
    }
  } catch (e) {
    console.warn('ytInitialPlayerResponse extraction failed:', e.message);
  }
  
  // Method 3: window["ytInitialPlayerResponse"] pattern
  try {
    const windowMatch = html.match(/window\["ytInitialPlayerResponse"\]\s*=\\s*({.+?});/);
    if (windowMatch && windowMatch[1]) {
      const data = safeJSONParse(windowMatch[1], 'window["ytInitialPlayerResponse"] parse error');
      if (data.streamingData) {
        console.log('window["ytInitialPlayerResponse"] extraction successful');
        return data;
      }
    }
  } catch (e) {
    console.warn('window["ytInitialPlayerResponse"] extraction failed:', e.message);
  }
  
  // Method 4: Look for script tags with streaming data
  try {
    const scriptTags = html.match(/<script[^>]*>(.+?)<\/script>/gs) || [];
    for (const script of scriptTags) {
      try {
        if (script.includes('streamingData') && script.includes('adaptiveFormats')) {
          const jsonMatch = script.match(/({.+"streamingData".+?adaptiveFormats.+?})/);
          if (jsonMatch && jsonMatch[1]) {
            const data = safeJSONParse(jsonMatch[1], 'Script tag JSON parse error');
            if (data.streamingData) {
              console.log('Script tag extraction successful');
              return data;
            }
          }
        }
      } catch (e) {
        // Just skip this script tag and try next one
      }
    }
  } catch (e) {
    console.warn('Script tag extraction failed:', e.message);
  }
  
  // Method 5: Brute force - scan for any JSON-like structure with streamingData
  try {
    const bruteForceParts = html.split('streamingData');
    for (let i = 0; i < Math.min(bruteForceParts.length, 5); i++) {
      if (i === 0) continue; // Skip the first part (comes before streamingData)
      
      try {
        const part = bruteForceParts[i];
        // Look back a bit to try to find an opening brace
        const contextStart = Math.max(0, part.lastIndexOf('{', 2000));
        // Look forward to find a potential closing brace
        const contextEnd = part.indexOf('}}', 20);
        
        if (contextStart >= 0 && contextEnd > contextStart) {
          const potentialJSON = '{' + part.substring(contextStart, contextEnd + 2); 
          try {
            const data = safeJSONParse(potentialJSON, 'Brute force JSON parse error');
            if (data.adaptiveFormats || data.formats) {
              console.log('Brute force extraction successful');
              
              // Construct a data structure matching expected format
              return {
                streamingData: data,
                videoDetails: { title: `youtube_${videoId}` }
              };
            }
          } catch (e) {
            // Just try the next section
          }
        }
      } catch (e) {
        // Just try the next section
      }
    }
  } catch (e) {
    console.warn('Brute force extraction failed:', e.message);
  }
  
  return null;
};

// Multiple methods to extract player data from YouTube
export const extractYouTubePlayerData = async (videoId, cookies = []) => {
  const errors = [];
  
  // Create cookie string for headers
  const cookieString = cookies.map(c => `${c.name}=${c.value}`).join('; ');
  
  // Common headers
  const headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
    'Accept-Language': 'en-US,en;q=0.9',
    'Accept': 'text/html,application/xhtml+xml,application/xml',
    'Origin': 'https://www.youtube.com',
    'Referer': 'https://www.youtube.com/'
  };
  
  if (cookieString) {
    headers['Cookie'] = cookieString;
  }
  
  // --- Method A: ANDROID API ---
  try {
    console.log('Trying Android API extraction...');
    
    const response = await axios.post(
      'https://www.youtube.com/youtubei/v1/player?key=AIzaSyAO_FJ2SlqU8Q4STEHLGCilw_Y9_11qcW8',
      {
        videoId,
        context: {
          client: {
            clientName: 'ANDROID',
            clientVersion: '17.31.35',
            gl: 'US',
            hl: 'en',
            androidSdkVersion: 30
          }
        }
      },
      {
        headers: {
          'User-Agent': 'com.google.android.youtube/17.31.35 (Linux; U; Android 11) gzip',
          'Content-Type': 'application/json',
          'X-YouTube-Client-Name': '3', 
          'X-YouTube-Client-Version': '17.31.35',
          'Accept': '*/*'
        },
        timeout: 10000
      }
    );
    
    if (response.data && response.data.streamingData) {
      console.log('Android API extraction successful!');
      return response.data;
    }
  } catch (error) {
    console.error('Android API extraction failed:', error.message);
    errors.push(`Android API: ${error.message}`);
  }
  
  // --- Method B: TV API ---
  try {
    console.log('Trying TV API extraction...');
    const api = process.env.GEMINI_API_KEY;
    const response = await axios.post(
      `https://www.youtube.com/youtubei/v1/player?key=${GEMINI_API_KEY}`,
      {
        videoId,
        context: {
          client: {
            clientName: 'TVHTML5',
            clientVersion: '7.20220325',
            gl: 'US',
            hl: 'en',
          }
        }
      },
      {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Linux; Tizen 2.3) AppleWebKit/538.1 (KHTML, like Gecko) Version/2.3 TV Safari/538.1',
          'Content-Type': 'application/json',
          'Accept': '*/*'
        },
        timeout: 10000
      }
    );
    
    if (response.data && response.data.streamingData) {
      console.log('TV API extraction successful!');
      return response.data;
    }
  } catch (error) {
    console.error('TV API extraction failed:', error.message);
    errors.push(`TV API: ${error.message}`);
  }

  // --- Method C: Mobile YouTube ---
  try {
    console.log('Trying mobile YouTube extraction...');
    const response = await axios({
      method: 'GET',
      url: `https://m.youtube.com/watch?v=${videoId}`,
      headers: {
        ...headers,
        'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/15.0 Mobile/15E148 Safari/604.1'
      },
      timeout: 10000
    });
    
    const html = response.data;
    const data = await extractFromHTML(html, videoId);
    
    if (data) {
      console.log('Mobile YouTube extraction successful!');
      return data;
    }
  } catch (error) {
    console.error('Mobile extraction failed:', error.message);
    errors.push(`Mobile: ${error.message}`);
  }
  
  // --- Method D: get_video_info direct API ---
  try {
    console.log('Trying get_video_info API...');
    
    const response = await axios({
      method: 'GET',
      url: `https://www.youtube.com/get_video_info?video_id=${videoId}&el=detailpage`,
      headers,
      timeout: 10000
    });
    
    const data = querystring.parse(response.data);
    
    if (data.player_response) {
      const playerData = JSON.parse(data.player_response);
      if (playerData.streamingData) {
        console.log('get_video_info API extraction successful!');
        return playerData;
      }
    }
  } catch (error) {
    console.error('get_video_info API extraction failed:', error.message);
    errors.push(`get_video_info: ${error.message}`);
  }
  
  // --- Method E: Embed API ---
  try {
    console.log('Trying embed API extraction...');
    
    // First get the embed page
    const embedResponse = await axios({
      method: 'GET',
      url: `https://www.youtube.com/embed/${videoId}`,
      headers,
      timeout: 10000
    });
    
    // Get video info via HTML extraction
    const data = await extractFromHTML(embedResponse.data, videoId);
    if (data) {
      console.log('Embed API HTML extraction successful!');
      return data;
    }
    
    // Try to get STS token
    const stsMatch = embedResponse.data.match(/"sts"\s*:\s*(\d+)/);
    if (!stsMatch) {
      throw new Error('STS token not found');
    }
    
    const sts = stsMatch[1];
    
    // Get video info using the token
    const videoInfoResponse = await axios({
      method: 'GET',
      url: `https://www.youtube.com/get_video_info?video_id=${videoId}&sts=${sts}&el=embedded&html5=1`,
      headers,
      timeout: 10000
    });
    
    const params = new URLSearchParams(videoInfoResponse.data);
    const playerResponseJson = params.get('player_response');
    
    if (playerResponseJson) {
      const playerData = JSON.parse(playerResponseJson);
      if (playerData.streamingData) {
        console.log('Embed API extraction successful!');
        return playerData;
      }
    }
  } catch (error) {
    console.error('Embed API extraction failed:', error.message);
    errors.push(`Embed API: ${error.message}`);
  }
  
  throw new Error(`All extraction methods failed: ${errors.join('; ')}`);
};

// Extract and download the best audio stream
export const getYouTubeAudioStream = async (videoId, cookies = []) => {
  try {
    console.log(`Attempting to get audio stream for video ID: ${videoId}`);
    
    // Try up to 3 times with different methods
    let playerData = null;
    let attempt = 1;
    
    while (!playerData && attempt <= 3) {
      try {
        console.log(`Extraction attempt #${attempt}...`);
        playerData = await extractYouTubePlayerData(videoId, cookies);
      } catch (err) {
        console.warn(`Attempt #${attempt} failed: ${err.message}`);
        if (attempt === 3) throw err;
      }
      attempt++;
    }
    
    // Get streaming formats
    const formats = playerData.streamingData?.adaptiveFormats || 
                   playerData.streamingData?.formats || 
                   [];
    
    if (!formats.length) {
      throw new Error('No formats found in player data');
    }
    
    // Find audio formats
    const audioFormats = formats.filter(f => 
      f.mimeType?.includes('audio') || 
      f.audioQuality
    );
    
    if (!audioFormats.length) {
      // If no specific audio formats, use any format that has audio
      const anyAudioFormats = formats.filter(f => !f.mimeType?.includes('video only'));
      
      if (!anyAudioFormats.length) {
        throw new Error('No audio formats found');
      }
      
      console.log('Using mixed audio/video format as fallback');
      
      // Sort by quality (bitrate or lowest resolution for mixed formats)
      const sortedFormats = anyAudioFormats.sort((a, b) => {
        // Prioritize by audio quality if possible
        if (a.audioQuality && b.audioQuality) {
          return (b.bitrate || 0) - (a.bitrate || 0);
        }
        
        // Otherwise sort by smallest video size for mixed formats
        return (a.width || 0) - (b.width || 0);
      });
      
      // Get video details
      const videoDetails = playerData.videoDetails || {};
      const title = videoDetails.title || `youtube_${videoId}`;
      
      return {
        url: sortedFormats[0].url,
        title,
        format: sortedFormats[0]
      };
    }
    
    // Sort by quality (bitrate)
    const sortedFormats = audioFormats.sort((a, b) => (b.bitrate || 0) - (a.bitrate || 0));
    
    // Get video details
    const videoDetails = playerData.videoDetails || {};
    const title = videoDetails.title || `youtube_${videoId}`;
    
    console.log(`Successfully found audio stream for "${title}"`);
    
    return {
      url: sortedFormats[0].url,
      title,
      format: sortedFormats[0]
    };
  } catch (error) {
    console.error('Error getting YouTube audio stream:', error);
    throw error;
  }
};
