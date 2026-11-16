export default {
    command: ['encuesta'],
    aliases: ['poll', 'votacion'],
    desc: 'Crea una encuesta de WhatsApp en el grupo.',
    usage: 'encuesta ¿Pregunta? | opción 1 | opción 2 …',
    category: 'group',
    isOwner: false,
    isAdmin: true,
    botAdmin: false,
    customPrefix: null,
    hidden: false,
    run: async ({ msg, sock, args, usedPrefix, command }) => {
        if (!msg.isGroup)
            return msg.reply('《✧》 Este comando solo funciona en grupos.');
        const parts = args.join(' ').split('|').map(s => s.trim()).filter(Boolean);
        const [name, ...values] = parts;
        if (!name || values.length < 2)
            return msg.reply(`《✧》 Uso: *${usedPrefix}${command} ¿Qué cenamos? | Pizza | Tacos | Sushi*\nMínimo 2 opciones, máximo 12.`);
        if (values.length > 12)
            return msg.reply('《✧》 Máximo 12 opciones.');
        if (new Set(values.map(v => v.toLowerCase())).size !== values.length)
            return msg.reply('《✧》 Hay opciones repetidas.');
        return sock.sendMessage(msg.chat, { poll: { name: name.slice(0, 200), values: values.map(v => v.slice(0, 100)), selectableCount: 1 } });
    }
};
