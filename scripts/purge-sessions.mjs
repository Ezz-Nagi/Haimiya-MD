import fs from 'node:fs';
import path from 'node:path';
const root = process.cwd();
const target = String(process.argv[2] || '--subs').toLowerCase();
const folders = {
    '--subs': path.join(root, 'Sessions', 'Subs'),
    '--principals': path.join(root, 'Sessions', 'Principals'),
    '--owner': path.join(root, 'Sessions', 'Owner'),
};
if (target === '--all') {
    for (const folder of Object.values(folders))
        purgeFolder(folder, false);
}
else if (folders[target]) {
    purgeFolder(folders[target], true);
}
else {
    console.log('Uso: node scripts/purge-sessions.mjs --subs|--principals|--owner|--all');
    process.exitCode = 1;
}
function purgeFolder(folder, preserveRoot) {
    fs.mkdirSync(folder, { recursive: true });
    const entries = fs.readdirSync(folder, { withFileTypes: true });
    let removed = 0;
    for (const entry of entries) {
        const full = path.join(folder, entry.name);
        try {
            fs.rmSync(full, { recursive: true, force: true });
            removed++;
        }
        catch (error) {
            console.error(`[Haimiya] No se pudo eliminar ${full}: ${error?.message || error}`);
        }
    }
    console.log(`[Haimiya] Sesiones eliminadas en ${folder}: ${removed}${preserveRoot ? '' : ' (raíz conservada)'}`);
}
