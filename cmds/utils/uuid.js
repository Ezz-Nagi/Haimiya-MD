import { randomUUID } from 'node:crypto';
export default {
    command: ['uuid'],
    aliases: ['guid'],
    category: 'utils',
    desc: 'Genera identificadores UUID v4 aleatorios.',
    usage: 'uuid [cantidad 1-5]',
    isOwner: false,
    isAdmin: false,
    botAdmin: false,
    customPrefix: null,
    hidden: false,
    run: async ({ msg, args }) => {
        const count = args[0] === undefined ? 1 : Number(args[0]);
        if (!Number.isInteger(count) || count < 1 || count > 5) return msg.reply('⚠️ Indica una cantidad entre 1 y 5. Ejemplo: *#uuid 3*');
        const ids = Array.from({ length: count }, () => randomUUID());
        return msg.reply(`🧩 *UUID v4*\n\n${ids.map((id, index) => `${index + 1}. \`${id}\``).join('\n')}`);
    }
};
