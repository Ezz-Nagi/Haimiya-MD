import { addStaff, normalizeJid } from "../../lib/system/staff.js";
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
    command: ["addstaff"],
    aliases: [],
    desc: 'Añade a un usuario al Staff global de Haimiya (solo developer).',
    usage: 'addstaff @usuario',
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
            return msg.reply("《✧》 Debes mencionar al usuario.\n\nEjemplo: #addstaff @usuario Moderador");
        }
        const mentioned = msg?.mentionedJid ||
            msg?.message?.extendedTextMessage?.contextInfo?.mentionedJid ||
            [];
        const role = args
            .filter(arg => !String(arg).replace(/\D/g, "").match(/^\d{7,15}$/))
            .filter(arg => !mentioned.includes(normalizeJid(arg)))
            .join(" ")
            .trim();
        if (!role) {
            return msg.reply("《✧》 Debes indicar el cargo.\n\nEjemplo: #addstaff @usuario Moderador");
        }
        const result = addStaff(target, role);
        if (!result.success) {
            return msg.reply(`《✧》 ${result.error}`);
        }
        return sock.sendMessage(msg.chat, {
            text: `《✦》 @${target.split("@")[0]} fue añadido al Staff Haimiya.\n\nCargo: *${result.member.role}*\nPermisos: *${(result.member.perms || []).join(', ') || 'ninguno'}*`,
            mentions: [target]
        }, {
            quoted: msg
        });
    }
};
