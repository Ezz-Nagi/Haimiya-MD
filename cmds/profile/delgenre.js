import db from "#db";
export default {
    command: ['delgenre'],
    aliases: [],
    desc: 'Elimina el género guardado en el perfil.',
    usage: 'delgenre',
    isOwner: false,
    isAdmin: false,
    botAdmin: false,
    customPrefix: null,
    hidden: false,
    category: 'profile',
    run: async ({ msg, sock }) => {
        const user = await db.getUser(msg.sender);
        if (!user.genre)
            return msg.reply(`ꕥ No tienes un género asignado.`);
        user.genre = '';
        await db.updateUser(msg.sender, 'genre', user.genre);
        return msg.reply(`✐ Tu género ha sido eliminado.`);
    },
};
