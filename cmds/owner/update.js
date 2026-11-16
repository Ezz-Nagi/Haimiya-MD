import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { isCreator } from '../../lib/haimiya.js';
import { requestGracefulRestart } from '../../lib/system/lifecycle.js';
import { panel, success, error, warning, field } from '../../lib/system/ui.js';

const execFileAsync = promisify(execFile);
const ROOT = process.cwd();
const NPM = process.platform === 'win32' ? 'npm.cmd' : 'npm';

async function git(args, timeout = 120000) {
    const result = await execFileAsync('git', args, {
        cwd: ROOT,
        timeout,
        maxBuffer: 8 * 1024 * 1024,
        windowsHide: true
    });
    return String(result.stdout || '').trim();
}

export default {
    command: ['update', 'actualizar'],
    aliases: ['actualizacion'],
    category: 'developer',
    desc: 'Actualiza Haimiya desde su rama Git configurada y reinicia de forma gradual.',
    usage: 'update',
    isCreator: true,
    isOwner: true,
    isAdmin: false,
    botAdmin: false,
    hidden: false,
    run: async ({ msg }) => {
        if (!isCreator(msg.sender)) return msg.reply(error('Acceso restringido', ['Este comando es exclusivo del developer.']));
        let codeUpdated = false;
        await msg.reply(panel('Comprobando actualizaciones', ['Revisando repositorio, rama y cambios locales.', 'No se sobrescribirán modificaciones locales.'], { icon: '↻' }));
        try {
            const inside = await git(['rev-parse', '--is-inside-work-tree']);
            if (inside !== 'true') throw new Error('Esta instalación no está dentro de un repositorio Git.');

            const branch = await git(['branch', '--show-current']);
            if (!branch) throw new Error('No se pudo identificar la rama actual.');
            const dirty = await git(['status', '--porcelain']);
            if (dirty) {
                return msg.reply(warning('Actualización detenida', [
                    'Hay cambios locales o archivos sin registrar.',
                    'Guárdalos o respáldalos y vuelve a ejecutar `#update`.',
                    field('Rama', branch)
                ]));
            }

            await git(['fetch', '--prune', 'origin'], 180000);
            let upstream;
            try { upstream = await git(['rev-parse', '--abbrev-ref', '--symbolic-full-name', '@{u}']); }
            catch { throw new Error(`La rama ${branch} no tiene upstream configurado. Configura origin/${branch} como upstream.`); }
            const behind = Number(await git(['rev-list', '--count', `HEAD..${upstream}`]));
            if (!Number.isFinite(behind)) throw new Error('No se pudo calcular la versión remota.');
            if (behind === 0) {
                return msg.reply(success('Haimiya ya está actualizado', [field('Rama', branch), 'No hay cambios nuevos en el repositorio.']));
            }

            await msg.reply(panel('Descargando nueva versión', [field('Rama', branch), field('Commits pendientes', behind), 'Aplicando actualización fast-forward.'], { icon: '↓' }));
            await git(['pull', '--ff-only'], 180000);
            codeUpdated = true;
            const install = await execFileAsync(NPM, ['install', '--no-audit', '--no-fund', '--package-lock=false'], {
                cwd: ROOT,
                timeout: 10 * 60 * 1000,
                maxBuffer: 8 * 1024 * 1024,
                windowsHide: true
            });
            if (install.stderr) console.log('[UPDATE npm]', install.stderr.slice(-3000));
            await msg.reply(success('Actualización instalada', [
                field('Rama', branch),
                field('Commits aplicados', behind),
                'Las dependencias quedaron sincronizadas.',
                'Reiniciando de forma gradual para cargar los cambios.'
            ]));
            requestGracefulRestart();
        } catch (e) {
            console.error('[UPDATE]', e?.message || e);
            const detail = String(e.stderr || e.message || 'Error desconocido').trim().slice(0, 800);
            if (codeUpdated) return msg.reply(warning('Código actualizado; dependencias pendientes', ['El repositorio ya recibió los cambios, pero la instalación de dependencias falló.', 'Ejecuta `#fix deps` cuando el servicio de paquetes esté disponible.', detail]));
            return msg.reply(error('No se pudo completar la actualización', [detail]));
        }
    }
};
