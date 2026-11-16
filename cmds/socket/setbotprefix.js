import db from "#db";
import { canManageBot } from "../../lib/haimiya.js";
import GraphemeSplitter from 'grapheme-splitter';
export default {
    command: ['setbotprefix'],
    aliases: ['setprefixbot'],
    desc: 'Configura el prefijo o modo de prefijos del bot.',
    usage: 'setbotprefix <prefijo|reset|noprefix>',
    isOwner: false,
    isAdmin: false,
    botAdmin: false,
    customPrefix: null,
    hidden: false,
    category: 'socket',
    run: async ({ msg, sock, args, command, text, usedPrefix: prefix }) => {
        const idBot = sock.user.id.split(':')[0] + '@s.whatsapp.net';
        const config = await db.getSettings(idBot);
        if (!canManageBot(msg.sender, config, sock))
            return sock.reply(msg.chat, mess.socket, msg);
        const value = args.join(' ').trim();
        const defaultPrefix = ["#", "/"];
        if (!value) {
            const lista = config.prefijo === null
                ? '`sin prefijos`'
                : (Array.isArray(config.prefijo) ? config.prefijo : [config.prefijo || '/']).map(p => `\`${p}\``).join(', ');
            return msg.reply(`✿ Por favor, elige cualquiera de los siguientes métodos de prefijos.\n\n` +
                `> *○ Multi-Prefix* :: ${prefix + command} *!/.+-#*\n` +
                `> *○ Reset* :: ${prefix + command} *reset*\n` +
                `> *○ No-Prefix* :: ${prefix + command} *noprefix*\n\n` +
                `✤ Actualmente se está usando: ${lista}`);
        }
        if (value.toLowerCase() === 'reset') {
            config.prefijo = defaultPrefix;
            await db.updateSettings(idBot, 'prefijo', config.prefijo);
            return sock.reply(msg.chat, `❖ Se han restaurado los prefijos predeterminados: *${defaultPrefix.join(' ')}*`, msg);
        }
        if (value.toLowerCase() === 'noprefix') {
            config.prefijo = 1;
            await db.updateSettings(idBot, 'prefijo', config.prefijo);
            return msg.reply(`❖ Se cambió al modo sin prefijos para el Socket correctamente.`);
        }
        const splitter = new GraphemeSplitter();
        const graphemes = splitter.splitGraphemes(value);
        const lista = [];
        for (const g of graphemes) {
            if (/^[a-zA-Z]+$/.test(g))
                continue;
            if (!lista.includes(g))
                lista.push(g);
        }
        if (lista.length === 0) {
            return sock.reply(msg.chat, '✿ No se detectaron prefijos válidos. Debes incluir al menos un símbolo o emoji.', msg);
        }
        if (lista.length > 6) {
            return sock.reply(msg.chat, '✿ Máximo 6 prefijos permitidos.', msg);
        }
        config.prefijo = lista;
        await db.updateSettings(idBot, 'prefijo', config.prefijo);
        return sock.reply(msg.chat, `✤ Se cambió el prefijo del Socket a *${lista.join(' ')}* correctamente.`, msg);
    },
};
