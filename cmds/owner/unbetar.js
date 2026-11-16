import { hasPerm } from "../../lib/system/staff.js";
import { removeGlobalBan, normalizeJid } from "../../lib/system/globalban.js";
import { OWNER_JID } from '../../lib/haimiya.js';
const DEVELOPER = OWNER_JID;
function getTarget(msg, args = []) {
    const mentioned = msg?.mentionedJid || msg?.message?.extendedTextMessage?.contextInfo?.mentionedJid || [];
    if (mentioned.length)
        return normalizeJid(mentioned[0]);
    const number = args.find(x => /^\d{7,15}$/.test(String(x).replace(/\D/g, "")));
    return number ? normalizeJid(number) : null;
}
export default {
    command: ["unbetar"],
    aliases: [],
    desc: 'Desbloquea a un usuario previamente bloqueado.',
    usage: 'unbetar @usuario',
    isOwner: false,
    perm: 'moderacion',
    isAdmin: false,
    botAdmin: false,
    customPrefix: null,
    hidden: false,
    category: 'owner',
    run: async ({ msg, sock, args }) => {
        if (normalizeJid(msg.sender) !== DEVELOPER && !hasPerm(msg.sender, "moderacion"))
            return sock.reply(msg.chat, "《✧》 Acceso denegado.", msg);
        const target = getTarget(msg, args);
        if (!target)
            return sock.reply(msg.chat, "《✧》 Menciona al usuario: #unbetar @usuario", msg);
        const result = removeGlobalBan(target);
        if (!result.success)
            return sock.reply(msg.chat, "《✧》 Ese usuario no está bloqueado globalmente.", msg);
        return sock.reply(msg.chat, `╭━━━〔 🔓 HAIMIYA GLOBAL UNBAN 〕━━━╮\n│\n│ ✦ Usuario desbloqueado\n│   @${target.split("@")[0]}\n│\n╰━━━━━━━━━━━━━━━━━━━━━━╯`, msg);
    }
};
