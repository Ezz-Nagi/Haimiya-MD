import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', 'cmds');
const required = ['command', 'aliases', 'desc', 'usage', 'category', 'isOwner', 'isAdmin', 'botAdmin', 'hidden'];
const errors = [], warnings = [];
function walk(dir) {
    for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
        const file = path.join(dir, ent.name);
        if (ent.isDirectory())
            walk(file);
        else if (ent.name.endsWith('.js')) {
            const src = fs.readFileSync(file, 'utf8');
            const arrayExport = /export\s+default\s+commands\s*;?/.test(src) && /const\s+commands\s*=/.test(src);
            if (!/\bcommand\s*:/.test(src) || (!/\bexport\s+default\s*(?:\{|\[)/.test(src) && !arrayExport))
                continue;
            const rel = path.relative(root, file).replace(/\\/g, '/');
            for (const key of required)
                if (!new RegExp(`\\b${key}\\s*:`).test(src))
                    errors.push(`${rel}: falta ${key}`);
            for (const key of ['desc', 'usage']) {
                const re = new RegExp(`\\b${key}\\s*:\\s*(['\"])(.*?)\\1`);
                const m = src.match(re);
                if (m && !m[2].trim())
                    errors.push(`${rel}: ${key} vacío`);
                if (!m && new RegExp(`\\b${key}\\s*:\\s*(?:null|undefined)`).test(src))
                    errors.push(`${rel}: ${key} vacío`);
            }
            if (/\bisOwner\s*:\s*false/.test(src) && /if\s*\(\s*!isCreator\s*\(/.test(src) && !/\bperm\s*:/.test(src) && !/\bisStaff\s*\(/.test(src)) {
                warnings.push(`${rel}: isOwner=false pero run() parece comprobar isCreator; revisar permiso manualmente`);
            }
            if (rel === 'anime/inter.js') {
                const capBlock = src.match(/const captions = \{([\s\S]*?)\n\}/)?.[1] || '';
                const metaBlock = src.match(/const META = \{([\s\S]*?)\n\}/)?.[1] || '';
                const keys = block => new Set([...block.matchAll(/^\s{2}([A-Za-z][\w]*):/gm)].map(x => x[1]));
                const capKeys = keys(capBlock), metaKeys = keys(metaBlock);
                for (const key of capKeys)
                    if (!metaKeys.has(key))
                        errors.push(`${rel}: falta metadata propia para ${key}`);
                for (const key of metaKeys)
                    if (!capKeys.has(key))
                        warnings.push(`${rel}: metadata sin interacción ${key}`);
            }
            const folder = rel.split('/')[0];
            const cats = [...src.matchAll(/\bcategory\s*:\s*['"]([^'"]+)['"]/g)].map(x => x[1]);
            if (cats.length && ['grupo', 'owner', 'dl', 'economy', 'anime', 'ai'].includes(folder)) {
                const expected = ({ grupo: 'group', owner: 'owner', dl: 'download', economy: 'economy', anime: 'anime', ai: 'ai' })[folder];
                if (expected && cats.some(c => c !== expected && !(folder === 'owner' && c === 'developer')) && !['grupo/staff.js'].includes(rel))
                    warnings.push(`${rel}: category distinta de la carpeta (${cats.join(', ')}, esperado orientativo: ${expected})`);
            }
        }
    }
}
walk(root);
if (warnings.length)
    console.warn('[metadata warnings]\n' + warnings.join('\n'));
if (errors.length) {
    console.error('[metadata errors]\n' + errors.join('\n'));
    process.exit(1);
}
console.log('OK: metadatos obligatorios presentes y desc/usage no vacíos.');
