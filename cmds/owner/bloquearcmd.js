import { blockCmd, listBlocked } from '../../lib/system/runtime.js';
import { hasPerm } from '../../lib/system/staff.js';
import { isCreator } from '../../lib/haimiya.js';
const allowed = jid => isCreator(jid) || hasPerm(jid, 'bots');
const name = (args, usedPrefix) => String(args[0] || '').toLowerCase().replace(usedPrefix, '').replace(/^[#./!]/, '');
export default {
    command: ['bloquearcmd'],
    aliases: ['blockcmd', 'cmdoff'],
    desc: 'Desactiva un comando en todo el bot hasta que lo reactives.',
    usage: 'bloquearcmd <comando> | lista',
    category: 'owner',
    isAdmin: false,
    botAdmin: false,
    hidden: false,
    isOwner: false,
    perm: 'bots',
    run: async ({ msg, args, usedPrefix }) => {
        if (!allowed(msg.sender))
            return msg.reply('《✧》 Acceso denegado.');
        if (!args[0] || args[0].toLowerCase() === 'lista') {
            const l = listBlocked();
            return msg.reply(l.length ? `🔒 *Comandos bloqueados* (${l.length})\n${l.map(c => '✦ ' + c).join('\n')}\n\nReactivar: *${usedPrefix}desbloquearcmd <comando>*` : `No hay comandos bloqueados.\nUso: *${usedPrefix}bloquearcmd <comando>*`);
        }
        const n = name(args, usedPrefix);
        if (!global.comandos?.has(n))
            return msg.reply(`《✧》 El comando *${n}* no existe.`);
        const r = blockCmd(global.comandos.get(n).command);
        return msg.reply(r.success ? `🔒 *${global.comandos.get(n).command}* quedó desactivado para todos (menos staff).` : `《✧》 ${r.error}`);
    }
};
