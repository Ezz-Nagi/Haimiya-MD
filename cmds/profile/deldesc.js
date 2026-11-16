import db from "#db";
export default {
    command: ['deldescription'],
    aliases: ['deldesc'],
    desc: 'Elimina la descripción del perfil.',
    usage: 'deldescription',
    isOwner: false,
    isAdmin: false,
    botAdmin: false,
    customPrefix: null,
    hidden: false,
    category: 'profile',
    run: async ({ msg, sock }) => {
        const user = await db.getUser(msg.sender);
        if (!user.description)
            return msg.reply(`ꕥ No tienes una descripción establecida.`);
        user.description = '';
        await db.updateUser(msg.sender, 'description', user.description);
        return msg.reply(`✐ Tu descripción ha sido eliminada.`);
    },
};
