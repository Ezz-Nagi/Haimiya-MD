import db from '#db';
import { getBotSettingsId } from '../../lib/haimiya.js';
import { performance } from 'node:perf_hooks';
import { panel, field } from '../../lib/system/ui.js';

export default {
    command: ['ping'],
    aliases: ['p'],
    desc: 'Mide el procesamiento local y el tiempo de aceptación del envío por WhatsApp.',
    usage: 'ping',
    category: 'info',
    isOwner: false,
    isAdmin: false,
    botAdmin: false,
    hidden: false,
    run: async ({ msg, sock }) => {
        const start = performance.now();
        const settings = db.getSettings(getBotSettingsId(sock));
        const botName = settings?.namebot || 'Haimiya mío';
        const localMs = performance.now() - start;
        const t0 = performance.now();
        let accepted = false;
        try {
            await sock.sendMessage(msg.chat, { react: { text: '⚡', key: msg.key } });
            accepted = true;
        } catch { }
        const sendMs = performance.now() - t0;
        const state = sendMs < 350 ? 'Óptimo' : sendMs < 900 ? 'Estable' : sendMs < 1800 ? 'Lento' : 'Degradado';
        const text = panel('Prueba de rendimiento', [
            field('Bot', botName),
            field('Procesamiento local', `${localMs.toFixed(2)} ms`),
            field('Aceptación de envío WA', accepted ? `${sendMs.toFixed(0)} ms` : 'No disponible'),
            field('Estado', accepted ? state : 'Sin confirmación de envío'),
            'La latencia de red completa puede variar según WhatsApp y el hosting.'
        ], { icon: '⚡', footer: 'Diagnóstico rápido' });
        return msg.reply(text);
    }
};
