import fs from 'fs';
import path from 'path';
const CMDS_DIR = path.join(process.cwd(), 'cmds');
const getPluginFiles = () => {
    const results = [];
    if (!fs.existsSync(CMDS_DIR))
        return results;
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
                results.push(path.relative(CMDS_DIR, fullPath).replace(/\\/g, '/'));
            }
        }
    }
    return results;
};
export default {
    command: ['plugins'],
    aliases: ['listplugins'],
    category: 'developer',
    desc: 'Muestra la lista de plugins cargados en el bot.',
    usage: 'plugins',
    isOwner: false,
    isAdmin: false,
    botAdmin: false,
    customPrefix: null,
    hidden: false,
    isCreator: true,
    run: async ({ msg, sock }) => {
        try {
            const files = getPluginFiles();
            if (files.length === 0) {
                return msg.reply('❌ No hay plugins cargados en la carpeta cmds.');
            }
            const lista = files.map((file, i) => `📄 *${i + 1}.* ${file}`).join('\n');
            await sock.sendMessage(msg.chat, {
                text: `🧩 *PLUGINS CARGADOS*\n\n${lista}\n\n_Usa *getplugin nombre* para obtener el código._`
            }, { quoted: msg });
        }
        catch (e) {
            console.error('[PLUGINS]', e);
            return msg.reply('❌ Error al leer la carpeta de plugins.');
        }
    }
};
