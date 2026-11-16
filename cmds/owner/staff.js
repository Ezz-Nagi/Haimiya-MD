import { getStaff, hasPerm } from "../../lib/system/staff.js";
import { isCreator } from "../../lib/haimiya.js";
const GROUP_LINK = "https://chat.whatsapp.com/LKi2QOyN3EOImmZNjrxC4D?s=cl&p=a&iam=2";
const CHANNEL_LINK = "https://whatsapp.com/channel/0029VbCp0lj2UPBDo1HDzq3Z";
export default {
    command: ["staff"],
    aliases: [],
    desc: 'Muestra el Staff global registrado de Haimiya.',
    usage: 'staff',
    isOwner: true,
    perm: 'bots',
    isAdmin: false,
    botAdmin: false,
    customPrefix: null,
    hidden: false,
    category: 'developer',
    run: async ({ msg, sock, isOwner }) => {
        if (!isCreator(msg.sender) && !isOwner && !hasPerm(msg.sender, 'bots'))
            return msg.reply('《✧》 No tienes permiso para ver el Staff global.');
        const staff = getStaff();
        const mentions = staff.map(member => member.jid);
        let texto = `> ꕤ  ˖⁩   ౼ Información :: *Staff Haimiya*

ׅ  ׄ  ✤   ׅ り *Staff Oficial* :: *Haimiya*

ׅ  ׄ  ✤   ׅ り *Miembros* :: *${staff.length}*

`;
        for (const member of staff) {
            texto += `ׅ  ׄ  ✦   ׅ り *${member.role}* :: @${member.jid.split("@")[0]}\n`;
        }
        texto += `
ׅ  ׄ  ✤   ׅ り *Grupo Oficial* :: ${GROUP_LINK}

ׅ  ׄ  ✤   ׅ り *Canal Oficial* :: ${CHANNEL_LINK}`;
        await sock.sendMessage(msg.chat, {
            text: texto,
            mentions
        }, {
            quoted: msg
        });
    }
};
