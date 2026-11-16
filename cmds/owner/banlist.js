import { getGlobalBans } from '../../lib/system/globalban.js';
import { hasPerm } from '../../lib/system/staff.js';
import { isCreator } from '../../lib/haimiya.js';
export default {
    command: ['banlist'],
    aliases: ['listabans', 'betados'],
    desc: 'Lista los usuarios con ban global.',
    usage: 'banlist',
    category: 'owner',
    isAdmin: false,
    botAdmin: false,
    hidden: false,
    isOwner: false,
    perm: 'moderacion',
    run: async ({ msg, sock, usedPrefix }) => {
        if (!isCreator(msg.sender) && !hasPerm(msg.sender, 'moderacion'))
            return msg.reply('《✧》 Acceso denegado.');
        const bans = getGlobalBans();
        if (!bans.length)
            return msg.reply('✅ No hay usuarios con ban global.');
        const shown = bans.slice(-40).reverse();
        const lines = shown.map((b, i) => `${i + 1}. @${b.phone || String(b.jid).split('@')[0]}${b.name && b.name !== 'Desconocido' ? ` (${b.name})` : ''} · ${String(b.date || '').slice(0, 10)}`);
        return sock.sendMessage(msg.chat, { text: `🚫 *Ban global* (${bans.length})\n\n${lines.join('\n')}${bans.length > shown.length ? `\n… y ${bans.length - shown.length} más` : ''}\n\nQuitar: *${usedPrefix}unbetar @usuario*`, mentions: shown.map(b => b.jid) }, { quoted: msg });
    }
};
