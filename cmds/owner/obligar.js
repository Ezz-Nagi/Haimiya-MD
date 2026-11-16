import db from "#db";
import { isCreator } from '../../lib/haimiya.js';
export default {
    command: ['obligar'],
    aliases: ['rompermatrimonio'],
    category: 'owner',
    desc: 'Administra acciones forzadas sobre relaciones del sistema de perfiles.',
    usage: 'obligar @usuario1 @usuario2 | rompermatrimonio @usuario',
    isOwner: true,
    isAdmin: false,
    botAdmin: false,
    customPrefix: null,
    hidden: false,
    run: async ({ msg, sock, args, command }) => {
        if (!isCreator(msg.sender))
            return msg.reply('🚫 Solo el creador puede usar este comando.');
        if (command === 'rompermatrimonio') {
            const mentioned = msg.mentionedJid;
            const target = mentioned.length > 0 ? mentioned[0] : (msg.quoted ? msg.quoted.sender : false);
            if (!target) {
                return msg.reply('《✤》 Menciona al usuario cuyo matrimonio deseas romper.\n\nEjemplo: *rompermatrimonio @usuario*');
            }
            const targetData = await db.getUser(target);
            if (!targetData?.marry) {
                return msg.reply(`✐ *${targetData.name || target.split('@')[0]}* no está casado con nadie.`);
            }
            const partner = targetData.marry;
            const partnerData = await db.getUser(partner);
            targetData.marry = null;
            partnerData.marry = null;
            await db.updateUser(target, 'marry', null);
            await db.updateUser(partner, 'marry', null);
            return msg.reply(`💔 *Matrimonio roto con éxito!*\n\n✐ *${targetData.name || target.split('@')[0]}* y *${partnerData.name || partner.split('@')[0]}* ya no están casados.\n\n🔒 *${targetData.name || target.split('@')[0]}* ahora es libre... ¡pero solo porque el creador lo permitió! 😈`);
        }
        const mentioned = msg.mentionedJid;
        const proposer = mentioned.length > 0 ? mentioned[0] : (msg.quoted ? msg.quoted.sender : false);
        const proposerJid = proposer || msg.sender;
        const proposee = msg.quoted ? msg.quoted.sender : (mentioned.length > 1 ? mentioned[1] : false);
        if (!proposerJid || !proposee) {
            return msg.reply('《✤》 Menciona a los dos usuarios que deseas obligar a casarse.\n\nEjemplo: *obligar @usuario1 @usuario2*');
        }
        if (proposerJid === proposee) {
            return msg.reply('「✿」 No puedes obligar a alguien a casarse consigo mismo.');
        }
        const proposerData = await db.getUser(proposerJid);
        const proposeeData = await db.getUser(proposee);
        if (proposerData?.marry) {
            return msg.reply(`✐ *${proposerData.name || proposerJid.split('@')[0]}* ya está casado con *${(await db.getUser(proposerData.marry))?.name || 'alguien'}*.`);
        }
        if (proposeeData?.marry) {
            return msg.reply(`✎ *${proposeeData.name || proposee.split('@')[0]}* ya está casado con *${(await db.getUser(proposeeData.marry))?.name || 'alguien'}*.`);
        }
        proposerData.marry = proposee;
        proposeeData.marry = proposerJid;
        await db.updateUser(proposerJid, 'marry', proposerData.marry);
        await db.updateUser(proposee, 'marry', proposeeData.marry);
        return msg.reply(`✐ *Matrimonio forzado con éxito!*\n\n💍 *${proposerData.name || proposerJid.split('@')[0]}* 💕 *${proposeeData.name || proposee.split('@')[0]}*\n\nAhora están casados. ¡No hay vuelta atrás! 😈`);
    }
};
