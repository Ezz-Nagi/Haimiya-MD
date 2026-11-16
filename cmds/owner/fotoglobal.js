import db from '#db';
import { canManageBot, isCreator } from '../../lib/haimiya.js';
const DEFAULT = 'https://i.supaimg.com/7cd8da25-b960-4335-a426-886ab502c855/e0ddf249-08d2-4ef1-b074-fa273fd4482f.jpg';
export default {
    command: ['fotoglobal', 'setfotoglobal', 'globalphoto'],
    aliases: [],
    category: 'owner',
    desc: 'Cambia la imagen global del bot (solo owner).',
    isAdmin: false,
    botAdmin: false,
    description: 'Foto global de respaldo (bienvenida/despedida si no hay foto del usuario).',
    usage: 'fotoglobal <url> | responde a una imagen | fotoglobal reset',
    isOwner: true,
    hidden: false,
    run: async ({ msg, sock, args }) => {
        const idBot = (sock.user?.id || '').split(':')[0].split('@')[0].replace(/\D/g, '');
        const botJid = idBot ? `${idBot}@s.whatsapp.net` : '';
        const config = await db.getSettings(botJid);
        if (!canManageBot(msg.sender, config, sock) && !isCreator(msg.sender)) {
            return msg.reply('Solo el owner/developer puede cambiar la foto global.');
        }
        const value = args.join(' ').trim();
        if (/^reset|default|borrar$/i.test(value)) {
            await db.updateSettings(botJid, 'fotoglobal', DEFAULT);
            global.fotoglobal = DEFAULT;
            return msg.reply('❖ Foto global restaurada a la predeterminada.');
        }
        if (value.startsWith('http')) {
            await db.updateSettings(botJid, 'fotoglobal', value);
            global.fotoglobal = value;
            return msg.reply('❖ Foto global actualizada.\n🔗 ' + value);
        }
        return msg.reply('Para evitar servicios de alojamiento externos, configura la foto con #fotoglobal <URL pública directa>.');
    }
};
