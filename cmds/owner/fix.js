import fs from 'node:fs';
import path from 'node:path';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { isCreator } from '../../lib/haimiya.js';
import { requestGracefulRestart } from '../../lib/system/lifecycle.js';
import { panel, success, error, field } from '../../lib/system/ui.js';

const execFileAsync = promisify(execFile);
const ROOT = process.cwd();
const NPM = process.platform === 'win32' ? 'npm.cmd' : 'npm';

async function run(file, args, timeout = 120000) {
    const result = await execFileAsync(file, args, {
        cwd: ROOT,
        timeout,
        maxBuffer: 8 * 1024 * 1024,
        windowsHide: true,
        env: process.env
    });
    return String(result.stdout || '').trim();
}

async function validateProject() {
    try {
        const output = await run(NPM, ['run', 'validate'], 180000);
        return { ok: true, detail: output.split('\n').slice(-1)[0] || 'Metadatos correctos' };
    } catch (e) {
        return { ok: false, detail: String(e.stderr || e.message).trim().split('\n').slice(-3).join(' | ').slice(0, 220) };
    }
}

function ensureRuntimeFolders() {
    const folders = ['database', 'database/whatsapp', 'Sessions', 'Sessions/Owner', 'Sessions/Subs', 'tmp'];
    for (const folder of folders) fs.mkdirSync(path.join(ROOT, folder), { recursive: true });
    return folders;
}

export default {
    command: ['fix', 'reparar'],
    aliases: ['diagnostico'],
    category: 'developer',
    desc: 'Diagnostica Haimiya y realiza reparaciones locales seguras.',
    usage: 'fix [check|repair|deps]',
    isCreator: true,
    isOwner: true,
    isAdmin: false,
    botAdmin: false,
    hidden: false,
    run: async ({ msg, args }) => {
        if (!isCreator(msg.sender)) return msg.reply(error('Acceso restringido', ['Este comando es exclusivo del developer.']));
        const mode = String(args[0] || 'check').toLowerCase();

        if (mode === 'deps') {
            await msg.reply(panel('Reparando dependencias', ['Instalando lo definido en package.json.', 'No cierres el proceso mientras termina.'], { icon: '⚙' }));
            try {
                await run(NPM, ['install', '--no-audit', '--no-fund', '--package-lock=false'], 10 * 60 * 1000);
                await msg.reply(success('Dependencias reparadas', ['La instalación terminó correctamente.', 'Se iniciará un reinicio gradual para cargar los módulos.']));
                requestGracefulRestart();
            } catch (e) {
                await msg.reply(error('No se pudieron reparar las dependencias', [String(e.stderr || e.message).slice(0, 700)]));
            }
            return;
        }

        if (mode === 'repair') {
            try {
                const folders = ensureRuntimeFolders();
                const validation = await validateProject();
                const rows = [field('Directorios revisados', folders.join(', ')), field('Validación', validation.ok ? 'Correcta' : 'Con errores'), validation.detail];
                return msg.reply(validation.ok ? success('Reparación local completada', rows) : error('Reparación parcial', rows));
            } catch (e) {
                return msg.reply(error('Falló la reparación', [String(e.message || e).slice(0, 500)]));
            }
        }

        if (!['check', 'diagnostico'].includes(mode)) {
            return msg.reply(panel('Uso de #fix', [
                '• `#fix` — diagnóstico sin modificar archivos.',
                '• `#fix repair` — recrea directorios de runtime y valida metadatos.',
                '• `#fix deps` — reinstala dependencias y reinicia gradualmente.'
            ], { icon: '⌘' }));
        }

        const nodeMajor = Number(process.versions.node.split('.')[0]);
        const packageOk = fs.existsSync(path.join(ROOT, 'package.json'));
        const dirs = ['cmds', 'lib', 'lib/wa'];
        const dirOk = dirs.every(dir => fs.existsSync(path.join(ROOT, dir)));
        const depsOk = fs.existsSync(path.join(ROOT, 'node_modules'));
        const validation = await validateProject();
        const rows = [
            field('Node.js', `${process.versions.node} ${nodeMajor >= 20 ? '✓' : '✗ requiere 20+'}`),
            field('package.json', packageOk ? 'Encontrado ✓' : 'No encontrado ✗'),
            field('Estructura', dirOk ? 'Completa ✓' : 'Faltan directorios ✗'),
            field('Dependencias', depsOk ? 'node_modules encontrado ✓' : 'node_modules ausente · usa #fix deps'),
            field('Metadatos', validation.ok ? 'Correctos ✓' : 'Revisar ✗'),
            validation.detail
        ];
        return msg.reply(panel('Diagnóstico del sistema', rows, { icon: validation.ok && nodeMajor >= 20 && packageOk && dirOk && depsOk ? '✓' : '!' }));
    }
};
