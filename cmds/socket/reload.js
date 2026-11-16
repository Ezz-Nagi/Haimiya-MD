import { isCreator, isMainBot } from "../../lib/haimiya.js";
import cmdsLoader from "#cmdsloader";
export default {
    command: ["reload"],
    aliases: [],
    category: 'socket',
    description: "Recarga los comandos y muestra los errores completos.",
    desc: 'Recarga los plugins de comandos y reporta errores de carga.',
    usage: 'reload',
    isOwner: true,
    isAdmin: false,
    botAdmin: false,
    customPrefix: null,
    hidden: false,
    run: async ({ msg, sock }) => {
        if (!isCreator(msg?.sender)) {
            return msg.reply("《✧》 Solo el Developer puede usar este comando.");
        }
        if (!isMainBot(sock)) {
            return msg.reply("《✧》 Este comando solo puede ejecutarse desde el bot principal.");
        }
        const logs = [];
        const originalError = console.error;
        const originalLog = console.log;
        const originalWarn = console.warn;
        const capture = (...args) => {
            const text = args
                .map(arg => {
                if (arg instanceof Error) {
                    return arg.stack || arg.message;
                }
                if (typeof arg === "object" && arg !== null) {
                    try {
                        return JSON.stringify(arg, null, 2);
                    }
                    catch {
                        return String(arg);
                    }
                }
                return String(arg);
            })
                .join(" ");
            logs.push(text);
        };
        console.error = capture;
        console.warn = capture;
        console.log = (...args) => {
            const text = args.map(String).join(" ");
            if (text.includes("Error") ||
                text.includes("ERROR") ||
                text.includes("error") ||
                text.includes("✖")) {
                capture(...args);
            }
        };
        const inicio = Date.now();
        try {
            await cmdsLoader();
        }
        catch (error) {
            capture("[RELOAD] Error ejecutando cmdsLoader:", error?.stack || error);
        }
        finally {
            console.error = originalError;
            console.log = originalLog;
            console.warn = originalWarn;
        }
        const tiempo = Date.now() - inicio;
        if (!logs.length) {
            return msg.reply(`╭─〔 ✦ RELOAD HAIMIYA ✦ 〕
│
│ ✓ Recarga completada
│ ✓ Comandos registrados: ${global.comandos?.size || 0}
│ ✓ Tiempo: ${tiempo}ms
│ ✓ Errores detectados: 0
│
╰────────────────────`);
        }
        let texto = `╭─〔 ✦ RELOAD HAIMIYA ✦ 〕
│
│ ✓ Comandos registrados: ${global.comandos?.size || 0}
│ ⏱ Tiempo: ${tiempo}ms
│ ✗ Errores detectados: ${logs.length}
│
╰─〔 ERRORES 〕
`;
        for (let i = 0; i < logs.length; i++) {
            texto += `\n╭─〔 ERROR ${i + 1} 〕\n`;
            texto += `${logs[i]}\n`;
            texto += `╰────────────────────\n`;
        }
        const limite = 60000;
        if (texto.length <= limite) {
            return msg.reply(texto);
        }
        const partes = [];
        for (let i = 0; i < texto.length; i += 5500) {
            partes.push(texto.slice(i, i + 5500));
        }
        await msg.reply(partes.shift());
        for (const parte of partes) {
            await sock.sendMessage(msg.chat, {
                text: parte
            });
        }
    }
};
