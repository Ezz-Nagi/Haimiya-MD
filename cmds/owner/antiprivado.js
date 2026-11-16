import db from '#db';
import { isCreator } from '../../lib/haimiya.js';
export default {
    command: ['antiprivado'],
    aliases: ['antipriv', 'antiprivate'],
    category: 'owner',
    description: 'Activa o desactiva el bloqueo de respuestas en chats privados.',
    desc: 'Activa o desactiva el bloqueo de respuestas en chats privados.',
    usage: 'antiprivado <on|off>',
    isAdmin: false,
    botAdmin: false,
    customPrefix: null,
    hidden: false,
    isOwner: true,
    run: async ({ msg, sock, args, usedPrefix: prefix, command }) => {
        if (!isCreator(msg.sender))
            return msg.reply('😑 Este comando solo puede usarlo mi creador.');
        const botJid = `${String(sock.user?.id || sock.user?.lid || '').split(':')[0].split('@')[0]}@s.whatsapp.net`;
        const value = String(args?.[0] || '').toLowerCase();
        if (!['on', 'off'].includes(value)) {
            const current = Number((await db.getSettings(botJid)).antiPrivate || 0) === 1;
            return msg.reply(`✿ Estado actual: *${current ? 'ON' : 'OFF'}*\n> Uso: *${prefix}${command} on* o *${prefix}${command} off*`);
        }
        const enabled = value === 'on';
        await db.updateSettings(botJid, 'antiPrivate', enabled ? 1 : 0);
        return msg.reply(enabled
            ? '🛡️ *ANTI PRIVADO ACTIVADO*\n\nHaimiya ignorará los mensajes y comandos recibidos en chats privados.'
            : '🔓 *ANTI PRIVADO DESACTIVADO*\n\nHaimiya volverá a procesar normalmente los chats privados.');
    }
};
