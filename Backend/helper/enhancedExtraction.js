import axios from 'axios';
import querystring from 'querystring';

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
  
  // --- Method 1: Mobile YouTube ---
  try {
    console.log('Trying mobile YouTube extraction...');
    const response = await axios({
      method: 'GET',
      url: `https://m.youtube.com/watch?v=${videoId}`,
      headers: {
        ...headers,
        'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/15.0 Mobile/15E148 Safari/604.1'
      },
      timeout: 15000
    });
    
    const html = response.data;
    
    // Extract ytInitialPlayerResponse
    const playerDataMatch = html.match(/ytInitialPlayerResponse\s*=\s*(\{.+?\});/);
    if (playerDataMatch && playerDataMatch[1]) {
      const data = JSON.parse(playerDataMatch[1]);
      if (data.streamingData) {
        console.log('Mobile extraction successful');
        return data;
      }
    }
    
  } catch (error) {
    console.error('Mobile extraction failed:', error.message);
    errors.push(`Mobile extraction: ${error.message}`);
  }
  
  // --- Method 2: YouTube Embed API ---
  try {
    console.log('Trying embed API extraction...');
    
    // First get the STS token from embed page
    const embedResponse = await axios({
      method: 'GET',
      url: `https://www.youtube.com/embed/${videoId}`,
      headers,
      timeout: 10000
    });
    
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
      const data = JSON.parse(playerResponseJson);
      if (data.streamingData) {
        console.log('Embed API extraction successful');
        return data;
      }
    }
    
  } catch (error) {
    console.error('Embed API extraction failed:', error.message);
    errors.push(`Embed API extraction: ${error.message}`);
  }
  
  // --- Method 3: YouTube InnerTube API ---
  try {
    console.log('Trying InnerTube API extraction...');
    
    // Use the Android API - often less restricted
    const response = await axios.post(
      'https://www.youtube.com/youtubei/v1/player?key=AIzaSyAO_FJ2SlqU8Q4STEHLGCilw_Y9_11qcW8',
      {
        videoId,
        context: {
          client: {
            clientName: 'ANDROID',
            clientVersion: '17.31.35',
            hl: 'en',
            gl: 'US'
          }
        }
      },
      {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Linux; Android 10) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.6099.144 Mobile Safari/537.36',
          'Content-Type': 'application/json'
        },
        timeout: 10000
      }
    );
    
    const data = response.data;
    if (data.streamingData) {
      console.log('InnerTube API extraction successful');
      return data;
    }
    
  } catch (error) {
    console.error('InnerTube API extraction failed:', error.message);
    errors.push(`InnerTube API extraction: ${error.message}`);
  }
  
  // --- Method 4: Desktop YouTube with regexes ---
  try {
    console.log('Trying desktop YouTube with multiple regex patterns...');
    
    const response = await axios({
      method: 'GET',
      url: `https://www.youtube.com/watch?v=${videoId}`,
      headers,
      timeout: 15000
    });
    
    const html = response.data;
    
    // Try multiple regex patterns to find player data
    const patterns = [
      /"playerResponse"\s*:\s*(\{.*?\}\}\})\s*,/,
      /ytInitialPlayerResponse\s*=\s*(\{.+?\});/,
      /ytInitialPlayerResponse\s*=\s*(\{.+?\})(;|\))/,
      /window\["ytInitialPlayerResponse"\]\s*=\s*(\{.+?\});/
    ];
    
    for (const pattern of patterns) {
      const match = html.match(pattern);
      if (match && match[1]) {
        try {
          const data = JSON.parse(match[1]);
          if (data.streamingData) {
            console.log('Regex extraction successful');
            return data;
          }
        } catch (e) {
          console.warn('Failed to parse regex match:', e.message);
        }
      }
    }
    
    throw new Error('No regex patterns matched');
    
  } catch (error) {
    console.error('Desktop regex extraction failed:', error.message);
    errors.push(`Desktop regex extraction: ${error.message}`);
  }
  
  throw new Error(`All extraction methods failed: ${errors.join('; ')}`);
};

// Extract and download the best audio stream
export const getYouTubeAudioStream = async (videoId, cookies = []) => {
  try {
    // Get player data using our enhanced extraction
    const playerData = await extractYouTubePlayerData(videoId, cookies);
    
    // Get streaming formats
    const formats = playerData.streamingData?.adaptiveFormats || 
                   playerData.streamingData?.formats || 
                   [];
    
    if (!formats.length) {
      throw new Error('No formats found in player data');
    }
    
    // Find audio formats
    const audioFormats = formats.filter(f => f.mimeType?.includes('audio'));
    
    if (!audioFormats.length) {
      throw new Error('No audio formats found');
    }
    
    // Sort by quality (bitrate)
    const sortedFormats = audioFormats.sort((a, b) => (b.bitrate || 0) - (a.bitrate || 0));
    
    // Get video details
    const videoDetails = playerData.videoDetails || {};
    const title = videoDetails.title || `youtube_${videoId}`;
    
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
