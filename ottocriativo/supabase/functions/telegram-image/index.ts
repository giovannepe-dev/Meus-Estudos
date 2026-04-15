const GATEWAY_URL = 'https://connector-gateway.lovable.dev/telegram';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const url = new URL(req.url);
  const fileId = url.searchParams.get('file_id');

  if (!fileId) {
    return new Response('Missing file_id', { status: 400, headers: corsHeaders });
  }

  const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
  if (!LOVABLE_API_KEY) return new Response('Server config error', { status: 500 });

  const TELEGRAM_API_KEY = Deno.env.get('TELEGRAM_API_KEY');
  if (!TELEGRAM_API_KEY) return new Response('Server config error', { status: 500 });

  const TELEGRAM_BOT_TOKEN = Deno.env.get('TELEGRAM_BOT_TOKEN');

  const headers = {
    'Authorization': `Bearer ${LOVABLE_API_KEY}`,
    'X-Connection-Api-Key': TELEGRAM_API_KEY,
    'Content-Type': 'application/json',
  };

  try {
    // Step 1: Get the file path from Telegram
    const fileResp = await fetch(`${GATEWAY_URL}/getFile`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ file_id: fileId }),
    });

    const fileData = await fileResp.json();

    if (!fileResp.ok || !fileData.result?.file_path) {
      // Fallback to direct Telegram API
      if (TELEGRAM_BOT_TOKEN) {
        const directResp = await fetch(
          `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/getFile?file_id=${fileId}`
        );
        const directData = await directResp.json();
        if (directResp.ok && directData.result?.file_path) {
          const imgResp = await fetch(
            `https://api.telegram.org/file/bot${TELEGRAM_BOT_TOKEN}/${encodeURI(directData.result.file_path)}`
          );
          if (imgResp.ok) {
            return new Response(imgResp.body, {
              headers: {
                ...corsHeaders,
                'Content-Type': imgResp.headers.get('Content-Type') || 'image/jpeg',
                'Cache-Control': 'public, max-age=86400',
              },
            });
          }
        }
      }
      return new Response('File not found', { status: 404, headers: corsHeaders });
    }

    const filePath = fileData.result.file_path;

    // Step 2: Try downloading via multiple methods
    const attempts = [];

    if (TELEGRAM_BOT_TOKEN) {
      attempts.push(
        `https://api.telegram.org/file/bot${TELEGRAM_BOT_TOKEN}/${encodeURI(filePath)}`
      );
    }

    for (const attemptUrl of attempts) {
      const resp = await fetch(attemptUrl);
      if (resp.ok) {
        return new Response(resp.body, {
          headers: {
            ...corsHeaders,
            'Content-Type': resp.headers.get('Content-Type') || 'image/jpeg',
            'Cache-Control': 'public, max-age=86400',
          },
        });
      }
    }

    // Try gateway file endpoint
    const gwResp = await fetch(`${GATEWAY_URL}/file/${filePath}`, {
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'X-Connection-Api-Key': TELEGRAM_API_KEY,
      },
    });

    if (gwResp.ok) {
      return new Response(gwResp.body, {
        headers: {
          ...corsHeaders,
          'Content-Type': gwResp.headers.get('Content-Type') || 'image/jpeg',
          'Cache-Control': 'public, max-age=86400',
        },
      });
    }

    return new Response('Download failed', { status: 502, headers: corsHeaders });
  } catch (err) {
    console.error('telegram-image error:', err);
    return new Response('Internal error', { status: 500, headers: corsHeaders });
  }
});
