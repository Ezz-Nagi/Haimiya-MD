import db from '#db';
export default {
    command: ['reglas'],
    aliases: ['rules', 'normas'],
    desc: 'Muestra las reglas del grupo.',
    usage: 'reglas',
    category: 'group',
    isOwner: false,
    isAdmin: false,
    botAdmin: false,
    customPrefix: null,
    hidden: false,
    run: async ({ msg, usedPrefix }) => {
        if (!msg.isGroup)
            return msg.reply('《✧》 Este comando solo funciona en grupos.');
        const chat = await db.getChat(msg.chat);
        if (!chat.rules)
            return msg.reply(`📜 Este grupo aún no tiene reglas.\nUn admin puede crearlas con *${usedPrefix}setreglas <texto>*.`);
        return msg.reply(`📜 *Reglas del grupo*\n\n${chat.rules}`);
    }
};
