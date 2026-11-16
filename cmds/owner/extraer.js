import { OWNER_JID } from '../../lib/haimiya.js';
import { proto } from 'ezz-baileys';
const DEVELOPER = OWNER_JID;
const MAX_TEXT = 50000;
function normalize(value) {
    if (value === undefined)
        return undefined;
    if (value === null)
        return null;
    if (Buffer.isBuffer(value)) {
        return Object.fromEntries([...value.entries()].map(([k, v]) => [k, v]));
    }
    if (value instanceof Uint8Array) {
        return Object.fromEntries([...value.entries()].map(([k, v]) => [k, v]));
    }
    if (Array.isArray(value)) {
        return value.map(normalize);
    }
    if (typeof value === 'object') {
        const out = {};
        for (const [key, val] of Object.entries(value)) {
            const normalized = normalize(val);
            if (normalized !== undefined)
                out[key] = normalized;
        }
        return out;
    }
    return value;
}
function getQuotedMessage(msg) {
    return (msg?.quoted?.message ||
        msg?.quoted?.rawMessage?.message ||
        msg?.quoted?.msg ||
        msg?.quoted?.rawMessage ||
        null);
}
function buildCode(message) {
    const clean = normalize(message);
    return `const message = ${JSON.stringify(clean, null, 2)}

await sock.relayMessage(msg.chat, message, {
  messageId: msg.key.id
})`;
}
export default {
    command: ['extract'],
    aliases: [],
    desc: 'Extrae o recupera información solicitada desde el contexto del bot.',
    usage: 'extract <dato>',
    isOwner: false,
    isAdmin: false,
    botAdmin: false,
    customPrefix: null,
    hidden: false,
    category: 'owner',
    run: async ({ msg, sock }) => {
        const sender = msg.sender || msg.key?.participant || msg.key?.remoteJid;
        if (sender !== DEVELOPER) {
            return;
        }
        const message = getQuotedMessage(msg);
        if (!message) {
            return sock.reply(msg.chat, '《✧》 Responde o menciona un mensaje para extraerlo.', msg);
        }
        try {
            const code = buildCode(message);
            if (Buffer.byteLength(code, 'utf8') <= MAX_TEXT) {
                return sock.reply(msg.chat, `\`\`\`js\n${code}\n\`\`\``, msg);
            }
            const file = Buffer.from(code, 'utf8');
            await sock.sendMessage(msg.chat, {
                document: file,
                mimetype: 'text/javascript',
                fileName: `haimiya-extract-${Date.now()}.js`,
                caption: '《✧》 Código extraído. Responde a este archivo con #run para ejecutarlo.'
            }, { quoted: msg });
        }
        catch (e) {
            return sock.reply(msg.chat, `《✧》 No se pudo extraer el mensaje.\n\n${e.message}`, msg);
        }
    }
};
