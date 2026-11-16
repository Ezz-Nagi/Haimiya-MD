import db from '#db';
import os from 'node:os';
import { getBotSettingsId, formatUptime } from '../../lib/haimiya.js';
import { panel, field } from '../../lib/system/ui.js';

export default {
    command: ['status', 'estado'],
    aliases: [],
    desc: 'Muestra estadísticas generales del bot y del servidor.',
    usage: 'status',
    category: 'info',
    isOwner: false,
    isAdmin: false,
    botAdmin: false,
    hidden: false,
    run: async ({ msg, sock }) => {
        const users = await db.getUser();
        const chats = await db.getChat();
        const userCount = Array.isArray(users) ? users.length : Object.keys(users || {}).length;
        const groupCount = Array.isArray(chats) ? chats.filter(x => String(x?.id || '').endsWith('@g.us')).length : Object.keys(chats || {}).filter(x => x.endsWith('@g.us')).length;
        const settings = db.getSettings(getBotSettingsId(sock));
        const cpu = os.cpus()?.length || 0;
        const used = (os.totalmem() - os.freemem()) / 1024 ** 3;
        const total = os.totalmem() / 1024 ** 3;
        return msg.reply(panel('Estado general', [
            field('Nombre', settings?.namebot || 'Haimiya mío'),
            field('Usuarios registrados', userCount.toLocaleString()),
            field('Grupos registrados', groupCount.toLocaleString()),
            field('Comandos ejecutados', Number(settings?.commandsejecut || 0).toLocaleString()),
            field('Tiempo activo', formatUptime(process.uptime() * 1000)),
            field('Sistema', `${os.type()} · ${os.arch()}`),
            field('CPU', `${cpu} núcleos`),
            field('Memoria', `${used.toFixed(2)} / ${total.toFixed(2)} GB`)
        ], { icon: '◈', footer: 'Estado del sistema' }));
    }
};
