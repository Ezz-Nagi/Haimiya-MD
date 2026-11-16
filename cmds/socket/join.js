import db from "#db";
import { canManageBot } from "../../lib/haimiya.js";
export default {
    command: ['join'],
    aliases: ['unir'],
    desc: 'Hace que el bot entre a un grupo mediante su enlace.',
    usage: 'join <enlace>',
    category: 'socket',
    isOwner: false,
    isAdmin: false,
    botAdmin: false,
    customPrefix: null,
    hidden: false,
    isModeration: true,
    run: async ({ msg, sock, args }) => {
        const idBot = sock.user.id.split(':')[0] + '@s.whatsapp.net';
        const config = await db.getSettings(idBot);
        if (!canManageBot(msg.sender, config, sock))
            return msg.reply(mess.socket);
        if (!args[0])
            return msg.reply('《✧》 Ingresa el enlace del grupo para unir el bot.');
        const linkRegex = /chat\.whatsapp\.com\/([0-9A-Za-z]{20,24})/i;
        const match = args[0].match(linkRegex);
        if (!match || !match[1]) {
            return msg.reply('《✧》 El enlace ingresado no es válido o está incompleto.');
        }
        try {
            const inviteCode = match[1];
            await sock.groupAcceptInvite(inviteCode);
            await sock.reply(msg.chat, `❀ ${config.namebot} se ha unido exitosamente al grupo.`, msg);
        }
        catch (e) {
            const errMsg = String(e.message || e);
            if (errMsg.includes('not-authorized') || errMsg.includes('requires-admin')) {
                await msg.reply('《✧》 La unión requiere aprobación de administrador. Espera a que acepten tu solicitud.');
            }
            else if (errMsg.includes('not-in-group') || errMsg.includes('removed')) {
                await msg.reply('《✧》 No se pudo unir al grupo porque el bot fue eliminado recientemente.');
            }
            else {
                await msg.reply('《✧》 No se pudo unir al grupo, verifica el enlace o los permisos.');
            }
        }
    },
};
