export default {
    command: ['gay', 'gayrate'],
    aliases: [],
    desc: 'Medidor random (broma).',
    usage: 'gay @user',
    category: 'fun',
    isOwner: false,
    isAdmin: false,
    botAdmin: false,
    hidden: false,
    run: async ({ msg }) => {
        const t = (msg.mentionedJid && msg.mentionedJid[0]) || msg.quoted?.sender || msg.sender;
        const n = Math.floor(Math.random() * 101);
        await msg.reply(`🏳️‍🌈 @${String(t).split('@')[0]}: *${n}%*`, { mentions: [t] }).catch(() => msg.reply(`🏳️‍🌈 ${n}%`));
    }
};
