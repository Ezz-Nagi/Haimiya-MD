export default {
    command: ['elegir'],
    aliases: ['choose', 'decide', 'decidir'],
    desc: 'Elige al azar entre varias opciones separadas por | o por " o ".',
    usage: 'elegir pizza | tacos | sushi',
    category: 'utils',
    isOwner: false,
    isAdmin: false,
    botAdmin: false,
    customPrefix: null,
    hidden: false,
    run: async ({ msg, args, usedPrefix, command }) => {
        const opts = args.join(' ').split(/\s*\|\s*|\s+o\s+/i).map(s => s.trim()).filter(Boolean);
        if (opts.length < 2)
            return msg.reply(`《✧》 Dame al menos dos opciones.\nEjemplo: *${usedPrefix}${command} pizza | tacos | sushi*`);
        return msg.reply(`🤔 Entre ${opts.length} opciones, elijo:\n\n✨ *${opts[Math.floor(Math.random() * opts.length)]}*`);
    }
};
