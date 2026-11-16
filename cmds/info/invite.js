import { OWNER_JID } from '../../lib/haimiya.js';
import db from "#db";
import { isMainBot } from '../../lib/haimiya.js';
function msToTime(duration) {
    const milliseconds = parseInt((duration % 1000) / 100);
    let seconds = Math.floor((duration / 1000) % 60);
    let minutes = Math.floor((duration / (1000 * 60)) % 60);
    let hours = Math.floor((duration / (1000 * 60 * 60)) % 24);
    hours = hours < 10 ? '0' + hours : hours;
    minutes = minutes < 10 ? '0' + minutes : minutes;
    seconds = seconds < 10 ? '0' + seconds : seconds;
    return `${minutes} Minuto(s) ${seconds} Segundo(s)`;
}
const linkRegex = /chat\.whatsapp\.com\/([0-9A-Za-z]{20,24})(?:\s+[0-9]{1,3})?/i;
async function getGroupName(sock, chatId) {
    try {
        const metadata = await sock.groupMetadata(chatId);
        return metadata.subject || 'Grupo desconocido';
    }
    catch {
        return 'Chat privado';
    }
}
export default {
    command: ['invite'],
    aliases: ['invitar'],
    desc: 'Genera o muestra información para invitar al bot.',
    usage: 'invite',
    isOwner: false,
    isAdmin: false,
    botAdmin: false,
    customPrefix: null,
    hidden: false,
    category: 'info',
    run: async ({ msg, sock, args }) => {
        const grupo = msg.isGroup ? await getGroupName(sock, msg.chat) : 'Chat privado';
        const botId = sock.user.id.split(':')[0] + '@s.whatsapp.net';
        const botSettings = await db.getSettings(botId);
        const botname = botSettings.namebot2;
        const link = args.join(' ');
        const match = link.match(linkRegex);
        if (!match || !match[1]) {
            return msg.reply('《✤》 El enlace ingresado no es válido o está incompleto.');
        }
        if (!args || !args.length) {
            return msg.reply('《✤》 Ingresa el enlace para invitar al bot a tu grupo.');
        }
        const isPremiumBot = botSettings?.botprem === 1;
        const isModBot = botSettings?.botmod === 1;
        const botType = isMainBot(sock) ? 'Principal' : isPremiumBot ? 'Premium' : isModBot ? 'Main' : 'Sub Bot';
        const mencionar = msg.sender;
        const nombreUsuario = msg.pushName || 'Usuario';
        const sugg = `❀ 𝗦𝗢𝗟𝗜𝗖𝗜𝗧𝗨𝗗 𝗥𝗘𝗖𝗜𝗕𝗜𝗗𝗔

✩ *Usuario ›* @${msg.sender.split('@')[0]}
✿ *Enlace ›* ${args.join(' ')}
✿ *Chat ›* ${grupo}

➤ 𝗜𝗡𝗙𝗢 𝗕𝗢𝗧
♡ *Socket ›* ${botType}
★ *Nombre ›* ${botname}
❐ *Versión ›* @latest`;
        if (typeof sugg !== 'string' || !sugg.trim())
            return;
        try {
            await sock.sendMessage(OWNER_JID, {
                text: sugg,
                mentions: [mencionar]
            });
        }
        catch (e) {
            console.error('Error al enviar invitación al número:', e);
            msg.reply('No se pudo enviar la invitación al desarrollador.');
            return;
        }
        await sock.reply(msg.chat, '《✤》 Enlace de invitación enviado con éxito al Desarrollador.', msg);
    },
};
