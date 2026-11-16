const BRAND = 'HAIMIYA MÍO';
const LINE = '━━━━━━━━━━━━━━━━━━━━';

export function panel(title, rows = [], { icon = '✦', footer = 'Desarrollado por Ezz' } = {}) {
    const content = rows.filter(Boolean).map(row => `│ ${row}`).join('\n');
    return [
        `╭─〔 ${icon} ${BRAND} 〕`,
        `│ *${title}*`,
        `│ ${LINE}`,
        content,
        `╰─ ${footer}`
    ].filter(Boolean).join('\n');
}

export function success(title, rows = []) {
    return panel(title, rows, { icon: '✓', footer: 'Operación completada' });
}

export function error(title, rows = []) {
    return panel(title, rows, { icon: '×', footer: 'Revisa los datos e inténtalo de nuevo' });
}

export function warning(title, rows = []) {
    return panel(title, rows, { icon: '!', footer: 'Atención' });
}

export function info(title, rows = []) {
    return panel(title, rows, { icon: '◇', footer: 'Haimiya · Información' });
}

export function field(label, value) {
    return `• *${label}:* ${value ?? 'No disponible'}`;
}
