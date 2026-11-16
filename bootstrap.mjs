import fs from 'node:fs';
import path from 'node:path';
import { execFileSync, execSync, spawnSync } from 'node:child_process';
const root = process.cwd();
const isWin = process.platform === 'win32';
const npm = isWin ? 'npm.cmd' : 'npm';
const log = (m) => console.log(`[Haimiya] ${m}`);
const warn = (m) => console.warn(`[Haimiya] ⚠ ${m}`);
function run(cmd, args, opts = {}) {
    try {
        execFileSync(cmd, args, { stdio: opts.silent ? 'ignore' : 'inherit', cwd: root, env: process.env, ...opts });
        return true;
    }
    catch {
        return false;
    }
}
function runShell(cmd) {
    try {
        execSync(cmd, { stdio: 'inherit', cwd: root, env: process.env, shell: true });
        return true;
    }
    catch {
        return false;
    }
}
function exists(p) {
    try {
        return fs.existsSync(p);
    }
    catch {
        return false;
    }
}
for (const dir of [
    'Sessions/Owner', 'Sessions/Subs',
    'lib/system/tmp',
    'database/whatsapp'
]) {
    fs.mkdirSync(path.join(root, dir), { recursive: true });
}
const pkgPath = path.join(root, 'package.json');
if (!exists(pkgPath)) {
    console.error('[Haimiya] No hay package.json');
    process.exit(1);
}
const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
const deps = Object.keys({ ...(pkg.dependencies || {}), ...(pkg.optionalDependencies || {}) });
const missing = deps.filter(name => {
    const parts = name.startsWith('@') ? name.split('/') : [name];
    return !exists(path.join(root, 'node_modules', ...name.split('/'), 'package.json'));
});
if (missing.length || !exists(path.join(root, 'node_modules'))) {
    log(`Instalando dependencias npm (${missing.length || 'todas'})…`);
    if (!run(npm, ['install', '--omit=dev', '--no-audit', '--no-fund'])) {
        warn('npm install falló; reintentando sin --omit=dev…');
        run(npm, ['install', '--no-audit', '--no-fund']);
    }
}
else {
    log(`npm OK (${deps.length} paquetes)`);
}
const ezzBaileysPkg = path.join(root, 'node_modules', 'ezz-baileys', 'package.json');
let ezzBaileysMeta = null;
try { ezzBaileysMeta = JSON.parse(fs.readFileSync(ezzBaileysPkg, 'utf8')); } catch {}
if (!ezzBaileysMeta || ezzBaileysMeta.name !== 'ezz-baileys') {
    console.error('[Haimiya] No se pudo cargar Ezz Baileys. Revisa la dependencia github:Ezz-Nagi/Ezz-Baileys en package.json y vuelve a ejecutar npm install.');
    process.exit(1);
}
log(`Ezz Baileys ${ezzBaileysMeta.version || 'sin versión'} detectada ✓`);
log('Las funciones multimedia conectadas se procesan mediante Haimiya API.');
let ffmpegOk = run('ffmpeg', ['-version'], { silent: true });
if (!ffmpegOk) {
    const ffStatic = path.join(root, 'node_modules', 'ffmpeg-static', isWin ? 'ffmpeg.exe' : 'ffmpeg');
    if (exists(ffStatic)) {
        process.env.FFMPEG_PATH = ffStatic;
        ffmpegOk = true;
        log(`ffmpeg-static: ${ffStatic}`);
    }
    else {
        warn('ffmpeg no encontrado. npm incluye ffmpeg-static; se usará tras install.');
    }
}
else {
    log('ffmpeg OK (sistema)');
}
const envHint = path.join(root, 'lib', 'system', 'runtime-paths.json');
try {
    const ffStatic = path.join(root, 'node_modules', 'ffmpeg-static', isWin ? 'ffmpeg.exe' : 'ffmpeg');
    fs.writeFileSync(envHint, JSON.stringify({
        ffmpeg: exists(ffStatic) ? ffStatic : (process.env.FFMPEG_PATH || null),
        ts: Date.now()
    }, null, 2));
}
catch { }
const required = [
    'index.js', 'handler.js', 'settings.js',
    'lib/serialize.js', 'lib/haimiya.js', 'lib/ytdl.js',
    'lib/system/database.js', 'lib/system/cmdsloader.js'
];
const missingFiles = required.filter(f => !exists(path.join(root, f)));
if (missingFiles.length) {
    console.error('[Haimiya] Faltan archivos:');
    missingFiles.forEach(f => console.error('  -', f));
    process.exit(1);
}
log('Bootstrap terminado ✓');
try {
    const c = path.join(root, 'cookies.txt');
    if (!fs.existsSync(c)) {
    }
}
catch { }
