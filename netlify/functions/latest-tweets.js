const DEFAULT_LIMIT = 6;

exports.handler = async (event) => {
  try {
    const token = process.env.X_BEARER_TOKEN;
    const username = process.env.X_USERNAME || 'harshktweets';
    const limitParam = event.queryStringParameters?.limit;
    const limit = Math.max(1, Math.min(Number(limitParam) || DEFAULT_LIMIT, 10));

    if (!token) {
      return {
        statusCode: 500,
        body: JSON.stringify({ error: 'Missing X_BEARER_TOKEN' })
      };
    }

    const userResp = await fetch(`https://api.x.com/2/users/by/username/${username}`, {
      headers: { Authorization: `Bearer ${token}` }
    });

    if (!userResp.ok) {
      const detail = await userResp.text();
      return {
        statusCode: userResp.status,
        body: JSON.stringify({ error: 'Failed to fetch user', detail })
      };
    }

    const userJson = await userResp.json();
    const userId = userJson?.data?.id;
    if (!userId) {
      return {
        statusCode: 404,
        body: JSON.stringify({ error: 'User not found' })
      };
    }

    const tweetsResp = await fetch(
      `https://api.x.com/2/users/${userId}/tweets?max_results=${limit}&tweet.fields=created_at,attachments`,
      { headers: { Authorization: `Bearer ${token}` } }
    );

    if (!tweetsResp.ok) {
      const detail = await tweetsResp.text();
      return {
        statusCode: tweetsResp.status,
        body: JSON.stringify({ error: 'Failed to fetch tweets', detail })
      };
    }

    const tweetsJson = await tweetsResp.json();
    const tweets = (tweetsJson.data || [])
      .filter((tweet) => !tweet.attachments)
      .map((tweet) => ({
        id: tweet.id,
        text: tweet.text,
        created_at: tweet.created_at || null
      }));

    return {
      statusCode: 200,
      headers: {
        'content-type': 'application/json',
        'cache-control': 'public, max-age=60'
      },
      body: JSON.stringify({ tweets })
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Unexpected error', detail: String(error) })
    };
  }
};
