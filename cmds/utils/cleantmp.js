import fs from 'fs';
import path from 'path';
import { isCreator } from '../../lib/haimiya.js';
const TMP_DIR = path.join(process.cwd(), 'lib', 'system', 'tmp');
function formatBytes(bytes) {
    if (!bytes)
        return '0 B';
    const units = ['B', 'KB', 'MB', 'GB'];
    let i = 0;
    let value = bytes;
    while (value >= 1024 && i < units.length - 1) {
        value /= 1024;
        i++;
    }
    return `${value.toFixed(i ? 2 : 0)} ${units[i]}`;
}
export default {
    command: ['cleantmp'],
    aliases: ['limpiartmp', 'limpiartemp'],
    category: 'utils',
    isOwner: true,
    description: 'Limpia archivos temporales antiguos del bot.',
    desc: 'Limpia archivos temporales antiguos del bot.',
    usage: 'cleantmp',
    isAdmin: false,
    botAdmin: false,
    customPrefix: null,
    hidden: false,
    run: async ({ msg }) => {
        if (!isCreator(msg.sender)) {
            return msg.reply('🚫 No tienes permisos para usar este comando.');
        }
        try {
            fs.mkdirSync(TMP_DIR, { recursive: true });
            let removed = 0;
            let bytes = 0;
            const now = Date.now();
            const MAX_AGE = 2 * 60 * 1000;
            const entries = fs.readdirSync(TMP_DIR, { withFileTypes: true });
            for (const entry of entries) {
                if (!entry.isFile())
                    continue;
                const file = path.join(TMP_DIR, entry.name);
                try {
                    const stat = fs.statSync(file);
                    if (now - stat.mtimeMs < MAX_AGE)
                        continue;
                    bytes += stat.size;
                    fs.unlinkSync(file);
                    removed++;
                }
                catch { }
            }
            return msg.reply(`🧹 *Limpieza completada.*\n\n` +
                `📁 Archivos eliminados: *${removed}*\n` +
                `💾 Espacio liberado: *${formatBytes(bytes)}*\n` +
                `🛡️ Los archivos temporales recientes fueron conservados para no interrumpir stickers en proceso.`);
        }
        catch (error) {
            console.error('[CLEANTMP]', error);
            return msg.reply(`❌ No se pudo limpiar la carpeta temporal.\n${error?.message || 'Error desconocido.'}`);
        }
    }
};
