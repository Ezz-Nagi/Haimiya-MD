import { resilienceStatus, eventLoopLag, memoryPressure } from '../../lib/system/resilience.js';
import { isCreator } from '../../lib/haimiya.js';
import { formatUptime } from '../../lib/haimiya.js';
import { panel, field } from '../../lib/system/ui.js';

export default {
    command: ['salud', 'health', 'load'],
    aliases: ['lag'],
    desc: 'Muestra memoria, carga y estabilidad del proceso.',
    usage: 'salud',
    category: 'developer',
    isCreator: true,
    isOwner: true,
    isAdmin: false,
    botAdmin: false,
    hidden: false,
    run: async ({ msg }) => {
        if (!isCreator(msg.sender)) return msg.reply('⛔ Comando exclusivo del developer.');
        const s = resilienceStatus();
        const m = s.memory || memoryPressure();
        const heapUsed = Math.round(m.heapUsed / 1024 / 1024);
        const heapTotal = Math.round(m.heapTotal / 1024 / 1024);
        const rows = [
            field('Proceso', process.pid),
            field('Uptime', formatUptime(process.uptime() * 1000)),
            field('Event loop', `${Math.round(s.lagMs || eventLoopLag())} ms`),
            field('RAM RSS', `${Math.round(m.rssMb)} MB`),
            field('Heap', `${heapUsed} / ${heapTotal} MB`),
            field('Errores recientes', `${s.errors30s} / 30 s`),
            field('Modo de alivio', s.shedding ? `Activo (${Math.ceil(s.shedMsLeft / 1000)} s)` : 'Inactivo'),
            field('Sockets WA', Array.isArray(global.conns) ? global.conns.length : 0)
        ];
        return msg.reply(panel('Salud del proceso', rows, { icon: s.shedding || s.errors30s > 10 ? '!' : '✓' }));
    }
};
