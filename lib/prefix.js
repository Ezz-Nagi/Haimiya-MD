export const DEFAULT_PREFIXES = ['#', '/', '.', '!', '-', '+'];
const clean = (v) => String(v ?? '').trim();
export function resolvePrefixes(value, splitGraphemes = null) {
    if (value === 1 || value === '1' || value === true)
        return { noPrefix: true, list: [] };
    let list = [];
    if (Array.isArray(value))
        list = value.map(clean).filter(Boolean);
    else if (typeof value === 'string' && clean(value)) {
        list = (splitGraphemes ? splitGraphemes(value) : [...value]).map(clean).filter(Boolean);
    }
    list = [...new Set(list)];
    if (!list.length)
        list = [...DEFAULT_PREFIXES];
    list.sort((a, b) => b.length - a.length);
    return { noPrefix: false, list };
}
export const escapeRegex = (s) => String(s).replace(/[.*+?^${}()|[\]\\\-]/g, '\\$&');
export function matchPrefix(text, list) {
    const t = String(text ?? '');
    for (const p of list)
        if (t.startsWith(p))
            return p;
    return '';
}
