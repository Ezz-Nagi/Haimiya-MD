import { hasPerm } from '../../lib/system/staff.js';
import db from "#db";
import { isCreator } from '../../lib/haimiya.js';
export default {
    command: ['broadcast'],
    aliases: ['bc'],
    category: 'owner',
    description: 'Envía un aviso del owner a los grupos registrados.',
    desc: 'Envía un aviso a los grupos registrados.',
    usage: 'broadcast <mensaje>',
    isAdmin: false,
    botAdmin: false,
    customPrefix: null,
    hidden: false,
    isOwner: true,
    perm: 'broadcast',
    run: async ({ msg, sock, text }) => {
        if (!isCreator(msg.sender) && !hasPerm(msg.sender, 'broadcast'))
            return msg.reply('《✤》 Solo el owner.');
        if (!text)
            return msg.reply('《✤》 Escribe el mensaje: *#broadcast texto*');
        const chats = await db.getChat();
        const ids = chats.map(c => c?.id).filter(id => typeof id === 'string' && id.endsWith('@g.us'));
        let sent = 0;
        for (const jid of ids) {
            try {
                await sock.sendMessage(jid, { text: `📢 *HAIMIYA — AVISO OWNER*\n\n${text}` });
                sent++;
            }
            catch { }
        }
        return msg.reply(`✎ Broadcast enviado a *${sent}/${ids.length}* grupos.`);
    }
};
