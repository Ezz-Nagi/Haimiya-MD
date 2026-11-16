export default {
    command: ['setname', 'setsubject', 'gpname'],
    aliases: ['nombregrupo'],
    desc: 'Cambia el nombre del grupo.',
    usage: 'setname <nombre>',
    category: 'group',
    isOwner: false,
    hidden: false,
    isAdmin: true,
    botAdmin: true,
    run: async ({ msg, sock, text, args }) => {
        if (!msg.isGroup)
            return msg.reply('Solo en grupos.');
        const name = (text || args.join(' ') || '').trim();
        if (!name || name.length > 100)
            return msg.reply('✎ Uso: *#setname* <nombre>');
        try {
            await sock.groupUpdateSubject(msg.chat, name);
            await msg.reply('Nombre actualizado.');
        }
        catch {
            await msg.reply('No pude cambiar el nombre (¿soy admin?).');
        }
    }
};
