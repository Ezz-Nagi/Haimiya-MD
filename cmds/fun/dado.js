export default {
    command: ['dadosimple'],
    aliases: ['d6'],
    desc: 'Lanza un dado sencillo con el número de caras indicado.',
    usage: 'dadosimple [caras]',
    category: 'fun',
    isOwner: false,
    isAdmin: false,
    botAdmin: false,
    hidden: false,
    run: async ({ msg, args }) => {
        let faces = parseInt(args[0], 10);
        if (!Number.isFinite(faces))
            faces = 6;
        faces = Math.min(100, Math.max(2, faces));
        const n = 1 + Math.floor(Math.random() * faces);
        return msg.reply(`🎲 *${n}* (d${faces})`);
    }
};
