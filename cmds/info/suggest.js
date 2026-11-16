import { OWNER_JID } from '../../lib/haimiya.js';
import db from "#db";
export default {
    command: ['report'],
    aliases: ['reporte', 'sug', 'suggest'],
    desc: 'Envía una sugerencia o reporte al sistema del bot.',
    usage: 'report <texto>',
    isOwner: false,
    isAdmin: false,
    botAdmin: false,
    customPrefix: null,
    hidden: false,
    category: 'info',
    run: async ({ msg, sock, args, command, text }) => {
        const texto = args.join(' ').trim();
        const now = Date.now();
        try {
            const userData = await db.getUser(msg.sender);
            const cooldown = userData.sugCooldown || 0;
            const restante = cooldown - now;
            if (restante > 0) {
                return msg.reply(`《✤》 Espera *${msToTime(restante)}* para volver a usar este comando.`);
            }
            if (!texto) {
                return msg.reply(`《✤》 Debes *escribir* el *reporte* o *sugerencia*.`);
            }
            if (texto.length < 10) {
                return msg.reply('✿ Tu mensaje es *demasiado corto*. Explica mejor tu reporte/sugerencia (mínimo 10 caracteres)');
            }
            const fecha = new Date();
            const opcionesFecha = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
            const fechaLocal = fecha.toLocaleDateString('es-MX', opcionesFecha);
            const tipo = (command === 'report' || command === 'reporte') ? '🆁ҽ𝕡σɾƚҽ' : '🆂մց𝕖ɾҽ𝚗cíᥲ';
            const mencionar = msg.sender;
            const displayName = msg.pushName || 'Usuario desconocido';
            const numero = msg.sender.split('@')[0];
            let reportMsg = `🫗۫᷒ᰰ⃘ׅ᷒  ۟　\`${tipo}\`　ׅ　ᩡ\n\n` +
                `𖹭  ׄ  ְ 🍒 *Nombre*\n> ${displayName}\n\n` +
                `𖹭  ׄ  ְ 🦩 *Número*\n> wa.me/${numero}\n\n` +
                `𖹭  ׄ  ְ 🍓 *Mensaje*\n> ${texto}\n\n` +
                `𖹭  ׄ  ְ 👤 *Usuario:*\n> @${numero}\n\n` +
                `_Reporte enviado por el usuario._`;
            try {
                await sock.sendMessage(OWNER_JID, {
                    text: reportMsg,
                    mentions: [mencionar]
                });
            }
            catch (e) {
                console.error('Error al enviar reporte al número:', e);
                return msg.reply('《✤》 Ocurrió un error al enviar tu reporte. Inténtalo más tarde.');
            }
            userData.sugCooldown = now + 24 * 60 * 60000;
            await db.updateUser(msg.sender, 'sugCooldown', userData.sugCooldown);
            msg.reply(`《✤》 Gracias por tu *${(command === 'report' || command === 'reporte') ? 'reporte' : 'sugerencia'}*\n\n> Tu mensaje fue enviado correctamente al moderador.`);
        }
        catch {
            msg.reply(msgglobal);
        }
    },
};
const msToTime = (duration) => {
    const seconds = Math.floor((duration / 1000) % 60);
    const minutes = Math.floor((duration / (1000 * 60)) % 60);
    const hours = Math.floor((duration / (1000 * 60 * 60)) % 24);
    const days = Math.floor(duration / (1000 * 60 * 60 * 24));
    const s = seconds.toString().padStart(2, '0');
    const msg = minutes.toString().padStart(2, '0');
    const h = hours.toString().padStart(2, '0');
    const d = days.toString();
    const parts = [];
    if (days > 0)
        parts.push(`${d} día${d > 1 ? 's' : ''}`);
    if (hours > 0)
        parts.push(`${h} hora${h > 1 ? 's' : ''}`);
    if (minutes > 0)
        parts.push(`${msg} minuto${msg > 1 ? 's' : ''}`);
    parts.push(`${s} segundo${s > 1 ? 's' : ''}`);
    return parts.join(', ');
};
