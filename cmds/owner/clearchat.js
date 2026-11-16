export default {
    command: ['clearchat'],
    aliases: [],
    category: 'owner',
    desc: 'Borra el contenido del chat actual según las capacidades disponibles.',
    usage: 'clearchat',
    isOwner: true,
    isAdmin: false,
    botAdmin: false,
    customPrefix: null,
    hidden: false,
    run: async ({ msg, sock }) => {
        try {
            await sock.chatModify({ clear: true }, msg.chat);
            return msg.reply('✅ *Chat borrado completamente.*');
        }
        catch (e) {
            console.error('[CLEARCHAT]', e);
            return msg.reply(`❌ Error al borrar el chat: ${e?.message}`);
        }
    }
};
