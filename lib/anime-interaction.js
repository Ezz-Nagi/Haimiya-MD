import db from '#db';

const DEFAULT_API_ROOT = 'https://haimiya.hidenplay.net';

function apiConfig() {
  const api = global.haimiyaApi || global.config?.api || {};
  const base = String(api.baseUrl || api.url || DEFAULT_API_ROOT).replace(/\/+$/, '');
  // Haimiya's existing configuration stores the REST base as /v1;
  // the interaction route belongs to the same API host at /sfw/interaction.
  const apiRoot = base.replace(/\/v1$/i, '');
  const apiKey = String(api.apiKey || api.key || process.env.HAIMIYA_API_KEY || '');
  return { apiRoot, apiKey, timeout: Number(api.timeout || 45000) };
}

async function getInteraction(interaction) {
  const { apiRoot, apiKey, timeout } = apiConfig();
  if (!apiKey) throw new Error('HAIMIYA_API_KEY no está configurada.');

  const url = new URL(`${apiRoot}/sfw/interaction`);
  url.searchParams.set('inter', interaction);
  url.searchParams.set('key', apiKey);

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeout);
  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: { Accept: 'video/*, image/gif, application/octet-stream, application/json' },
      signal: controller.signal,
      redirect: 'error'
    });

    const contentType = response.headers.get('content-type') || '';
    if (!response.ok || /application\/json/i.test(contentType)) {
      const detail = await response.text().catch(() => '');
      let message = `La API respondió HTTP ${response.status}.`;
      try {
        const body = JSON.parse(detail);
        message = body.message || body.error || message;
      } catch {}
      throw new Error(message);
    }

    const buffer = Buffer.from(await response.arrayBuffer());
    if (!buffer.length) throw new Error('La API devolvió un archivo vacío.');
    return buffer;
  } finally {
    clearTimeout(timer);
  }
}

export function createAnimeInteraction({ command, description, solo, withUser, aliases = [] }) {
  return {
    command: [command],
    aliases,
    category: 'anime',
    desc: description,
    usage: `${command} [@usuario]`,
    isOwner: false,
    isAdmin: false,
    botAdmin: false,
    customPrefix: null,
    hidden: false,
    run: async ({ msg, sock }) => {
      const target = msg.mentionedJid?.[0] || msg.quoted?.sender || msg.sender;
      const self = target === msg.sender;
      let caption;
      if (self) {
        caption = `${msg.pushName || 'Alguien'} ${solo}.`;
      } else {
        let targetName = 'alguien';
        try {
          const targetData = await db.getUser(target);
          targetName = targetData?.name || targetName;
        } catch {}
        const senderName = msg.pushName || 'Alguien';
        caption = `@${msg.sender.split('@')[0]} ${withUser} @${target.split('@')[0]} ${targetName ? `(${targetName})` : ''}`.trim();
      }

      try {
        const video = await getInteraction(command);
        return await sock.sendMessage(msg.chat, {
          video,
          gifPlayback: true,
          caption,
          mentions: self ? [msg.sender] : [msg.sender, target]
        }, { quoted: msg });
      } catch (error) {
        console.error(`[HAIMIYA INTERACTION:${command}]`, error?.message || error);
        return msg.reply('🖤 No pude cargar esta reacción desde Haimiya API. Inténtalo de nuevo más tarde.');
      }
    }
  };
}
