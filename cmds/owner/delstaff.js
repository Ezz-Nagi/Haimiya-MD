import { removeStaff, normalizeJid } from "../../lib/system/staff.js";
import { OWNER_JID } from '../../lib/haimiya.js';
const DEVELOPER = OWNER_JID;
function getTarget(msg, args = []) {
    const mentioned = msg?.mentionedJid ||
        msg?.message?.extendedTextMessage?.contextInfo?.mentionedJid ||
        [];
    if (mentioned.length) {
        return normalizeJid(mentioned[0]);
    }
    const number = args.find(value => /^\d{7,15}$/.test(String(value).replace(/\D/g, "")));
    if (number) {
        return normalizeJid(`${number}@s.whatsapp.net`);
    }
    return null;
}
export default {
    command: ["delstaff"],
    aliases: [],
    desc: 'Elimina a un usuario del Staff global de Haimiya (solo developer).',
    usage: 'delstaff @usuario',
    isOwner: true,
    isAdmin: false,
    botAdmin: false,
    customPrefix: null,
    hidden: false,
    category: 'developer',
    run: async ({ msg, sock, args }) => {
        if (normalizeJid(msg?.sender) !== DEVELOPER) {
            return msg.reply("《✧》 Acceso denegado.");
        }
        const target = getTarget(msg, args);
        if (!target) {
            return msg.reply("《✧》 Debes mencionar al miembro que deseas eliminar.\n\nEjemplo: #delstaff @usuario");
        }
        const result = removeStaff(target);
        if (!result.success) {
            return msg.reply(`《✧》 ${result.error}`);
        }
        return sock.sendMessage(msg.chat, {
            text: `《✦》 @${target.split("@")[0]} fue eliminado del Staff Haimiya.`,
            mentions: [target]
        }, {
            quoted: msg
        });
    }
};
