import { createHash } from 'node:crypto';
export default {
    command: ['hash'],
    aliases: ['sha256'],
    category: 'utils',
    desc: 'Calcula el hash SHA-256 del texto indicado.',
    usage: 'hash texto para convertir',
    isOwner: false,
    isAdmin: false,
    botAdmin: false,
    customPrefix: null,
    hidden: false,
    run: async ({ msg, args, usedPrefix, command }) => {
        const input = args.join(' ');
        if (!input) return msg.reply(`🔎 Uso: *${usedPrefix}${command} <texto>*`);
        if (input.length > 4000) return msg.reply('⚠️ El texto supera el límite de 4000 caracteres.');
        const digest = createHash('sha256').update(input, 'utf8').digest('hex');
        return msg.reply(`🔎 *SHA-256*\n\n\`${digest}\``);
    }
};
