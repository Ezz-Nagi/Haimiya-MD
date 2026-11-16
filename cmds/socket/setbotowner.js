import db from "#db";
import { canManageBot, getBotSettingsId } from "../../lib/haimiya.js";
export default {
    command: ['setbotowner'],
    aliases: ['setowner'],
    desc: 'Cambia el owner configurado para el socket actual.',
    usage: 'setbotowner @usuario',
    isOwner: false,
    isAdmin: false,
    botAdmin: false,
    customPrefix: null,
    hidden: false,
    category: 'socket',
    run: async ({ msg, sock, args, command, text, usedPrefix: prefix }) => {
        const idBot = getBotSettingsId(sock);
        const config = await db.getSettings(idBot);
        const owner = config.owner ? config.owner : '' || '';
        if (!canManageBot(msg.sender, config, sock))
            return msg.reply(mess.socket);
        const mentioned = msg.mentionedJid;
        const who = mentioned.length > 0 ? mentioned[0] : (msg.quoted ? msg.quoted.sender : false);
        const menti = sock.user.id.split(':')[0] + "@s.whatsapp.net";
        if (!who) {
            return sock.reply(msg.chat, `✿ Debes mencionar al nuevo dueño del bot.\n> Ejemplo: *${prefix + command} @${menti.split('@')[0]}*`, msg, { mentions: [menti] });
        }
        const anteriorOwner = config.owner;
        const esCambio = anteriorOwner && anteriorOwner.endsWith('@s.whatsapp.net');
        config.owner = who;
        await db.updateSettings(idBot, 'owner', config.owner);
        await db.updateSettings(idBot, 'ownerConfigured', true);
        const mensaje = esCambio
            ? `✤ El dueño del bot ha sido cambiado de @${anteriorOwner.split('@')[0]} a @${who.split('@')[0]}!`
            : `✤ El nuevo dueño de *${config.namebot2}* es @${who.split('@')[0]}!`;
        return msg.reply(mensaje, {
            mentions: esCambio ? [anteriorOwner, who] : [who]
        });
    },
};
