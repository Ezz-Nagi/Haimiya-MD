export default {
    command: ['links'],
    aliases: ['enlaces', 'comunidad'],
    desc: 'Muestra el grupo y el canal oficial de Haimiya.',
    usage: 'links',
    isOwner: false,
    isAdmin: false,
    botAdmin: false,
    customPrefix: null,
    hidden: false,
    category: 'info',
    run: async ({ msg }) => {
        const group = global.config?.groupUrl || global.my?.groupUrl || 'https://chat.whatsapp.com/LKi2QOyN3EOImmZNjrxC4D?s=cl&p=a&iam=2';
        const channel = global.config?.channelUrl || global.my?.chUrl || 'https://whatsapp.com/channel/0029VbCp0lj2UPBDo1HDzq3Z';
        return msg.reply(`╭━━〔 🖤 HAIMIYA · COMUNIDAD 〕\n┃\n┃ ✦ Grupo oficial:\n┃ ${group}\n┃\n┃ ✦ Canal oficial:\n┃ ${channel}\n┃\n╰━━━━━━━━━━━━━━━━━━`);
    }
};
