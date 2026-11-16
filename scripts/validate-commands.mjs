import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
const root = path.resolve(process.cwd(), 'cmds');
const errors = [];
let plugins = 0;
function walk(dir) {
    const out = [];
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        const full = path.join(dir, entry.name);
        if (entry.isDirectory())
            out.push(...walk(full));
        else if (entry.name.endsWith('.js'))
            out.push(full);
    }
    return out;
}
for (const file of walk(root)) {
    const source = fs.readFileSync(file, 'utf8');
    if (!/\bcommand\s*:/.test(source) || !/\bexport\s+default\s*(?:\{|\[)/.test(source))
        continue;
    plugins++;
    const check = spawnSync(process.execPath, ['--check', file], { encoding: 'utf8' });
    if (check.status !== 0)
        errors.push(`${path.relative(root, file)}: sintaxis inválida\n${check.stderr || check.stdout}`);
}
if (errors.length) {
    console.error(errors.join('\n'));
    process.exit(1);
}
console.log(`[Haimiya] ${plugins} plugins revisados: sintaxis JavaScript correcta.`);
