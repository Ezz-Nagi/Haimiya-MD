import db from '#db';
const store = global.__msgCache || (global.__msgCache = new Map());
const MAX = 800;
function cacheKey(key) {
    if (!key)
        return '';
    return `${key.remoteJid}|${key.id}|${key.participant || key.fromMe || ''}`;
}
export function cacheMessage(msg) {
    try {
        if (!msg?.key?.id || msg.fromMe)
            return;
        const k = cacheKey(msg.key);
        const entry = {
            key: msg.key,
            sender: msg.sender || msg.key.participant || msg.key.remoteJid,
            type: msg.mtype || msg.type || 'text',
            text: String(msg.body || msg.text || '').slice(0, 2000),
            mimetype: msg.mimetype || msg.msg?.mimetype || '',
            media: null,
            at: Date.now()
        };
        store.set(k, entry);
        if (store.size > MAX) {
            const first = store.keys().next().value;
            store.delete(first);
        }
        if (typeof msg.download === 'function' && /image|video|audio|sticker|document/.test(entry.type + entry.mimetype)) {
            msg.download().then(buf => {
                if (buf?.length) {
                    const cur = store.get(k);
                    if (cur)
                        cur.media = buf;
                }
            }).catch(() => { });
        }
    }
    catch { }
}
export function takeCached(key) {
    const k = cacheKey(key);
    return store.get(k) || null;
}
export default {
    command: ['antidelete', 'anti-delete', 'antidel'],
    aliases: [],
    category: 'group',
    desc: 'Activa o desactiva la detección de mensajes eliminados.',
    isOwner: false,
    botAdmin: false,
    hidden: false,
    description: 'Si alguien borra su propio mensaje, el bot lo reenvía.',
    usage: 'antidelete on|off',
    isAdmin: true,
    run: async ({ msg, args }) => {
        if (!msg.isGroup)
            return msg.reply('Solo en grupos.');
        const sub = String(args[0] || '').toLowerCase();
        if (sub === 'on') {
            await db.updateChat(msg.chat, 'antidelete', 1);
            return msg.reply('✅ *Anti-delete* activado.\nSi alguien borra su propio mensaje, lo reenvío.');
        }
        if (sub === 'off') {
            await db.updateChat(msg.chat, 'antidelete', 0);
            return msg.reply('✅ Anti-delete desactivado.');
        }
        const chat = await db.getChat(msg.chat);
        return msg.reply(`Anti-delete: *${Number(chat?.antidelete) === 1 ? 'ON' : 'OFF'}*\nUso: #antidelete on|off`);
    },
    all: async function (msg, sock) {
        try {
            if (!msg)
                return;
            if (msg.key?.id && !msg.message?.protocolMessage) {
                cacheMessage(msg);
            }
            const proto = msg.message?.protocolMessage;
            const isRevoke = proto && (proto.type === 0 || proto.type === 'REVOKE' || Number(proto.type) === 0);
            if (!isRevoke)
                return;
            const chatId = msg.chat || msg.key?.remoteJid;
            if (!chatId || !String(chatId).endsWith('@g.us'))
                return;
            const chat = await db.getChat(chatId);
            if (Number(chat?.antidelete) !== 1)
                return;
            const revokedKey = proto.key;
            if (!revokedKey?.id)
                return;
            const deleter = msg.sender || msg.key?.participant || msg.participant;
            const cached = takeCached(revokedKey) || store.get(`${revokedKey.remoteJid}|${revokedKey.id}|`) ||
                [...store.values()].find(v => v.key?.id === revokedKey.id && v.key?.remoteJid === (revokedKey.remoteJid || chatId));
            if (!cached)
                return;
            const original = cached.sender;
            const d1 = String(deleter || '').split('@')[0].split(':')[0].replace(/\D/g, '');
            const o1 = String(original || '').split('@')[0].split(':')[0].replace(/\D/g, '');
            if (d1 && o1 && d1 !== o1)
                return;
            if (msg.fromMe)
                return;
            const header = 'enserio pensaste que no lo veríamos? 👁';
            const caption = `${header}\n\n${cached.text || ''}`.trim();
            if (cached.media && /image/.test(cached.type + cached.mimetype)) {
                await sock.sendMessage(chatId, { image: cached.media, caption });
            }
            else if (cached.media && /video/.test(cached.type + cached.mimetype)) {
                await sock.sendMessage(chatId, { video: cached.media, caption });
            }
            else if (cached.media && /sticker/.test(cached.type)) {
                await sock.sendMessage(chatId, { text: header + '\n_(sticker)_' });
                await sock.sendMessage(chatId, { sticker: cached.media });
            }
            else if (cached.media && /audio/.test(cached.type + cached.mimetype)) {
                await sock.sendMessage(chatId, { text: header });
                await sock.sendMessage(chatId, { audio: cached.media, mimetype: cached.mimetype || 'audio/mpeg', ptt: true });
            }
            else {
                await sock.sendMessage(chatId, {
                    text: `${header}\n\n${cached.text || '_(mensaje)_'}`
                });
            }
        }
        catch (e) {
            console.error('[antidelete]', e?.message || e);
        }
    }
};
