import { ship } from '../../lib/system/fun-data.js';
import { getTarget, tag } from '../../lib/system/targets.js';
export default {
    command: ['compatibilidad'],
    aliases: ['ship', 'pareja'],
    desc: 'Mide la compatibilidad entre dos personas (menciona a dos, o escribe dos nombres).',
    usage: 'compatibilidad @a @b  |  compatibilidad Ana Luis',
    category: 'fun',
    isOwner: false, isAdmin: false, botAdmin: false, customPrefix: null, hidden: false,
    run: async ({ msg, sock, args, usedPrefix, command }) => {
        const mentions = (msg.mentionedJid || []).filter(Boolean);
        let a, b, label, jids = [];
        if (mentions.length >= 2) {
            [a, b] = mentions;
            jids = [a, b];
            label = `${tag(a)} ❤ ${tag(b)}`;
        }
        else if (mentions.length === 1) {
            a = msg.sender;
            b = mentions[0];
            jids = [a, b];
            label = `${tag(a)} ❤ ${tag(b)}`;
        }
        else {
            const names = args.join(' ').split(/\s+(?:y|e|con|\+|&)\s+|\s{2,}/i).map(s => s.trim()).filter(Boolean);
            const parts = names.length >= 2 ? names : args.filter(Boolean);
            if (parts.length < 2)
                return msg.reply(`《✧》 Uso: *${usedPrefix}${command} @persona1 @persona2* o *${usedPrefix}${command} Ana y Luis*`);
            a = parts[0];
            b = parts[1];
            label = `${a} ❤ ${b}`;
        }
        const r = ship(a, b);
        const text = `💘 *Compatibilidad*\n${label}\n\n${r.bar} *${r.pct}%*\n${r.msg}`;
        return jids.length ? sock.sendMessage(msg.chat, { text, mentions: jids }, { quoted: msg }) : msg.reply(text);
    }
};
