import { revokePerms, PERMS } from '../../lib/system/staff.js';
import { isCreator } from '../../lib/haimiya.js';
import { getTarget, tag } from '../../lib/system/targets.js';
export default {
    command: ['delperm'],
    aliases: ['quitarperm', 'revokeperm'],
    desc: 'Quita permisos especiales a un miembro del staff.',
    usage: 'delperm @usuario <permiso|todos>',
    category: 'developer',
    isAdmin: false,
    botAdmin: false,
    hidden: false,
    isOwner: true,
    run: async ({ msg, sock, args, usedPrefix }) => {
        if (!isCreator(msg.sender))
            return msg.reply('《✧》 Solo el Developer puede quitar permisos.');
        const target = getTarget(msg, args);
        const perms = args.map(a => a.toLowerCase()).filter(a => PERMS[a] || a === 'todos' || a === 'all');
        if (!target || !perms.length)
            return msg.reply(`《✧》 Uso: *${usedPrefix}delperm @usuario <permiso|todos>*`);
        const r = revokePerms(target, perms);
        if (!r.success)
            return msg.reply(`《✧》 ${r.error}`);
        return sock.sendMessage(msg.chat, { text: `《✦》 Permisos de ${tag(target)} actualizados.\n\nAhora tiene: *${r.member.perms.join(', ') || 'ninguno'}*`, mentions: [target] }, { quoted: msg });
    }
};
