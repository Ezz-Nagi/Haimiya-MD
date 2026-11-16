import db from '#db';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
const dirname = path.dirname(fileURLToPath(import.meta.url));
const SESSIONS_ROOT = path.join(dirname, '../../Sessions');
function justNumber(jid) {
    if (!jid)
        return '';
    return String(jid).split('@')[0].split(':')[0].replace(/\D/g, '');
}
function normalizeJid(jid) {
    const n = justNumber(jid);
    return n ? `${n}@s.whatsapp.net` : '';
}
function sessionNumbersFrom(folder) {
    const base = path.join(SESSIONS_ROOT, folder);
    if (!fs.existsSync(base))
        return [];
    const out = [];
    try {
        for (const name of fs.readdirSync(base)) {
            if (name.startsWith('_') || name.startsWith('.'))
                continue;
            const creds = path.join(base, name, 'creds.json');
            if (!fs.existsSync(creds))
                continue;
            const n = justNumber(name);
            if (n)
                out.push(n);
        }
    }
    catch { }
    return out;
}
function collectHaimiyaNumbers(sock) {
    const nums = new Set();
    const add = (v) => {
        const n = justNumber(v);
        if (n && n.length >= 8)
            nums.add(n);
    };
    try {
        add(sock?.user?.id);
        add(sock?.user?.lid);
    }
    catch { }
    try {
        add(global.waSock?.user?.id);
        add(global.waSock?.user?.lid);
    }
    catch { }
    try {
        for (const c of global.conns || []) {
            add(c?.userId);
            add(c?.user?.id);
            add(c?.user?.lid);
            add(c?.id);
        }
    }
    catch { }
    for (const folder of ['Owner', 'Subs']) {
        for (const n of sessionNumbersFrom(folder))
            add(n);
    }
    try {
        const s = global.sock;
        if (s?.user?.id)
            add(s.user.id);
    }
    catch { }
    return nums;
}
function pickTarget(msg, args) {
    const mentioned = Array.isArray(msg.mentionedJid) ? msg.mentionedJid : [];
    if (mentioned.length)
        return mentioned[0];
    if (msg.quoted?.sender)
        return msg.quoted.sender;
    if (msg.quoted?.participant)
        return msg.quoted.participant;
    const raw = (args || []).join(' ').trim();
    if (raw) {
        const n = justNumber(raw.replace(/^@/, ''));
        if (n)
            return n + '@s.whatsapp.net';
    }
    const ctx = msg.message?.extendedTextMessage?.contextInfo;
    if (ctx?.participant)
        return ctx.participant;
    return null;
}
export default {
    command: ['setprimary'],
    aliases: ['primary', 'botprimary'],
    desc: 'Configura qué instancia de Haimiya responde en este grupo.',
    usage: 'setprimary @bot | responde al bot',
    isOwner: false,
    isAdmin: true,
    botAdmin: false,
    customPrefix: null,
    hidden: false,
    category: 'group',
    run: async ({ msg, sock, args }) => {
        try {
            if (!msg.isGroup) {
                return sock.reply(msg.chat, '《✤》 Este comando solo funciona en grupos.', msg);
            }
            const who = pickTarget(msg, args);
            if (!who) {
                return sock.reply(msg.chat, '《✤》 Menciona un bot de Haimiya o *responde* a un mensaje suyo.\nEj: *#setprimary @bot*', msg);
            }
            const whoNumber = justNumber(who);
            if (!whoNumber) {
                return sock.reply(msg.chat, '《✤》 No pude leer el número del bot mencionado.', msg);
            }
            let participants = [];
            try {
                const meta = await sock.groupMetadata(msg.chat).catch(() => null);
                participants = meta?.participants || [];
            }
            catch { }
            const inGroup = participants.some((p) => {
                const ids = [p?.id, p?.jid, p?.lid, p?.phoneNumber].filter(Boolean).map(justNumber);
                return ids.includes(whoNumber);
            });
            if (participants.length && !inGroup) {
                return sock.reply(msg.chat, '《✧》 Ese número no está en este grupo (o es un LID que no pude resolver).', msg);
            }
            const haimiyaNums = collectHaimiyaNumbers(sock);
            const isHaimiya = haimiyaNums.has(whoNumber);
            let hasSettings = false;
            try {
                const st = await db.getSettings(normalizeJid(whoNumber));
                hasSettings = !!(st && (st.namebot || st.namebot2 || st.type || st.owner));
            }
            catch { }
            if (!isHaimiya && !hasSettings) {
                return sock.reply(msg.chat, '✿ El usuario mencionado no es una instancia válida de Haimiya.\n' +
                    'Asegúrate de mencionar un bot vinculado (principal o subbot).', msg);
            }
            const realBotJid = normalizeJid(whoNumber);
            const chat = (await db.getChat(msg.chat)) || {};
            if (normalizeJid(chat.primaryBot) === realBotJid) {
                return sock.reply(msg.chat, `✎ @${whoNumber} ya es el bot principal de este grupo.`, msg, { mentions: [realBotJid] });
            }
            const previous = chat.primaryBot || null;
            await db.updateChat(msg.chat, 'primaryBot', realBotJid);
            await sock.reply(msg.chat, `✐ Se estableció a @${whoNumber} como bot primario de este grupo.\n` +
                `> Los comandos de este grupo los atenderá @${whoNumber}.`, msg, { mentions: [realBotJid] });
            console.log(`[HAIMIYA] primaryBot ${msg.chat}: ${previous || '—'} → ${realBotJid} (sesiones: ${[...haimiyaNums].length})`);
        }
        catch (e) {
            console.error('[setprimary]', e?.stack || e);
            return sock.reply(msg.chat, '❌ No se pudo cambiar el bot primario.', msg);
        }
    }
};
