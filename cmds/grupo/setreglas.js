import db from '#db';
export default {
    command: ['setreglas'],
    aliases: ['setrules', 'definirreglas'],
    desc: 'Define las reglas del grupo (usa "borrar" para quitarlas). Se ven con #reglas.',
    usage: 'setreglas <texto> | setreglas borrar',
    category: 'group',
    isOwner: false,
    isAdmin: true,
    botAdmin: false,
    customPrefix: null,
    hidden: false,
    run: async ({ msg, text, args, usedPrefix, command }) => {
        if (!msg.isGroup)
            return msg.reply('《✧》 Este comando solo funciona en grupos.');
        const body = String(text || args.join(' ') || '').trim() || String(msg.quoted?.text || msg.quoted?.body || '').trim();
        if (!body)
            return msg.reply(`《✧》 Uso: *${usedPrefix}${command} <texto>* (o responde a un mensaje con las reglas).\nPara quitarlas: *${usedPrefix}${command} borrar*`);
        if (/^(borrar|eliminar|quitar|off)$/i.test(body)) {
            await db.updateChat(msg.chat, 'rules', '');
            return msg.reply('📜 Reglas eliminadas.');
        }
        if (body.length > 2000)
            return msg.reply('《✧》 Las reglas no pueden pasar de 2000 caracteres.');
        await db.updateChat(msg.chat, 'rules', body);
        return msg.reply(`📜 Reglas guardadas. Cualquiera puede verlas con *${usedPrefix}reglas*.`);
    }
};
