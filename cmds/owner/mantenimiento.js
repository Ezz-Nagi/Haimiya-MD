import db from '#db';
import { setMaintenance, isMaintenance, maintenanceMessage } from '../../lib/system/runtime.js';
import { commandMaintenance, setCommandMaintenance, listCommandMaintenance } from '../../lib/system/command-health.js';
import { getBotSettingsId, isCreator, normalizeJid, ownerJid, phoneOf } from '../../lib/haimiya.js';
import { hasPerm } from '../../lib/system/staff.js';
import { panel, success, error, warning, field } from '../../lib/system/ui.js';
async function broadcast(sock, text) {
    const direct = db.getChatUser().map(entry => normalizeJid(entry?.user_id || '')).filter(jid => jid && jid.endsWith('@s.whatsapp.net') && jid !== normalizeJid(sock?.user?.id || ''));
    const groups = db.getChat().map(entry => normalizeJid(entry?.id || '')).filter(jid => jid.endsWith('@g.us'));
    const targets = [...new Set([...direct, ...groups])].slice(0, 5000);
    for (let i = 0; i < targets.length; i += 8) {
        await Promise.allSettled(targets.slice(i, i + 8).map(jid => sock.sendMessage(jid, { text })));
    }
    return targets.length;
}
export default {
    command: ['mantenimiento', 'mantemiento'],
    aliases: ['maintenance', 'mtto'],
    desc: 'Administra el mantenimiento global y las pausas automáticas de comandos.',
    usage: 'mantenimiento onbot|offbot · mantemiento <comando> on|off',
    category: 'owner',
    isAdmin: false,
    botAdmin: false,
    isOwner: false,
    perm: 'bots',
    hidden: false,
    run: async ({ msg, sock, args, command, usedPrefix }) => {
        const botId = getBotSettingsId(sock);
        const settings = db.getSettings(botId);
        const owner = ownerJid(settings.owner || '');
        const allowed = isCreator(msg.sender) || phoneOf(msg.sender) === phoneOf(owner) || hasPerm(msg.sender, 'bots');
        if (!allowed)
            return msg.reply(error('Permiso insuficiente', ['Este ajuste solo puede modificarlo el owner o el developer.']));
        const sub = String(args[0] || '').toLowerCase();
        if (command === 'mantemiento' || ['on', 'off'].includes(sub)) {
            if (sub === 'on') {
                setMaintenance(true, args.slice(1).join(' ') || 'El bot está en mantenimiento. Vuelve en unos minutos.');
                return msg.reply(success('Mantenimiento activado', ['Los usuarios recibirán un aviso al intentar usar el bot.']));
            }
            if (sub === 'off') {
                setMaintenance(false);
                return msg.reply(success('Mantenimiento desactivado', ['Haimiya vuelve a estar disponible.']));
            }
        }
        if (sub === 'onbot' || sub === 'offbot') {
            const on = sub === 'onbot';
            const message = on
                ? args.slice(1).join(' ') || 'Haimiya está en mantenimiento. Volverá a responder cuando termine la revisión.'
                : '';
            setMaintenance(on, message);
            const notice = on
                ? `🛠️ *Haimiya mío está en mantenimiento*\n\n${message}\n\nTe avisaremos cuando vuelva a estar disponible.`
                : '✅ *Haimiya mío está nuevamente disponible.* Ya puedes volver a usar sus comandos.';
            const count = await broadcast(sock, notice);
            return msg.reply(success(on ? 'Mantenimiento global activado' : 'Servicio restaurado', [`• *Avisos enviados:* ${count}`, on ? `• *Motivo:* ${message}` : 'Los comandos vuelven a estar disponibles.']));
        }
        if (args.length >= 2 && ['on', 'off'].includes(String(args[1]).toLowerCase())) {
            const name = String(args[0]).toLowerCase().replace(/^[#./!]+/, '');
            const on = String(args[1]).toLowerCase() === 'on';
            setCommandMaintenance(botId, name, on, 'Mantenimiento manual', false);
            return msg.reply(success(on ? 'Comando pausado' : 'Comando reactivado', [`• *Comando:* ${name}`, `• *Estado:* ${on ? 'Mantenimiento' : 'Disponible'}`]));
        }
        const paused = listCommandMaintenance(botId);
        const list = paused.length ? paused.map(entry => `• *${entry.command}* — ${entry.reason}${entry.until ? ` (${Math.max(1, Math.ceil((entry.until - Date.now()) / 60000))} min)` : ''}`).join('\n') : 'No hay comandos pausados.';
        return msg.reply(panel('Centro de mantenimiento', [field('Estado global', isMaintenance() ? 'ACTIVO' : 'INACTIVO'), isMaintenance() ? field('Motivo', maintenanceMessage() || 'Sin detalle') : '', '*Comandos pausados:*', list, '*Acciones:*', `• \`${usedPrefix}mantenimiento onbot|offbot\``, `• \`${usedPrefix}mantenimiento <comando> on|off\``, `• \`${usedPrefix}mantenimiento on|off\``], { icon: isMaintenance() || paused.length ? '!' : '✓', footer: 'Panel de administración' }));
    }
};
