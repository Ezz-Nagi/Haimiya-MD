import db from '#db';
export default {
  command: ['unmuteall'], aliases: ['desmutearall', 'desilenciartodos'],
  desc: 'Quita el silencio a todos los usuarios del grupo.',
  usage: 'unmuteall', category: 'group',
  isOwner: false, isAdmin: true, botAdmin: false, hidden: false,
  run: async ({ msg }) => {
    if (!msg.isGroup) return msg.reply('Este comando solo funciona en grupos.');
    const chat = await db.getChat(msg.chat);
    const total = Array.isArray(chat.mutedUsers) ? chat.mutedUsers.length : 0;
    if (!total) return msg.reply('No hay usuarios silenciados en este grupo.');
    await db.updateChat(msg.chat, 'mutedUsers', []);
    return msg.reply(`🔊 Se quitó el silencio a *${total}* usuario(s).`);
  }
};
