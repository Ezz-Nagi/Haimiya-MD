export default {
    command: ['setdesc', 'setdescription', 'gpdesc'],
    aliases: ['descripcion'],
    desc: 'Cambia la descripción del grupo.',
    usage: 'setdesc <texto>',
    category: 'group',
    isOwner: false,
    hidden: false,
    isAdmin: true,
    botAdmin: true,
    run: async ({ msg, sock, text, args }) => {
        if (!msg.isGroup)
            return msg.reply('Solo en grupos.');
        const desc = (text || args.join(' ') || '').trim();
        if (!desc)
            return msg.reply('✎ Uso: *#setdesc* <texto>');
        try {
            await sock.groupUpdateDescription(msg.chat, desc.slice(0, 2000));
            await msg.reply('Descripción actualizada.');
        }
        catch {
            await msg.reply('No pude cambiar la descripción.');
        }
    }
};
