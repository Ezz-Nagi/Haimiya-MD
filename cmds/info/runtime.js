import { formatUptime } from '../../lib/haimiya.js';
export default {
    command: ['runtime', 'uptime'],
    aliases: ['activo'],
    desc: 'Tiempo activo del bot.',
    usage: 'runtime',
    category: 'info',
    isOwner: false,
    isAdmin: false,
    botAdmin: false,
    hidden: false,
    run: async ({ msg, sock }) => {
        const ms = sock?.uptime ? Date.now() - sock.uptime : process.uptime() * 1000;
        const up = typeof formatUptime === 'function' ? formatUptime(ms) : `${Math.floor(ms / 1000)}s`;
        return msg.reply(`⏱ Activo: *${up}*`);
    }
};
