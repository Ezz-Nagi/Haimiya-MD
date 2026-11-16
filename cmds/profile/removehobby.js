import db from "#db";
export default {
    command: ['delpasatiempo'],
    aliases: ['removehobby'],
    desc: 'Elimina un pasatiempo guardado en el perfil.',
    usage: 'delpasatiempo',
    isOwner: false,
    isAdmin: false,
    botAdmin: false,
    customPrefix: null,
    hidden: false,
    category: 'profile',
    run: async ({ msg, sock, args }) => {
        const user = await db.getUser(msg.sender);
        if (!user.pasatiempo || user.pasatiempo === 'No definido') {
            return msg.reply('ꕥ No tienes ningún pasatiempo establecido.');
        }
        const pasatiempoAnterior = user.pasatiempo;
        user.pasatiempo = 'No definido';
        await db.updateUser(msg.sender, 'pasatiempo', user.pasatiempo);
        return msg.reply(`✐ Se ha eliminado tu pasatiempo.`);
    },
};
