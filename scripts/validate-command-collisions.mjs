import fs from 'node:fs';
import path from 'node:path';
const root = path.resolve(process.cwd(), 'cmds');
const registry = new Map(), errors = [];
function add(token, file, field) {
    const name = String(token || '').trim().toLowerCase();
    if (!name)
        return;
    const prev = registry.get(name);
    if (prev && prev.file !== file)
        errors.push(`${name}: ${prev.file} (${prev.field}) choca con ${file} (${field})`);
    else
        registry.set(name, { file, field });
}
function walk(dir) {
    for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
        const file = path.join(dir, ent.name);
        if (ent.isDirectory()) {
            walk(file);
            continue;
        }
        if (!ent.name.endsWith('.js'))
            continue;
        const src = fs.readFileSync(file, 'utf8');
        const rel = path.relative(root, file).replace(/\\/g, '/');
        for (const field of ['command', 'aliases']) {
            const m = src.match(new RegExp(`\\b${field}\\s*:\\s*\\[([^\\]]*)\\]`));
            if (!m)
                continue;
            for (const value of m[1].matchAll(/['"]([^'"]+)['"]/g))
                add(value[1], rel, field);
        }
        if (rel === 'anime/inter.js') {
            const block = src.match(/const captions = \{([\s\S]*?)\n\}/)?.[1] || '';
            for (const value of block.matchAll(/^\s{2}([A-Za-z][\w]*):/gm))
                add(value[1], rel, 'generated command');
            const meta = src.match(/const META = \{([\s\S]*?)\n\}/)?.[1] || '';
            for (const line of meta.split('\n')) {
                const action = line.match(/^\s{2}([A-Za-z][\w]*):/);
                if (!action)
                    continue;
                const aliases = line.match(/aliases:\s*\[([^\]]*)\]/)?.[1] || '';
                for (const alias of aliases.matchAll(/['\"]([^'\"]+)['\"]/g))
                    add(alias[1], rel, `alias de ${action[1]}`);
            }
        }
    }
}
walk(root);
if (errors.length) {
    console.error('[command collisions]\n' + errors.join('\n'));
    process.exit(1);
}
console.log(`[Haimiya] ${registry.size} nombres/aliases estáticos sin colisiones.`);
