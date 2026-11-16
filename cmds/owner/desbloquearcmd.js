import { unblockCmd } from '../../lib/system/runtime.js';
import { hasPerm } from '../../lib/system/staff.js';
import { isCreator } from '../../lib/haimiya.js';
export default {
    command: ['desbloquearcmd'],
    aliases: ['unblockcmd', 'cmdon'],
    desc: 'Reactiva un comando que habías bloqueado.',
    usage: 'desbloquearcmd <comando>',
    category: 'owner',
    isAdmin: false,
    botAdmin: false,
    hidden: false,
    isOwner: false,
    perm: 'bots',
    run: async ({ msg, args, usedPrefix }) => {
        if (!isCreator(msg.sender) && !hasPerm(msg.sender, 'bots'))
            return msg.reply('《✧》 Acceso denegado.');
        const n = String(args[0] || '').toLowerCase().replace(/^[#./!]/, '');
        if (!n)
            return msg.reply(`Uso: *${usedPrefix}desbloquearcmd <comando>*`);
        const real = global.comandos?.get(n)?.command || n;
        const r = unblockCmd(real);
        return msg.reply(r.success ? `🔓 *${real}* vuelve a estar disponible.` : `《✧》 ${r.error}`);
    }
};
