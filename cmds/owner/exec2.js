import db from "#db";
import cp from 'child_process';
import { promisify } from 'util';
const exec = promisify(cp.exec);
export default {
    command: ['r'],
    aliases: [],
    desc: 'Ejecuta una operación avanzada definida por el sistema del bot.',
    usage: 'r <código>',
    category: 'developer',
    isAdmin: false,
    botAdmin: false,
    customPrefix: null,
    hidden: false,
    isOwner: true,
    run: async ({ msg, sock, args }) => {
        const cmd = args.join(' ').trim();
        if (!cmd) {
            return;
        }
        let result;
        try {
            result = await exec(cmd);
        }
        catch (e) {
            result = e;
        }
        const { stdout, stderr } = result;
        if (stdout?.trim()) {
            sock.reply(msg.chat, stdout.trim(), msg);
        }
        if (stderr?.trim()) {
            sock.reply(msg.chat, stderr.trim(), msg);
        }
    }
};
