import { OWNER_JID } from '../../lib/haimiya.js';
import fs from 'fs';
import path from 'path';
const CMDS_DIR = path.join(process.cwd(), 'cmds');
const findPluginFile = (dirPath) => {
    if (!fs.existsSync(CMDS_DIR))
        return null;
    const stack = [CMDS_DIR];
    while (stack.length > 0) {
        const currentDir = stack.pop();
        const entries = fs.readdirSync(currentDir, { withFileTypes: true });
        for (const entry of entries) {
            const fullPath = path.join(currentDir, entry.name);
            if (entry.isDirectory()) {
                stack.push(fullPath);
            }
            else if (entry.name.endsWith('.js')) {
                const relativePath = path.relative(CMDS_DIR, fullPath).replace(/\\/g, '/');
                if (relativePath.toLowerCase() === `${dirPath}.js`) {
                    return fullPath;
                }
            }
        }
    }
    return null;
};
export default {
    command: ['getplugin'],
    aliases: [],
    category: 'developer',
    desc: 'Envía el código fuente de un plugin por su ruta.',
    usage: 'getplugin <ruta>',
    isOwner: false,
    isAdmin: false,
    botAdmin: false,
    customPrefix: null,
    hidden: false,
    isCreator: true,
    run: async ({ msg, sock, args }) => {
        if (msg.sender !== OWNER_JID) {
            return;
        }
        const name = args.join(' ').trim().toLowerCase() || '';
        if (!name) {
            return msg.reply('❌ Escribe la ruta del plugin. Ejemplo: *getplugin stickers/sticker*');
        }
        try {
            const filePath = findPluginFile(name);
            if (!filePath) {
                return msg.reply(`❌ No se encontró el plugin *${name}* en la carpeta cmds.`);
            }
            const content = fs.readFileSync(filePath, 'utf-8');
            const buffer = Buffer.from(content, 'utf-8');
            const fileName = path.basename(filePath);
            await sock.sendMessage(msg.chat, {
                document: buffer,
                mimetype: 'application/javascript',
                fileName: fileName,
                caption: `📄 *Plugin:* ${fileName}\n\n_Descarga el archivo para ver su código._`
            }, { quoted: msg });
        }
        catch (e) {
            console.error('[GETPLUGIN]', e);
            return msg.reply('❌ Error al leer el plugin.');
        }
    }
};
