import db from "#db";
export default {
    command: ['setgpname'],
    aliases: [],
    desc: 'Cambia el nombre del grupo mediante la configuración del bot.',
    usage: 'setgpname <nombre>',
    isOwner: false,
    customPrefix: null,
    hidden: false,
    category: 'group',
    isAdmin: true,
    botAdmin: true,
    run: async ({ msg, sock, args }) => {
        const newName = args.join(' ').trim();
        if (!newName)
            return msg.reply('🍒 Por favor, ingrese el nuevo nombre que desea ponerle al grupo.');
        try {
            await sock.groupUpdateSubject(msg.chat, newName);
            msg.reply(`🌽 El nombre del grupo se modificó correctamente.`);
        }
        catch {
            msg.reply(msgglobal);
        }
    },
};
