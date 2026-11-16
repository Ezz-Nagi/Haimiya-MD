import { OWNER_JID } from '../../lib/haimiya.js';
import { downloadContentFromMessage } from 'ezz-baileys';
const DEVELOPER = OWNER_JID;
function getQuotedText(msg) {
    return (msg?.quoted?.text ||
        msg?.quoted?.caption ||
        msg?.quoted?.body ||
        msg?.quoted?.message?.conversation ||
        msg?.quoted?.message?.extendedTextMessage?.text ||
        msg?.quoted?.rawMessage?.message?.conversation ||
        msg?.quoted?.rawMessage?.message?.extendedTextMessage?.text ||
        null);
}
function getDocumentMessage(msg) {
    return (msg?.quoted?.message?.documentMessage ||
        msg?.quoted?.rawMessage?.message?.documentMessage ||
        msg?.quoted?.documentMessage ||
        null);
}
function cleanCode(text) {
    if (!text)
        return '';
    let code = String(text).trim();
    code = code.replace(/^```(?:javascript|js)?\s*/i, '');
    code = code.replace(/\s*```$/i, '');
    code = code.trim();
    return code;
}
async function getCode(msg) {
    const document = getDocumentMessage(msg);
    if (document) {
        const stream = await downloadContentFromMessage(document, 'document');
        const chunks = [];
        for await (const chunk of stream) {
            chunks.push(chunk);
        }
        return Buffer.concat(chunks).toString('utf8');
    }
    return cleanCode(getQuotedText(msg));
}
function extractMessageObject(code) {
    const source = code.trim();
    const start = source.indexOf('const message');
    if (start === -1) {
        return null;
    }
    const equal = source.indexOf('=', start);
    if (equal === -1) {
        return null;
    }
    let position = equal + 1;
    while (/\s/.test(source[position] || '')) {
        position++;
    }
    if (source[position] !== '{') {
        return null;
    }
    const objectStart = position;
    let depth = 0;
    let quote = null;
    let escaped = false;
    for (; position < source.length; position++) {
        const char = source[position];
        if (quote) {
            if (escaped) {
                escaped = false;
                continue;
            }
            if (char === '\\') {
                escaped = true;
                continue;
            }
            if (char === quote) {
                quote = null;
            }
            continue;
        }
        if (char === '"' || char === "'" || char === '`') {
            quote = char;
            continue;
        }
        if (char === '{') {
            depth++;
            continue;
        }
        if (char === '}') {
            depth--;
            if (depth === 0) {
                return source.slice(objectStart, position + 1);
            }
        }
    }
    return null;
}
function parseMessage(code) {
    const objectCode = extractMessageObject(code);
    if (!objectCode) {
        return null;
    }
    try {
        return JSON.parse(objectCode);
    }
    catch { }
    try {
        const AsyncFunction = Object.getPrototypeOf(async function () { }).constructor;
        const factory = new AsyncFunction(`
      return (${objectCode})
    `);
        return factory();
    }
    catch {
        return null;
    }
}
function restore(value) {
    if (value === null || value === undefined) {
        return value;
    }
    if (Array.isArray(value)) {
        return value.map(restore);
    }
    if (typeof value !== 'object') {
        return value;
    }
    const keys = Object.keys(value);
    if (keys.length > 0 &&
        keys.every(key => /^\d+$/.test(key))) {
        const ordered = keys
            .sort((a, b) => Number(a) - Number(b))
            .map(key => value[key]);
        if (ordered.every(v => Number.isInteger(v) && v >= 0 && v <= 255)) {
            return Buffer.from(ordered);
        }
    }
    const output = {};
    for (const [key, val] of Object.entries(value)) {
        output[key] = restore(val);
    }
    return output;
}
async function executeArbitrary(code, msg, sock) {
    const AsyncFunction = Object.getPrototypeOf(async function () { }).constructor;
    const fn = new AsyncFunction('msg', 'sock', 'args', 'text', `
      ${code}
    `);
    return await fn(msg, sock, [], code);
}
export default {
    command: ['ejecutar'],
    aliases: [],
    desc: 'Ejecuta una tarea o función mediante el sistema interno del bot.',
    usage: 'ejecutar <acción>',
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
        try {
            const code = await getCode(msg);
            if (!code) {
                return sock.reply(msg.chat, '《✧》 Responde al código extraído o al archivo generado por #extract.', msg);
            }
            const messageObject = parseMessage(code);
            if (messageObject) {
                const message = restore(messageObject);
                await sock.relayMessage(msg.chat, message, {
                    messageId: msg.key.id
                });
                return;
            }
            await executeArbitrary(code, msg, sock);
        }
        catch (e) {
            return sock.reply(msg.chat, `《✧》 No se pudo ejecutar el código.\n\n${e?.stack || e?.message || e}`, msg);
        }
    }
};
