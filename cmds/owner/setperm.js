import { grantPerms, PERMS } from '../../lib/system/staff.js';
import { isCreator } from '../../lib/haimiya.js';
import { getTarget, tag } from '../../lib/system/targets.js';
export default {
    command: ['setperm'],
    aliases: ['addperm', 'darperm'],
    desc: 'Da permisos especiales a un miembro del staff.',
    usage: 'setperm @usuario <permiso> [permiso…]',
    category: 'developer',
    isAdmin: false,
    botAdmin: false,
    hidden: false,
    isOwner: true,
    run: async ({ msg, sock, args, usedPrefix }) => {
        if (!isCreator(msg.sender))
            return msg.reply('《✧》 Solo el Developer puede dar permisos.');
        const target = getTarget(msg, args);
        const perms = args.map(a => a.toLowerCase()).filter(a => PERMS[a] || a === 'todos');
        if (!target || !perms.length) {
            return msg.reply(`《✧》 Uso: *${usedPrefix}setperm @usuario <permiso>*\nPermisos: ${Object.keys(PERMS).join(', ')}\nVer detalle: *${usedPrefix}perms*`);
        }
        const list = perms.includes('todos') ? Object.keys(PERMS) : perms;
        const r = grantPerms(target, list);
        if (!r.success)
            return msg.reply(`《✧》 ${r.error}${/no pertenece/.test(r.error) ? `\nPrimero agrégalo con *${usedPrefix}addstaff @usuario <cargo>*.` : ''}`);
        return sock.sendMessage(msg.chat, { text: `《✦》 Permisos de ${tag(target)} actualizados.\n\nAhora tiene: *${r.member.perms.join(', ') || 'ninguno'}*`, mentions: [target] }, { quoted: msg });
    }
};
