import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const GATEWAY_URL = 'https://connector-gateway.lovable.dev/telegram';
const MAX_RUNTIME_MS = 55_000;
const MIN_REMAINING_MS = 5_000;

function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .substring(0, 80);
}

function extractHashtags(text: string): string[] {
  const matches = text.match(/#[\w\u00C0-\u024Fà-ÿ]+/g);
  if (!matches) return [];
  return matches.map(tag => tag.substring(1).toLowerCase());
}

function removeHashtags(text: string): string {
  return text.replace(/#[\w\u00C0-\u024Fà-ÿ]+/g, '').trim();
}

function getImageMetadata(filePath: string): { extension: string; contentType: string } {
  const lower = filePath.toLowerCase();
  if (lower.endsWith('.png')) return { extension: '.png', contentType: 'image/png' };
  if (lower.endsWith('.webp')) return { extension: '.webp', contentType: 'image/webp' };
  if (lower.endsWith('.gif')) return { extension: '.gif', contentType: 'image/gif' };
  if (lower.endsWith('.jpeg')) return { extension: '.jpeg', contentType: 'image/jpeg' };
  if (lower.endsWith('.jpg')) return { extension: '.jpg', contentType: 'image/jpeg' };
  return { extension: '.jpg', contentType: 'image/jpeg' };
}

async function findTenantByChatId(supabase: any, chatId: number): Promise<string | null> {
  const { data } = await supabase
    .from('tenants')
    .select('id')
    .eq('telegram_chat_id', chatId)
    .eq('ativo', true)
    .maybeSingle();
  return data?.id ?? null;
}

async function findCategoryByHashtag(supabase: any, hashtags: string[], tenantId: string | null): Promise<string | null> {
  if (hashtags.length === 0) return null;

  let query = supabase
    .from('categories')
    .select('id, nome, slug')
    .eq('ativa', true);
  if (tenantId) query = query.eq('tenant_id', tenantId);
  const { data: categories } = await query;

  if (!categories || categories.length === 0) return null;

  for (const tag of hashtags) {
    const normalizedTag = slugify(tag);
    for (const cat of categories) {
      const catSlug = cat.slug.toLowerCase();
      const catNome = slugify(cat.nome);
      if (
        catSlug === normalizedTag ||
        catNome === normalizedTag ||
        catSlug.includes(normalizedTag) ||
        normalizedTag.includes(catSlug)
      ) {
        return cat.id;
      }
    }
  }

  return null;
}

/**
 * Find the "active category" for a chat by looking at recent hashtag-only messages
 * (messages that are just a hashtag with no photo, sent in the last 10 minutes).
 * Also checks media group leaders for category inheritance.
 */
async function findActiveCategoryForChat(
  supabase: any,
  chatId: number,
  mediaGroupId: string | null,
  currentUpdateId: number
): Promise<{ categoriaId: string | null; baseName: string | null }> {
  // First, check media group leader if applicable
  if (mediaGroupId) {
    const { data: groupMessages } = await supabase
      .from('telegram_messages')
      .select('text, update_id')
      .eq('media_group_id', mediaGroupId)
      .order('update_id', { ascending: true })
      .limit(10);

    if (groupMessages) {
      for (const gm of groupMessages) {
        if (gm.text && gm.text.trim() && gm.update_id !== currentUpdateId) {
          const hashtags = extractHashtags(gm.text);
          const cleanCaption = removeHashtags(gm.text);
          const lines = cleanCaption.split('\n').filter((l: string) => l.trim());
          const nome = (lines[0] || '').trim().substring(0, 200);
          const categoriaId = await findCategoryByHashtag(supabase, hashtags, null);
          if (categoriaId) return { categoriaId, baseName: nome || null };
        }
      }
    }
  }

  // Second, look at recent messages from the same chat that contain hashtags
  // (within the last 10 minutes)
  const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000).toISOString();
  const { data: recentMessages } = await supabase
    .from('telegram_messages')
    .select('text, update_id')
    .eq('chat_id', chatId)
    .not('text', 'is', null)
    .gte('created_at', tenMinutesAgo)
    .order('update_id', { ascending: false })
    .limit(10);

  if (recentMessages) {
    for (const msg of recentMessages) {
      if (msg.update_id === currentUpdateId) continue;
      if (!msg.text) continue;
      const hashtags = extractHashtags(msg.text);
      if (hashtags.length > 0) {
        const categoriaId = await findCategoryByHashtag(supabase, hashtags, null);
        if (categoriaId) {
          const cleanText = removeHashtags(msg.text);
          const lines = cleanText.split('\n').filter((l: string) => l.trim());
          const baseName = (lines[0] || '').trim().substring(0, 200) || null;
          return { categoriaId, baseName };
        }
      }
    }
  }

  return { categoriaId: null, baseName: null };
}

function getPhotoProxyUrl(msg: any, updateId: number): string | null {
  if (!msg.photo || msg.photo.length === 0) {
    console.log(`[${updateId}] No photo found in message`);
    return null;
  }

  const largestPhoto = msg.photo[msg.photo.length - 1];
  const fileId = largestPhoto.file_id;
  console.log(`[${updateId}] Using proxy URL for file_id: ${fileId}`);

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  return `${supabaseUrl}/functions/v1/telegram-image?file_id=${encodeURIComponent(fileId)}`;
}

async function processMessage(
  update: any,
  supabase: any,
  gatewayHeaders: Record<string, string>,
  telegramBotToken?: string | null
): Promise<boolean> {
  const msg = update.message || update.channel_post;
  if (!msg) return false;

  const caption = msg.caption || msg.text || '';
  const mediaGroupId = msg.media_group_id || null;
  const hasPhoto = Array.isArray(msg.photo) && msg.photo.length > 0;
  const chatId = msg.chat?.id;

  // Bot feeds the MASTER catalog (tenant_id = null).
  // Products are visible to all tenants.

  // Skip commands
  if (caption.startsWith('/')) return false;

  const { data: msgState } = await supabase
    .from('telegram_messages')
    .select('processed')
    .eq('update_id', update.update_id)
    .maybeSingle();

  if (msgState?.processed) {
    console.log(`[${update.update_id}] Already processed, skipping`);
    return false;
  }

  // If it's a text-only message with hashtags (no photo), just store it for category reference
  if (!hasPhoto && caption.trim()) {
    const hashtags = extractHashtags(caption);
    if (hashtags.length > 0) {
      console.log(`[${update.update_id}] Category reference message: ${caption}`);
      await supabase
        .from('telegram_messages')
        .update({ processed: true })
        .eq('update_id', update.update_id);
      return false; // Not a product, just a category marker
    }
  }

  // Must have a photo to create a product
  if (!hasPhoto) return false;

  // Determine product info
  let nome = '';
  let descricao = '';
  let categoriaId: string | null = null;

  if (caption.trim()) {
    // This message has a caption — use it
    const hashtags = extractHashtags(caption);
    const cleanCaption = removeHashtags(caption);
    const lines = cleanCaption.split('\n').filter((l: string) => l.trim());
    nome = (lines[0] || '').trim().substring(0, 200);
    descricao = lines.slice(1).join('\n').trim() || '';
    categoriaId = await findCategoryByHashtag(supabase, hashtags, tenantId);
  } else {
    // No caption — find active category from recent messages or media group
    console.log(`[${update.update_id}] No caption, looking for active category in chat ${chatId}`);
    const activeInfo = await findActiveCategoryForChat(supabase, chatId, mediaGroupId, update.update_id);
    categoriaId = activeInfo.categoriaId;

    if (activeInfo.baseName) {
      nome = `${activeInfo.baseName} ${Date.now().toString(36)}`;
    } else {
      nome = `Produto ${new Date().toLocaleDateString('pt-BR')} ${Date.now().toString(36)}`;
    }
    console.log(`[${update.update_id}] Active category: ${categoriaId}, name: ${nome}`);
  }

  if (!nome || nome.length < 2) {
    nome = `Produto ${new Date().toLocaleDateString('pt-BR')} ${Date.now().toString(36)}`;
  }

  const slug = slugify(nome) + '-' + Date.now();

  const imagemUrl = getPhotoProxyUrl(msg, update.update_id);

  if (!imagemUrl) {
    console.error(`[${update.update_id}] No photo found in message.`);
    return false;
  }

  const { error: prodErr } = await supabase.from('products').insert({
    nome,
    slug,
    descricao,
    imagem_url: imagemUrl,
    categoria_id: categoriaId,
    tenant_id: null, // master catalog
    ativo: true,
    destaque: false,
    novidade: true,
    personalizavel: false,
    ordem: 0,
  });

  if (prodErr) {
    console.error('Product insert error:', prodErr.message);
    return false;
  }

  await supabase
    .from('telegram_messages')
    .update({ processed: true })
    .eq('update_id', update.update_id);

  return true;
}

async function processPendingMessages(
  supabase: any,
  gatewayHeaders: Record<string, string>,
  telegramBotToken?: string | null
): Promise<number> {
  const { data: pendingRows, error } = await supabase
    .from('telegram_messages')
    .select('update_id, raw_update')
    .eq('processed', false)
    .order('created_at', { ascending: true })
    .limit(25);

  if (error) {
    console.error('Pending messages fetch error:', error.message);
    return 0;
  }

  if (!pendingRows || pendingRows.length === 0) return 0;

  let recovered = 0;
  for (const row of pendingRows) {
    const created = await processMessage(row.raw_update, supabase, gatewayHeaders, telegramBotToken);
    if (created) recovered++;
  }

  return recovered;
}

Deno.serve(async () => {
  const startTime = Date.now();

  const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
  if (!LOVABLE_API_KEY) throw new Error('LOVABLE_API_KEY is not configured');

  const TELEGRAM_API_KEY = Deno.env.get('TELEGRAM_API_KEY');
  if (!TELEGRAM_API_KEY) throw new Error('TELEGRAM_API_KEY is not configured');

  const TELEGRAM_BOT_TOKEN = Deno.env.get('TELEGRAM_BOT_TOKEN');
  if (!TELEGRAM_BOT_TOKEN) {
    console.warn('TELEGRAM_BOT_TOKEN is not configured. Direct download fallback is disabled.');
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  const gatewayHeaders = {
    'Authorization': `Bearer ${LOVABLE_API_KEY}`,
    'X-Connection-Api-Key': TELEGRAM_API_KEY,
  };

  let totalProcessed = 0;
  let productsCreated = 0;
  let currentOffset: number;

  const { data: state, error: stateErr } = await supabase
    .from('telegram_bot_state')
    .select('update_offset')
    .eq('id', 1)
    .single();

  if (stateErr) {
    return new Response(JSON.stringify({ error: stateErr.message }), { status: 500 });
  }

  currentOffset = state.update_offset;

  // Process any pending messages first
  const recoveredBeforePolling = await processPendingMessages(supabase, gatewayHeaders, TELEGRAM_BOT_TOKEN);
  productsCreated += recoveredBeforePolling;

  // Poll continuously
  while (true) {
    const elapsed = Date.now() - startTime;
    const remainingMs = MAX_RUNTIME_MS - elapsed;
    if (remainingMs < MIN_REMAINING_MS) break;

    const timeout = Math.min(50, Math.floor(remainingMs / 1000) - 5);
    if (timeout < 1) break;

    const response = await fetch(`${GATEWAY_URL}/getUpdates`, {
      method: 'POST',
      headers: { ...gatewayHeaders, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        offset: currentOffset,
        timeout,
        allowed_updates: ['message', 'channel_post'],
      }),
    });

    const data = await response.json();
    if (!response.ok) {
      return new Response(JSON.stringify({ error: data }), { status: 502 });
    }

    const updates = data.result ?? [];
    if (updates.length === 0) continue;

    // Store all messages
    const rows = updates
      .filter((u: any) => u.message || u.channel_post)
      .map((u: any) => {
        const msg = u.message || u.channel_post;
        return {
          update_id: u.update_id,
          chat_id: msg.chat.id,
          text: msg.text || msg.caption || null,
          raw_update: u,
          media_group_id: msg.media_group_id || null,
        };
      });

    if (rows.length > 0) {
      const { error: insertErr } = await supabase
        .from('telegram_messages')
        .upsert(rows, { onConflict: 'update_id' });

      if (insertErr) console.error('Insert error:', insertErr.message);
      totalProcessed += rows.length;

      // Sort: messages with captions first, then by update_id
      const sortedUpdates = [...updates].sort((a: any, b: any) => {
        const msgA = a.message || a.channel_post;
        const msgB = b.message || b.channel_post;
        const captionA = msgA?.caption || msgA?.text || '';
        const captionB = msgB?.caption || msgB?.text || '';
        if (captionA && !captionB) return -1;
        if (!captionA && captionB) return 1;
        return a.update_id - b.update_id;
      });

      for (const update of sortedUpdates) {
        const created = await processMessage(update, supabase, gatewayHeaders, TELEGRAM_BOT_TOKEN);
        if (created) productsCreated++;
      }
    }

    const newOffset = Math.max(...updates.map((u: any) => u.update_id)) + 1;
    const { error: offsetErr } = await supabase
      .from('telegram_bot_state')
      .update({ update_offset: newOffset, updated_at: new Date().toISOString() })
      .eq('id', 1);

    if (offsetErr) {
      return new Response(JSON.stringify({ error: offsetErr.message }), { status: 500 });
    }

    currentOffset = newOffset;
  }

  return new Response(
    JSON.stringify({ ok: true, processed: totalProcessed, productsCreated, finalOffset: currentOffset }),
    { headers: { 'Content-Type': 'application/json' } }
  );
});
