const cache = new Map();
const CACHE_TTL_MS = 10 * 60 * 1000;

exports.handler = async (event) => {
  try {
    const apiKey = process.env.YOUTUBE_API_KEY;
    if (!apiKey) {
      return json(500, { error: 'Missing YOUTUBE_API_KEY in Netlify environment.' });
    }

    const params = event.queryStringParameters || {};
    const channelParam = params.channels || '';
    const channelIds = channelParam
      .split(',')
      .map((id) => id.trim())
      .filter(Boolean);

    if (!channelIds.length) {
      return json(400, { error: 'channels query param required (comma-separated channel IDs).' });
    }

    const maxResults = Math.min(Math.max(parseInt(params.maxResults || '10', 10), 1), 20);
    const cacheKey = `${channelIds.join(',')}:${maxResults}`;
    const cached = getCache(cacheKey);
    if (cached) {
      return json(200, cached);
    }

    const channelsUrl =
      `https://www.googleapis.com/youtube/v3/channels?` +
      new URLSearchParams({
        key: apiKey,
        part: 'contentDetails,statistics,snippet',
        id: channelIds.join(',')
      }).toString();

    const channelsResp = await fetch(channelsUrl);
    const channelsData = await channelsResp.json();
    if (!channelsResp.ok) {
      return json(channelsResp.status, channelsData);
    }

    const items = channelsData.items || [];
    const channelMap = items.map((item) => ({
      id: item.id,
      title: item?.snippet?.title || 'Channel',
      uploads: item?.contentDetails?.relatedPlaylists?.uploads || null,
      subscribers: item?.statistics?.subscriberCount || null
    }));

    const videosByChannel = await Promise.all(
      channelMap.map(async (channel) => {
        if (!channel.uploads) {
          return { channelId: channel.id, videos: [] };
        }

        const playlistUrl =
          `https://www.googleapis.com/youtube/v3/playlistItems?` +
          new URLSearchParams({
            key: apiKey,
            part: 'snippet',
            playlistId: channel.uploads,
            maxResults: String(maxResults)
          }).toString();

        const playlistResp = await fetch(playlistUrl);
        const playlistData = await playlistResp.json();
        if (!playlistResp.ok) {
          return { channelId: channel.id, videos: [], error: playlistData };
        }

        const videos = (playlistData.items || []).map((item) => ({
          id: item?.snippet?.resourceId?.videoId,
          title: item?.snippet?.title || 'Recent video',
          description: item?.snippet?.description || ''
        }));

        return { channelId: channel.id, videos };
      })
    );

    const result = {
      channels: channelMap.map((channel) => ({
        channelId: channel.id,
        title: channel.title,
        subscribers: channel.subscribers,
        videos: videosByChannel.find((v) => v.channelId === channel.id)?.videos || []
      }))
    };

    setCache(cacheKey, result);
    return json(200, result);
  } catch (err) {
    return json(500, { error: 'Server error', details: String(err) });
  }
};

function json(statusCode, body) {
  return {
    statusCode,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'public, max-age=300'
    },
    body: JSON.stringify(body)
  };
}

function getCache(key) {
  const entry = cache.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) {
    cache.delete(key);
    return null;
  }
  return entry.value;
}

function setCache(key, value) {
  cache.set(key, { value, expiresAt: Date.now() + CACHE_TTL_MS });
}
