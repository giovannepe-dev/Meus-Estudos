## .env.local

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://seu-projeto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua_anon_key_aqui
SUPABASE_SERVICE_ROLE_KEY=sua_service_role_key_aqui   # NUNCA expor no client

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_APP_NAME=LaserPro

# Telegram Bot (opcional)
TELEGRAM_BOT_TOKEN=seu_bot_token
TELEGRAM_WEBHOOK_SECRET=seu_secret_hash

# Upstash Redis (rate limiting opcional)
UPSTASH_REDIS_REST_URL=
UPSTASH_REDIS_REST_TOKEN=
```
